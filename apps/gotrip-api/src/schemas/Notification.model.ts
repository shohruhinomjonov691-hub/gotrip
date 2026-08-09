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

		/**
		 * Optional in-app destination for notifications whose target cannot be
		 * derived from the ids below.
		 *
		 * Content notifications (like / comment) already resolve their destination
		 * from notificationGroup + tourId/articleId/commentId, so they leave this
		 * empty. Guide-application and message events have no such id, so the
		 * producer stores the route here instead. One nullable string was chosen
		 * over adding a column per future target type.
		 */
		notificationLink: {
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

		tourId: {
			type: Schema.Types.ObjectId,
			ref: 'Tour',
		},

		articleId: {
			type: Schema.Types.ObjectId,
			ref: 'BoardArticle',
		},

		commentId: {
			type: Schema.Types.ObjectId,
			ref: 'Comment',
		},
	},
	{ timestamps: true, collection: 'notifications' },
);

NotificationSchema.index({ receiverId: 1, notificationStatus: 1, createdAt: -1 });
NotificationSchema.index({ notificationType: 1 });
NotificationSchema.index({ notificationGroup: 1 });
NotificationSchema.index({ tourId: 1, articleId: 1, commentId: 1 });

export default NotificationSchema;
