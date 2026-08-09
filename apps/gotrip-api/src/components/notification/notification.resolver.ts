import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { IsNotEmpty, Length } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { NotificationService } from './notification.service';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { AllNotificationsInquiry, NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';

@InputType()
class ContactAgentInput {
	@IsNotEmpty()
	@Field(() => String)
	tourId: string;

	@IsNotEmpty()
	@Length(1, 500)
	@Field(() => String)
	message: string;
}

@Resolver()
export class NotificationResolver {
	constructor(private readonly notificationService: NotificationService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Notification)
	public async contactAgent(
		@Args('input') input: ContactAgentInput,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Notification> {
		const tourId = shapeIntoMongoObjectId(input.tourId);
		return await this.notificationService.contactAgent(memberId, tourId, input.message);
	}

	@UseGuards(AuthGuard)
	@Query(() => Notifications)
	public async getMyNotifications(
		@Args('input') input: NotificationsInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Notifications> {
		this.shapeNotificationsInquiry(input);
		return await this.notificationService.getMyNotifications(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Notification)
	public async markNotificationRead(
		@Args('notificationId') input: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Notification> {
		const notificationId = shapeIntoMongoObjectId(input);
		return await this.notificationService.markNotificationRead(memberId, notificationId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	public async markAllNotificationsRead(@AuthMember('_id') memberId: mongoose.ObjectId): Promise<boolean> {
		return await this.notificationService.markAllNotificationsRead(memberId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Notification)
	public async deleteNotification(
		@Args('notificationId') input: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Notification> {
		const notificationId = shapeIntoMongoObjectId(input);
		return await this.notificationService.deleteNotification(memberId, notificationId);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Notifications)
	public async getAllNotificationsByAdmin(@Args('input') input: AllNotificationsInquiry): Promise<Notifications> {
		this.shapeAllNotificationsInquiry(input);
		return await this.notificationService.getAllNotificationsByAdmin(input);
	}

	private shapeNotificationsInquiry(input: NotificationsInquiry): void {
		if (input.search.tourId) input.search.tourId = shapeIntoMongoObjectId(input.search.tourId);
		if (input.search.articleId) input.search.articleId = shapeIntoMongoObjectId(input.search.articleId);
		if (input.search.commentId) input.search.commentId = shapeIntoMongoObjectId(input.search.commentId);
	}

	private shapeAllNotificationsInquiry(input: AllNotificationsInquiry): void {
		this.shapeNotificationsInquiry(input);
		if (input.search.receiverId) input.search.receiverId = shapeIntoMongoObjectId(input.search.receiverId);
	}
}
