import { Field, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Notification {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => NotificationType)
	notificationType: NotificationType;

	@Field(() => NotificationStatus)
	notificationStatus: NotificationStatus;

	@Field(() => NotificationGroup)
	notificationGroup: NotificationGroup;

	@Field(() => String)
	notificationTitle: string;

	@Field(() => String, { nullable: true })
	notificationDesc?: string;

	/** In-app destination for events with no derivable target id. */
	@Field(() => String, { nullable: true })
	notificationLink?: string;

	@Field(() => String, { nullable: true })
	authorId?: mongoose.ObjectId;

	@Field(() => String)
	receiverId: mongoose.ObjectId;

	@Field(() => String, { nullable: true })
	tourId?: mongoose.ObjectId;

	@Field(() => String, { nullable: true })
	articleId?: mongoose.ObjectId;

	@Field(() => String, { nullable: true })
	commentId?: mongoose.ObjectId;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Notifications {
	@Field(() => [Notification])
	list: Notification[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
