import { Schema } from 'mongoose';
import { NotificationGroup, NotificationStatus, NotificationType } from '../libs/enums/notification.enum';

const NotificationSchema = new Schema(
	{
		notificationType: {
			type: String,
			enum: NotificationType,
			required: true,
		},

		notificationStatus: {
			type: String,
			enum: NotificationStatus,
			default: NotificationStatus.WAIT,
		},

		notificationGroup: {
			type: String,
			enum: NotificationGroup,
			required: true,
		},

		notificationTitle: {
			type: String,
			required: true,
		},

		notificationDesc: {
			type: String,
		},

		authorId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},

		receiverId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		tourId: {
			type: Schema.Types.ObjectId,
			ref: 'Tour',
		},

		bookingId: {
			type: Schema.Types.ObjectId,
			ref: 'Booking',
		},

		articleId: {
			type: Schema.Types.ObjectId,
			ref: 'BoardArticle',
		},

		paymentId: {
			type: Schema.Types.ObjectId,
			ref: 'Payment',
		},

		commentId: {
			type: Schema.Types.ObjectId,
			ref: 'Comment',
		},
	},
	{ timestamps: true, collection: 'notifications' },
);

NotificationSchema.index({ receiverId: 1, notificationStatus: 1, createdAt: -1 });
NotificationSchema.index({ memberId: 1, notificationStatus: 1, createdAt: -1 });
NotificationSchema.index({ notificationType: 1 });
NotificationSchema.index({ notificationGroup: 1 });
NotificationSchema.index({ tourId: 1, bookingId: 1, paymentId: 1, articleId: 1, commentId: 1 });

export default NotificationSchema;
