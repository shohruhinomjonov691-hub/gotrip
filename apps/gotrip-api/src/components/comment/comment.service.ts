import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { TourService } from '../tour/tour.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { MemberService } from '../member/member.service';
import { LikeService } from '../like/like.service';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { Tour } from '../../libs/dto/tour/tour';
import { BoardArticle } from '../../libs/dto/board-article/board-article';
import { Member } from '../../libs/dto/member/member';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { TourStatus } from '../../libs/enums/tour.enum';
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { MemberStatus } from '../../libs/enums/member.enum';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { LikeGroup } from '../../libs/enums/like.enum';
import { T } from '../../libs/types/common';
import { lookupMember } from '../../libs/config';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CommentService {
	constructor(
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
		@InjectModel('Tour') private readonly tourModel: Model<Tour>,
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private memberService: MemberService,
		private tourService: TourService,
		private boardArticleService: BoardArticleService,
		private likeService: LikeService,
		private notificationService: NotificationService,
	) {}

	public async createComment(memberId: ObjectId, input: CommentInput): Promise<Comment> {
		await this.validateCommentTarget(input);
		input.memberId = memberId;

		let result: Comment | null = null;
		try {
			result = await this.commentModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		switch (input.commentGroup) {
			case CommentGroup.TOUR:
				await this.tourService.tourStatsEditor({
					_id: input.commentRefId,
					targetKey: 'tourComments',
					modifier: 1,
				});
				break;

			case CommentGroup.ARTICLE:
				await this.boardArticleService.boardArticleStatsEditor({
					_id: input.commentRefId,
					targetKey: 'articleComments',
					modifier: 1,
				});
				break;

			case CommentGroup.MEMBER:
				await this.memberService.memberStatsEditor({
					_id: input.commentRefId,
					targetKey: 'memberComments',
					modifier: 1,
				});
				break;
		}

		if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
		await this.notificationService.notifyCommentCreated(result._id);
		return result;
	}

	public async updateComment(memberId: ObjectId, input: CommentUpdate): Promise<Comment> {
		const { _id } = input;
		const result = await this.commentModel
			.findOneAndUpdate(
				{
					_id: _id,
					memberId: memberId,
					commentStatus: CommentStatus.ACTIVE,
				},
				input,
				{
					new: true,
				},
			)
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async getComments(memberId: ObjectId, input: CommentsInquiry): Promise<Comments> {
		const { commentGroup, commentRefId } = input.search;
		const match: T = { commentGroup, commentRefId, commentStatus: CommentStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result: Comments[] = await this.commentModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async likeTargetComment(memberId: ObjectId, likeRefId: ObjectId): Promise<Comment> {
		const targetComment = await this.commentModel
			.findOne({
				_id: likeRefId,
				commentStatus: CommentStatus.ACTIVE,
			})
			.exec();
		if (!targetComment) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const modifier = await this.likeService.toggleLike({
			memberId,
			likeRefId,
			likeGroup: LikeGroup.COMMENT,
		});

		if (modifier === 1) {
			await this.notificationService.notifyLikeCreated(memberId, targetComment.memberId, LikeGroup.COMMENT, likeRefId);
		}

		return targetComment;
	}

	public async removeCommentByAdmin(input: ObjectId): Promise<Comment> {
		const result = await this.commentModel.findByIdAndDelete(input).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		// Keep the target's comment counter in sync when a comment is hard-deleted.
		switch (result.commentGroup) {
			case CommentGroup.TOUR:
				await this.tourService.tourStatsEditor({ _id: result.commentRefId, targetKey: 'tourComments', modifier: -1 });
				break;
			case CommentGroup.ARTICLE:
				await this.boardArticleService.boardArticleStatsEditor({
					_id: result.commentRefId,
					targetKey: 'articleComments',
					modifier: -1,
				});
				break;
			case CommentGroup.MEMBER:
				await this.memberService.memberStatsEditor({
					_id: result.commentRefId,
					targetKey: 'memberComments',
					modifier: -1,
				});
				break;
		}

		return result;
	}

	// Reject comments whose target does not exist (or is not active), so we never
	// create an orphan comment or bump a counter for a missing tour/article/member.
	private async validateCommentTarget(input: CommentInput): Promise<void> {
		switch (input.commentGroup) {
			case CommentGroup.TOUR: {
				const tour = await this.tourModel
					.findOne({ _id: input.commentRefId, tourStatus: TourStatus.ACTIVE })
					.exec();
				if (!tour) throw new BadRequestException(Message.NO_DATA_FOUND);
				break;
			}
			case CommentGroup.ARTICLE: {
				const article = await this.boardArticleModel
					.findOne({ _id: input.commentRefId, articleStatus: BoardArticleStatus.ACTIVE })
					.exec();
				if (!article) throw new BadRequestException(Message.NO_DATA_FOUND);
				break;
			}
			case CommentGroup.MEMBER: {
				const member = await this.memberModel
					.findOne({ _id: input.commentRefId, memberStatus: MemberStatus.ACTIVE })
					.exec();
				if (!member) throw new BadRequestException(Message.NO_DATA_FOUND);
				break;
			}
			default:
				throw new BadRequestException(Message.BAD_REQUEST);
		}
	}
}
