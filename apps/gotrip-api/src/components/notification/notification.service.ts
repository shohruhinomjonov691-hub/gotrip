import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Booking } from '../../libs/dto/booking/booking';
import { BoardArticle } from '../../libs/dto/board-article/board-article';
import { Comment } from '../../libs/dto/comment/comment';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import {
	AllNotificationsInquiry,
	NotificationInput,
	NotificationsInquiry,
} from '../../libs/dto/notification/notification.input';
import { Payment } from '../../libs/dto/payment/payment';
import { Tour } from '../../libs/dto/tour/tour';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../libs/enums/notification.enum';
import { T } from '../../libs/types/common';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Injectable()
export class NotificationService {
	constructor(
		@InjectModel('Notification') private readonly notificationModel: Model<Notification>,
		@InjectModel('Booking') private readonly bookingModel: Model<Booking>,
		@InjectModel('Payment') private readonly paymentModel: Model<Payment>,
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
		@InjectModel('Tour') private readonly tourModel: Model<Tour>,
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
	) {}

	public async createNotification(input: NotificationInput): Promise<Notification> {
		if (input.authorId && String(input.authorId) === String(input.receiverId)) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		try {
			return await this.notificationModel.create({
				...input,
				memberId: input.memberId ?? input.receiverId,
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
		if (input.search.memberId) match.memberId = shapeIntoMongoObjectId(input.search.memberId);

		return await this.getNotificationsByMatch(match, input);
	}

	public async notifyAgentApproved(memberId: ObjectId): Promise<Notification | null> {
		return await this.createSystemNotification({
			notificationType: NotificationType.AGENT_APPROVED,
			notificationGroup: NotificationGroup.MEMBER,
			notificationTitle: 'Agent request approved',
			notificationDesc: 'Your agent request has been approved.',
			receiverId: memberId,
		});
	}

	public async notifyAgentRejected(memberId: ObjectId): Promise<Notification | null> {
		return await this.createSystemNotification({
			notificationType: NotificationType.AGENT_REJECTED,
			notificationGroup: NotificationGroup.MEMBER,
			notificationTitle: 'Agent request rejected',
			notificationDesc: 'Your agent request has been rejected.',
			receiverId: memberId,
		});
	}

	public async notifyBookingCreated(bookingId: ObjectId): Promise<Notification | null> {
		const booking = await this.bookingModel.findById(bookingId).exec();
		if (!booking) return null;

		return await this.createSystemNotification({
			notificationType: NotificationType.BOOKING_CREATED,
			notificationGroup: NotificationGroup.BOOKING,
			notificationTitle: 'New booking created',
			notificationDesc: `Booking ${booking.bookingNumber} was created.`,
			authorId: booking.memberId,
			receiverId: booking.agentId,
			bookingId: booking._id,
			tourId: booking.tourId,
		});
	}

	public async notifyPaymentSuccess(paymentId: ObjectId): Promise<Notification | null> {
		const payment = await this.paymentModel.findById(paymentId).exec();
		if (!payment) return null;

		return await this.createSystemNotification({
			notificationType: NotificationType.PAYMENT_SUCCESS,
			notificationGroup: NotificationGroup.PAYMENT,
			notificationTitle: 'Payment successful',
			notificationDesc: 'Your payment was marked successful.',
			receiverId: payment.memberId,
			paymentId: payment._id,
			bookingId: payment.bookingId,
			tourId: payment.tourId,
		});
	}

	public async notifyPaymentFailed(paymentId: ObjectId): Promise<Notification | null> {
		const payment = await this.paymentModel.findById(paymentId).exec();
		if (!payment) return null;

		return await this.createSystemNotification({
			notificationType: NotificationType.PAYMENT_FAILED,
			notificationGroup: NotificationGroup.PAYMENT,
			notificationTitle: 'Payment failed',
			notificationDesc: 'Your payment was marked failed.',
			receiverId: payment.memberId,
			paymentId: payment._id,
			bookingId: payment.bookingId,
			tourId: payment.tourId,
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
		if (search.bookingId) match.bookingId = shapeIntoMongoObjectId(search.bookingId);
		if (search.paymentId) match.paymentId = shapeIntoMongoObjectId(search.paymentId);
		if (search.articleId) match.articleId = shapeIntoMongoObjectId(search.articleId);
		if (search.commentId) match.commentId = shapeIntoMongoObjectId(search.commentId);
		if (search.startDate || search.endDate) {
			match.createdAt = {};
			if (search.startDate) match.createdAt.$gte = search.startDate;
			if (search.endDate) match.createdAt.$lte = search.endDate;
		}
	}

	private async resolveCommentReceiver(comment: Comment): Promise<ObjectId | null> {
		if (comment.parentCommentId) {
			const parentComment = await this.commentModel.findById(comment.parentCommentId).exec();
			return parentComment?.memberId ?? null;
		}

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
		if (comment.parentCommentId) return NotificationGroup.COMMENT;
		if (comment.commentGroup === CommentGroup.TOUR) return NotificationGroup.TOUR;
		if (comment.commentGroup === CommentGroup.ARTICLE) return NotificationGroup.ARTICLE;
		if (comment.commentGroup === CommentGroup.MEMBER) return NotificationGroup.MEMBER;

		return NotificationGroup.COMMENT;
	}
}
