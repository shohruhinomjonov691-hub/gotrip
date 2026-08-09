import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Conversation, Conversations, Message, Messages } from '../../libs/dto/message/message';
import { ConversationsInquiry, MessageInput, MessagesInquiry } from '../../libs/dto/message/message.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MessageService } from './message.service';

/**
 * Every operation here is AuthGuard-protected and scoped to the caller — there
 * is no admin-wide or global message read path by design.
 */
@Resolver()
export class MessageResolver {
	constructor(private readonly messageService: MessageService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Message)
	public async sendMessage(
		@Args('input') input: MessageInput,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Message> {
		input.receiverId = shapeIntoMongoObjectId(input.receiverId);
		return await this.messageService.sendMessage(memberId, input);
	}

	/** Opens (or lazily creates) the thread with a member — used by search. */
	@UseGuards(AuthGuard)
	@Mutation(() => Conversation)
	public async startConversation(
		@Args('partnerId') partnerId: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Conversation> {
		return await this.messageService.getOrCreateConversation(memberId, shapeIntoMongoObjectId(partnerId));
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	public async markConversationRead(
		@Args('conversationId') conversationId: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<boolean> {
		return await this.messageService.markConversationRead(memberId, shapeIntoMongoObjectId(conversationId));
	}

	@UseGuards(AuthGuard)
	@Query(() => Conversations)
	public async getMyConversations(
		@Args('input') input: ConversationsInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Conversations> {
		return await this.messageService.getMyConversations(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Messages)
	public async getMessages(
		@Args('input') input: MessagesInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Messages> {
		input.conversationId = shapeIntoMongoObjectId(input.conversationId);
		return await this.messageService.getMessages(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Int)
	public async getUnreadMessageCount(@AuthMember('_id') memberId: mongoose.ObjectId): Promise<number> {
		return await this.messageService.getUnreadMessageCount(memberId);
	}
}
