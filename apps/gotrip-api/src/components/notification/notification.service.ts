import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { BoardArticle } from '../../libs/dto/board-article/board-article';
import { Comment } from '../../libs/dto/comment/comment';
import { Member } from '../../libs/dto/member/member';
import { Notice } from '../../libs/dto/notice/notice';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import {
	AllNotificationsInquiry,
	NotificationInput,
	NotificationsInquiry,
} from '../../libs/dto/notification/notification.input';
import { Tour } from '../../libs/dto/tour/tour';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { MemberStatus } from '../../libs/enums/member.enum';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../libs/enums/notification.enum';
import { TourStatus } from '../../libs/enums/tour.enum';
import { T } from '../../libs/types/common';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Injectable()
export class NotificationService {
	constructor(
		@InjectModel('Notification') private readonly notificationModel: Model<Notification>,
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
		@InjectModel('Tour') private readonly tourModel: Model<Tour>,
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}

	public async createNotification(input: NotificationInput): Promise<Notification> {
		if (input.authorId && String(input.authorId) === String(input.receiverId)) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		try {
			return await this.notificationModel.create({
				...input,
				notificationStatus: NotificationStatus.WAIT,
			});
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getMyNotifications(memberId: ObjectId, input: NotificationsInquiry): Promise<Notifications> {
		const match: T = { receiverId: memberId };
		if (!input.search.notificationStatus) match.notificationStatus = { $ne: NotificationStatus.DELETED };
		this.shapeNotificationMatchQuery(match, input.search);
		return await this.getNotificationsByMatch(match, input);
	}

	public async markNotificationRead(memberId: ObjectId, notificationId: ObjectId): Promise<Notification> {
		const result = await this.notificationModel
			.findOneAndUpdate(
				{
					_id: notificationId,
					receiverId: memberId,
					notificationStatus: { $ne: NotificationStatus.DELETED },
				},
				{ notificationStatus: NotificationStatus.READ },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async markAllNotificationsRead(memberId: ObjectId): Promise<boolean> {
		await this.notificationModel
			.updateMany(
				{
					receiverId: memberId,
					notificationStatus: NotificationStatus.WAIT,
				},
				{ notificationStatus: NotificationStatus.READ },
			)
			.exec();

		return true;
	}

	public async deleteNotification(memberId: ObjectId, notificationId: ObjectId): Promise<Notification> {
		const result = await this.notificationModel
			.findOneAndUpdate(
				{
					_id: notificationId,
					receiverId: memberId,
					notificationStatus: { $ne: NotificationStatus.DELETED },
				},
				{ notificationStatus: NotificationStatus.DELETED },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async getAllNotificationsByAdmin(input: AllNotificationsInquiry): Promise<Notifications> {
		const match: T = {};
		this.shapeNotificationMatchQuery(match, input.search);
		if (input.search.receiverId) match.receiverId = shapeIntoMongoObjectId(input.search.receiverId);

		return await this.getNotificationsByMatch(match, input);
	}

	public async contactAgent(memberId: ObjectId, tourId: ObjectId, message: string): Promise<Notification> {
		const tour = await this.tourModel.findOne({ _id: tourId, tourStatus: TourStatus.ACTIVE }).exec();
		if (!tour) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (String(tour.memberId) === String(memberId)) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		return await this.createNotification({
			notificationType: NotificationType.CONTACT_AGENT,
			notificationGroup: NotificationGroup.TOUR,
			notificationTitle: 'New tour inquiry',
			notificationDesc: message,
			authorId: memberId,
			receiverId: tour.memberId,
			tourId,
		});
	}

	public async notifyCommentCreated(commentId: ObjectId): Promise<Notification | null> {
		const comment = await this.commentModel
			.findOne({
				_id: commentId,
				commentStatus: CommentStatus.ACTIVE,
			})
			.exec();
		if (!comment) return null;

		const receiverId = await this.resolveCommentReceiver(comment);
		if (!receiverId) return null;

		return await this.createSystemNotification({
			notificationType: NotificationType.COMMENT_CREATED,
			notificationGroup: this.resolveCommentNotificationGroup(comment),
			notificationTitle: 'New comment created',
			notificationDesc: 'A new comment was created.',
			authorId: comment.memberId,
			receiverId,
			commentId: comment._id,
			tourId: comment.commentGroup === CommentGroup.TOUR ? comment.commentRefId : undefined,
			articleId: comment.commentGroup === CommentGroup.ARTICLE ? comment.commentRefId : undefined,
		});
	}

	public async notifyFollowCreated(followerId: ObjectId, followingId: ObjectId): Promise<Notification | null> {
		return await this.createSystemNotification({
			notificationType: NotificationType.FOLLOW_CREATED,
			notificationGroup: NotificationGroup.MEMBER,
			notificationTitle: 'New follower',
			notificationDesc: 'A member started following you.',
			authorId: followerId,
			receiverId: followingId,
		});
	}

	public async notifyLikeCreated(
		authorId: ObjectId,
		receiverId: ObjectId,
		likeGroup: LikeGroup,
		likeRefId: ObjectId,
	): Promise<Notification | null> {
		const notificationGroup = this.resolveLikeNotificationGroup(likeGroup);
		if (!notificationGroup) return null;

		return await this.createSystemNotification({
			notificationType: NotificationType.LIKE_CREATED,
			notificationGroup,
			notificationTitle: 'New like',
			notificationDesc: 'A member liked your content.',
			authorId,
			receiverId,
			tourId: likeGroup === LikeGroup.TOUR ? likeRefId : undefined,
			articleId: likeGroup === LikeGroup.ARTICLE ? likeRefId : undefined,
			commentId: likeGroup === LikeGroup.COMMENT ? likeRefId : undefined,
		});
	}

	public async notifyAdminNoticeCreated(notice: Notice): Promise<void> {
		try {
			const members = await this.memberModel
				.find({ memberStatus: MemberStatus.ACTIVE })
				.select('_id')
				.lean()
				.exec();
			if (!members.length) return;

			await this.notificationModel.insertMany(
				members.map((member) => ({
					notificationType: NotificationType.ADMIN_NOTICE,
					notificationGroup: NotificationGroup.NOTICE,
					notificationStatus: NotificationStatus.WAIT,
					notificationTitle: notice.noticeTitle,
					notificationDesc: notice.noticeContent.slice(0, 500),
					receiverId: member._id,
				})),
			);
		} catch (err) {
			console.log('Warning, admin notice notifications were not created:', err);
		}
	}

	private async createSystemNotification(input: NotificationInput): Promise<Notification | null> {
		try {
			if (input.authorId && String(input.authorId) === String(input.receiverId)) return null;
			return await this.createNotification(input);
		} catch (err) {
			console.log('Warning, notification was not created:', err);
			return null;
		}
	}

	private async getNotificationsByMatch(
		match: T,
		input: NotificationsInquiry | AllNotificationsInquiry,
	): Promise<Notifications> {
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		const result = await this.notificationModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	private shapeNotificationMatchQuery(match: T, search: T): void {
		if (search.notificationStatus) match.notificationStatus = search.notificationStatus;
		if (search.notificationType) match.notificationType = search.notificationType;
		if (search.notificationGroup) match.notificationGroup = search.notificationGroup;
		if (search.tourId) match.tourId = shapeIntoMongoObjectId(search.tourId);
		if (search.articleId) match.articleId = shapeIntoMongoObjectId(search.articleId);
		if (search.commentId) match.commentId = shapeIntoMongoObjectId(search.commentId);
		if (search.startDate || search.endDate) {
			match.createdAt = {};
			if (search.startDate) match.createdAt.$gte = search.startDate;
			if (search.endDate) match.createdAt.$lte = search.endDate;
		}
	}

	private async resolveCommentReceiver(comment: Comment): Promise<ObjectId | null> {
		switch (comment.commentGroup) {
			case CommentGroup.TOUR: {
				const tour = await this.tourModel.findById(comment.commentRefId).exec();
				return tour?.memberId ?? null;
			}

			case CommentGroup.ARTICLE: {
				const article = await this.boardArticleModel.findById(comment.commentRefId).exec();
				return article?.memberId ?? null;
			}

			case CommentGroup.MEMBER:
				return comment.commentRefId;

			default:
				return null;
		}
	}

	private resolveCommentNotificationGroup(comment: Comment): NotificationGroup {
		if (comment.commentGroup === CommentGroup.TOUR) return NotificationGroup.TOUR;
		if (comment.commentGroup === CommentGroup.ARTICLE) return NotificationGroup.ARTICLE;
		if (comment.commentGroup === CommentGroup.MEMBER) return NotificationGroup.MEMBER;

		return NotificationGroup.COMMENT;
	}

	private resolveLikeNotificationGroup(likeGroup: LikeGroup): NotificationGroup | null {
		if (likeGroup === LikeGroup.MEMBER) return NotificationGroup.MEMBER;
		if (likeGroup === LikeGroup.TOUR) return NotificationGroup.TOUR;
		if (likeGroup === LikeGroup.ARTICLE) return NotificationGroup.ARTICLE;
		if (likeGroup === LikeGroup.COMMENT) return NotificationGroup.COMMENT;

		return null;
	}
}
