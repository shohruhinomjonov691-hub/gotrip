import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import * as mongoose from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import {
	AIConversation,
	AIConversations,
	AIGuestReply,
	AIMessage,
	AIMessages,
} from '../../libs/dto/conversation/conversation';
import {
	ConversationsInquiry,
	MessagesInquiry,
	SendGuestMessageInput,
	SendMessageInput,
} from '../../libs/dto/conversation/conversation.input';
import { ConversationUpdate } from '../../libs/dto/conversation/conversation.update';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { SocketGateway } from '../../socket/socket.gateway';
import { ConversationService } from './conversation.service';
import { GoTripAIService } from './gotrip-ai.service';
import type { GoTripAIStreamEvent } from './streaming/streaming.types';

/**
 * Phase 4.5 — the resolver Phase 4.2/4.3/4.4 deliberately left unbuilt (see
 * conversation.module.ts's header comment): every operation here is a thin
 * pass-through to GoTripAIService/ConversationService, which stay exactly as
 * they were verified in Phase 4.4 — nothing about the request flow, context
 * building, or persistence changes, only that it's now reachable.
 *
 * Streaming reuses the private-messaging feature's existing raw WebSocket
 * gateway (socket/socket.gateway.ts) instead of adding GraphQL subscriptions
 * or SSE — exactly the option streaming.types.ts's header comment called out
 * as already fitting "without new infrastructure". `streamGoTripAIMessage`
 * forwards each chunk to the caller's own open sockets via
 * `SocketGateway.emitToMember`, then resolves with the final persisted
 * AIMessage once the stream completes — the mutation's return value is the
 * source of truth if a client never opened a socket at all (e.g. a slow
 * connection), the socket frames are purely a faster, incremental preview.
 */
/**
 * Per-IP (the throttler's default tracker, req.ip) limit for the
 * unauthenticated guest mutation. In-memory storage: per process, reset on
 * restart, and behind a reverse proxy without `trust proxy` every guest
 * shares the proxy's IP — see docs/ai/COMPLETED_TASKS.md.
 */
export const GUEST_AI_THROTTLE = { default: { limit: 5, ttl: 60000 } };

@Resolver()
export class ConversationResolver {
	constructor(
		private readonly gotripAIService: GoTripAIService,
		private readonly conversationService: ConversationService,
		private readonly socketGateway: SocketGateway,
	) {}

	@UseGuards(AuthGuard)
	@Mutation(() => AIMessage)
	public async sendGoTripAIMessage(
		@Args('input') input: SendMessageInput,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<AIMessage> {
		return await this.gotripAIService.sendMessage(memberId, input);
	}

	/** No auth guard on purpose — guests are the audience. Stateless: nothing is persisted, context is public-only. */
	@Throttle(GUEST_AI_THROTTLE)
	@Mutation(() => AIGuestReply)
	public async sendGoTripAIGuestMessage(@Args('input') input: SendGuestMessageInput): Promise<AIGuestReply> {
		return await this.gotripAIService.sendGuestMessage(input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => AIMessage)
	public async streamGoTripAIMessage(
		@Args('input') input: SendMessageInput,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<AIMessage> {
		return await this.gotripAIService.streamMessage(memberId, input, (event: GoTripAIStreamEvent) => {
			this.socketGateway.emitToMember(memberId.toString(), { event: 'gotripAiStream', ...event });
		});
	}

	@UseGuards(AuthGuard)
	@Query(() => AIConversations)
	public async getGoTripAIConversations(
		@Args('input') input: ConversationsInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<AIConversations> {
		return await this.conversationService.getConversations(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => AIConversation)
	public async getGoTripAIConversation(
		@Args('conversationId') conversationId: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<AIConversation> {
		return await this.conversationService.getConversation(memberId, shapeIntoMongoObjectId(conversationId));
	}

	@UseGuards(AuthGuard)
	@Query(() => AIMessages)
	public async getGoTripAIMessages(
		@Args('input') input: MessagesInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<AIMessages> {
		return await this.conversationService.getMessages(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => AIConversation)
	public async updateGoTripAIConversation(
		@Args('input') input: ConversationUpdate,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<AIConversation> {
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.conversationService.updateConversation(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => AIConversation)
	public async deleteGoTripAIConversation(
		@Args('conversationId') conversationId: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<AIConversation> {
		return await this.conversationService.deleteConversation(memberId, shapeIntoMongoObjectId(conversationId));
	}
}
