import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { TourService } from '../tour/tour.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { MemberService } from '../member/member.service';
import { LikeService } from '../like/like.service';
import { DestinationService } from '../destination/destination.service';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { LikeGroup } from '../../libs/enums/like.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { lookupMember } from '../../libs/config';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CommentService {
	constructor(
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
		private memberService: MemberService,
		private tourService: TourService,
		private boardArticleService: BoardArticleService,
		private likeService: LikeService,
		private destinationService: DestinationService,
		private notificationService: NotificationService,
	) {}

	public async createComment(memberId: ObjectId, input: CommentInput): Promise<Comment> {
		input.memberId = memberId;
		this.validateCommentReview(input);

		let result: Comment | null = null;
		try {
			result = await this.commentModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		if (!input.parentCommentId) {
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

				case CommentGroup.DESTINATION:
					await this.destinationService.destinationStatsEditor({
						_id: input.commentRefId,
						targetKey: 'destinationComments',
						modifier: 1,
					});
					if (input.rating !== undefined) await this.recalculateDestinationRating(input.commentRefId);
					break;
			}
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
		if (
			input.rating !== undefined &&
			result.commentGroup === CommentGroup.DESTINATION &&
			!result.parentCommentId
		) {
			await this.recalculateDestinationRating(result.commentRefId);
		}
		return result;
	}

	public async getComments(memberId: ObjectId, input: CommentsInquiry): Promise<Comments> {
		const { commentGroup, commentRefId, parentCommentId } = input.search;
		const match: T = { commentGroup, commentRefId, commentStatus: CommentStatus.ACTIVE };
		if (parentCommentId) {
			match.parentCommentId = parentCommentId;
		} else {
			match.$or = [{ parentCommentId: { $exists: false } }, { parentCommentId: null }];
		}
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
							// meLiked
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

		const result = await this.commentStatsEditor({
			_id: likeRefId,
			targetKey: 'commentLikes',
			modifier,
		});
		if (modifier === 1) {
			await this.notificationService.notifyLikeCreated(memberId, targetComment.memberId, LikeGroup.COMMENT, likeRefId);
		}

		return result;
	}

	public async commentStatsEditor(input: StatisticModifier): Promise<Comment> {
		const { _id, targetKey, modifier } = input;
		const result = await this.commentModel
			.findOneAndUpdate(
				{
					_id,
					commentStatus: CommentStatus.ACTIVE,
				},
				{ $inc: { [targetKey]: modifier } },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async removeCommentByAdmin(input: ObjectId): Promise<Comment> {
		const target = await this.commentModel.findById(input).exec();
		const result = await this.commentModel.findByIdAndDelete(input).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		if (
			target?.commentGroup === CommentGroup.DESTINATION &&
			!target.parentCommentId &&
			target.rating !== undefined
		) {
			await this.recalculateDestinationRating(target.commentRefId);
		}
		return result;
	}

	private validateCommentReview(input: CommentInput): void {
		if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		if (input.commentGroup === CommentGroup.TOUR && !input.parentCommentId && input.rating === undefined) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}
	}

	private async recalculateDestinationRating(destinationId: ObjectId): Promise<void> {
		const result = await this.commentModel
			.aggregate([
				{
					$match: {
						commentGroup: CommentGroup.DESTINATION,
						commentRefId: destinationId,
						commentStatus: CommentStatus.ACTIVE,
						rating: { $gte: 1, $lte: 5 },
						$or: [{ parentCommentId: { $exists: false } }, { parentCommentId: null }],
					},
				},
				{ $group: { _id: '$commentRefId', averageRating: { $avg: '$rating' } } },
			])
			.exec();

		const destinationRating = result.length ? Math.round(result[0].averageRating * 10) / 10 : 0;
		await this.destinationService.updateDestinationRating(destinationId, destinationRating);
	}
}
