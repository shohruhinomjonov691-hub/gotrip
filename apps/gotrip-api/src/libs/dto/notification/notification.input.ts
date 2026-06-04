import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { availableNotificationSorts } from '../../config';
import { Direction } from '../../enums/common.enum';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';

@InputType()
export class NotificationInput {
	@IsNotEmpty()
	@Field(() => NotificationType)
	notificationType: NotificationType;

	@IsNotEmpty()
	@Field(() => NotificationGroup)
	notificationGroup: NotificationGroup;

	@IsNotEmpty()
	@Length(1, 120)
	@Field(() => String)
	notificationTitle: string;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	notificationDesc?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	authorId?: mongoose.ObjectId;

	@IsNotEmpty()
	@Field(() => String)
	receiverId: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	tourId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	bookingId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	paymentId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	articleId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	commentId?: mongoose.ObjectId;
}

@InputType()
class NotificationSearch {
	@IsOptional()
	@Field(() => NotificationStatus, { nullable: true })
	notificationStatus?: NotificationStatus;

	@IsOptional()
	@Field(() => NotificationType, { nullable: true })
	notificationType?: NotificationType;

	@IsOptional()
	@Field(() => NotificationGroup, { nullable: true })
	notificationGroup?: NotificationGroup;

	@IsOptional()
	@Field(() => String, { nullable: true })
	tourId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	bookingId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	paymentId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	articleId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	commentId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	startDate?: Date;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	endDate?: Date;
}

@InputType()
export class NotificationsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableNotificationSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => NotificationSearch)
	search: NotificationSearch;
}

@InputType()
class AdminNotificationSearch extends NotificationSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	receiverId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: mongoose.ObjectId;
}

@InputType()
export class AllNotificationsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableNotificationSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AdminNotificationSearch)
	search: AdminNotificationSearch;
}
