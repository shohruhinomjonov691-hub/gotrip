import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { AIConversation, AIGuestReply, AIMessage } from '../../libs/dto/conversation/conversation';
import {
	GUEST_HISTORY_CONTENT_MAX_LENGTH,
	GUEST_HISTORY_MAX_ITEMS,
	GUEST_HISTORY_ROLES,
	SendGuestMessageInput,
	SendMessageInput,
} from '../../libs/dto/conversation/conversation.input';
import { MessageRole, MessageStatus } from '../../libs/enums/conversation.enum';
import { Locale } from '../../libs/enums/locale.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { ConversationService } from './conversation.service';
import { ConversationContextService } from './conversation-context.service';
import { PromptBuilderService } from './prompt-builder.service';
import { ToolRegistryService } from './tools/tool-registry.service';
import { CHAT_PROVIDER } from './providers/chat-provider.interface';
import type { ChatMessage, ChatProvider } from './providers/chat-provider.interface';
import type { GoTripAIContextSourceKey, GoTripAIContextSources } from '../../libs/dto/conversation/context.types';
import type { GoTripAIStreamEvent, GoTripAIStreamPublisher } from './streaming/streaming.types';

/** Placeholder shown while no ChatProvider is bound — same transparency convention as the frontend's Phase 4.1 placeholder reply, and as AiTranslationService's graceful-failure logging. */
const PROVIDER_NOT_CONNECTED_MESSAGE =
	'GoTrip AI is not connected to an AI provider yet. This will be available once a provider is configured.';

const GENERIC_FAILURE_MESSAGE = 'GoTrip AI could not generate a reply just now. Please try again.';

/**
 * Guest turns only ever see catalog/community content — never userProfile,
 * wishlist, recentlyViewed or bookingHistory, even though those collectors
 * already return empty for a null memberId. Whitelisting the sources keeps
 * that guarantee from depending on each collector's null-check.
 */
export const GUEST_CONTEXT_SOURCES: GoTripAIContextSourceKey[] = [
	'tours',
	'destinations',
	'articles',
	'notices',
	'faq',
	'guides',
];
export const GUEST_MAX_TOKENS = 400;
export const GUEST_TIMEOUT_MS = 30_000;
export const GUEST_MAX_RETRIES = 0;

/**
 * The top-level facade — the one entry point a future resolver calls
 * (`GoTripAIService.sendMessage`), and the only class that talks to all
 * three of ConversationService / ConversationContextService /
 * PromptBuilderService / ToolRegistryService / ChatProvider in the same
 * place. Everything below it stays single-purpose and independently
 * testable; this is where the request flow is actually assembled.
 */
@Injectable()
export class GoTripAIService {
	private readonly logger = new Logger(GoTripAIService.name);

	constructor(
		private readonly conversationService: ConversationService,
		private readonly contextService: ConversationContextService,
		private readonly promptBuilder: PromptBuilderService,
		private readonly toolRegistry: ToolRegistryService,
		// @Optional(): no binding exists for CHAT_PROVIDER yet (see conversation.module.ts)
		// so this resolves to undefined — the ONLY thing that changes once a provider
		// is registered is that this stops being undefined.
		@Optional() @Inject(CHAT_PROVIDER) private readonly chatProvider?: ChatProvider,
	) {}

	/**
	 * Request flow:
	 *  1. Resolve or create the Conversation (ConversationService).
	 *  2. Build context (ConversationContextService) and the prompt
	 *     (PromptBuilderService) from EXISTING history — deliberately before
	 *     step 3, so the turn being sent now is never fetched back out of
	 *     history and appended a second time.
	 *  3. Persist the user's Message for real — happens unconditionally, so a
	 *     missing/failing provider can never lose what the traveller typed.
	 *  4. If no ChatProvider is bound, persist one transparent SYSTEM message
	 *     and return — never fabricate an assistant reply (mirrors the
	 *     frontend's Phase 4.1 placeholder and AiTranslationService's
	 *     catch-and-log-never-throw failure handling).
	 *  5. Once a provider exists: hand the tool registry's definitions + the
	 *     assembled messages to ChatProvider.complete(), persist the
	 *     assistant's reply.
	 */
	public async sendMessage(memberId: ObjectId, input: SendMessageInput): Promise<AIMessage> {
		const locale = input.locale ?? Locale.en;
		const conversation = await this.resolveConversation(memberId, input, locale);
		const conversationId = conversation._id;

		// Build the prompt from EXISTING history before persisting this turn's
		// user message — getMessages() would otherwise include the turn we're
		// about to append, and buildMessages() appends `input.content` again on
		// top of that, sending the same turn to the provider twice.
		const { messages } = await this.prepareRequest(memberId, conversation, input, locale);

		await this.conversationService.appendMessage(conversationId, memberId, MessageRole.USER, input.content);

		if (!this.chatProvider) {
			this.logger.warn(`sendMessage called with no ChatProvider bound (conversation ${conversation._id}).`);
			return this.conversationService.appendMessage(
				conversationId,
				memberId,
				MessageRole.SYSTEM,
				PROVIDER_NOT_CONNECTED_MESSAGE,
				{ status: MessageStatus.FAILED },
			);
		}

		return this.completeWithProvider(conversationId, memberId, messages, locale, this.chatProvider);
	}

	/**
	 * Streaming counterpart of sendMessage — same first two steps (resolve
	 * conversation, persist the user's turn unconditionally), then instead of
	 * a single provider.complete() call: create the assistant Message up
	 * front as status STREAMING with empty content, forward every
	 * ChatStreamChunk from provider.streamComplete() to `onEvent` as a
	 * GoTripAIStreamEvent carrying that same messageId, and finalize the SAME
	 * row (ConversationService.finalizeStreamingMessage) once the stream
	 * ends. No new Message row is ever created mid-stream — a history read
	 * mid-flight sees the row with whatever partial content has landed so
	 * far, and it's already the final row once COMPLETE.
	 *
	 * Not wired to any transport (GraphQL subscription/SSE/socket) in this
	 * phase — `onEvent` is a plain callback a future resolver/gateway
	 * supplies; see streaming/streaming.types.ts for the documented options.
	 */
	public async streamMessage(
		memberId: ObjectId,
		input: SendMessageInput,
		onEvent: GoTripAIStreamPublisher,
	): Promise<AIMessage> {
		const locale = input.locale ?? Locale.en;
		const conversation = await this.resolveConversation(memberId, input, locale);
		const conversationId = conversation._id;

		// Same ordering fix as sendMessage: build from history BEFORE persisting this turn.
		const { messages } = await this.prepareRequest(memberId, conversation, input, locale);

		await this.conversationService.appendMessage(conversationId, memberId, MessageRole.USER, input.content);

		if (!this.chatProvider) {
			this.logger.warn(`streamMessage called with no ChatProvider bound (conversation ${conversation._id}).`);
			const placeholder = await this.conversationService.appendMessage(
				conversationId,
				memberId,
				MessageRole.SYSTEM,
				PROVIDER_NOT_CONNECTED_MESSAGE,
				{ status: MessageStatus.FAILED },
			);
			onEvent({
				conversationId: conversation._id.toString(),
				messageId: placeholder._id.toString(),
				delta: PROVIDER_NOT_CONNECTED_MESSAGE,
				done: true,
			});
			return placeholder;
		}

		const pending = await this.conversationService.appendMessage(conversationId, memberId, MessageRole.ASSISTANT, '', {
			status: MessageStatus.STREAMING,
		});

		try {
			const result = await this.chatProvider.streamComplete(
				{ messages, locale, tools: this.toolRegistry.getDefinitions() },
				(chunk) => {
					const event: GoTripAIStreamEvent = {
						conversationId: conversation._id.toString(),
						messageId: pending._id.toString(),
						delta: chunk.delta,
						done: chunk.done,
						toolCall: chunk.toolCall,
					};
					onEvent(event);
				},
			);

			return this.conversationService.finalizeStreamingMessage(
				pending._id,
				result.content,
				MessageStatus.COMPLETE,
				result.tokenUsage,
			);
		} catch (err) {
			this.logger.error(`ChatProvider "${this.chatProvider.name}" streaming failed: ${(err as Error).message}`);
			const failureContent = 'GoTrip AI could not generate a reply just now. Please try again.';
			onEvent({
				conversationId: conversation._id.toString(),
				messageId: pending._id.toString(),
				delta: failureContent,
				done: true,
			});
			return this.conversationService.finalizeStreamingMessage(pending._id, failureContent, MessageStatus.FAILED);
		}
	}

	/**
	 * Unauthenticated, stateless counterpart of sendMessage. Nothing is read
	 * from or written to AIConversation/AIMessage: the client replays its own
	 * recent turns (`history`), which are treated as untrusted — re-filtered to
	 * USER/ASSISTANT, re-capped in count and length here even though the DTO
	 * already validated them. Context is public sources only (still read from
	 * the DB through the public services, including their member/like/view
	 * lookups; PromptBuilderService strips those before the prompt). The provider
	 * call is tighter than the authenticated one (smaller reply, short
	 * timeout, no retries) so one guest request has a bounded cost/latency.
	 * Never throws on a provider failure — returns a FAILED reply instead.
	 */
	public async sendGuestMessage(input: SendGuestMessageInput): Promise<AIGuestReply> {
		const locale = input.locale ?? Locale.en;

		if (!this.chatProvider) {
			this.logger.warn('sendGuestMessage called with no ChatProvider bound.');
			return this.guestFailure(PROVIDER_NOT_CONNECTED_MESSAGE);
		}

		// No currentPage: it would be client text inside the SYSTEM prompt (see SendGuestMessageInput).
		const context = await this.contextService.buildContext({
			memberId: null,
			locale,
			sources: GUEST_CONTEXT_SOURCES,
		});

		const history = (input.history ?? [])
			.filter((message) => GUEST_HISTORY_ROLES.includes(message.role) && typeof message.content === 'string')
			.slice(-GUEST_HISTORY_MAX_ITEMS)
			.map((message) => ({ role: message.role, content: message.content.slice(0, GUEST_HISTORY_CONTENT_MAX_LENGTH) }));

		const messages = this.promptBuilder.buildMessages(history, input.content, context);

		try {
			const result = await this.chatProvider.complete({
				messages,
				locale,
				tools: this.toolRegistry.getDefinitions(),
				maxTokens: GUEST_MAX_TOKENS,
				timeoutMs: GUEST_TIMEOUT_MS,
				maxRetries: GUEST_MAX_RETRIES,
			});
			if (!result.content?.trim()) {
				this.logger.warn(`Guest reply was empty (finishReason: ${result.finishReason ?? 'unknown'}).`);
				return this.guestFailure(GENERIC_FAILURE_MESSAGE);
			}
			return { role: MessageRole.ASSISTANT, content: result.content, status: MessageStatus.COMPLETE };
		} catch (err) {
			this.logger.error(`ChatProvider "${this.chatProvider.name}" guest call failed: ${(err as Error).message}`);
			return this.guestFailure(GENERIC_FAILURE_MESSAGE);
		}
	}

	private guestFailure(content: string): AIGuestReply {
		return { role: MessageRole.SYSTEM, content, status: MessageStatus.FAILED };
	}

	private async resolveConversation(
		memberId: ObjectId,
		input: SendMessageInput,
		locale: Locale,
	): Promise<AIConversation> {
		if (input.conversationId) {
			return this.conversationService.getConversation(memberId, shapeIntoMongoObjectId(input.conversationId));
		}
		return this.conversationService.createConversation(memberId, { title: input.content.slice(0, 48) }, locale);
	}

	/** Shared by sendMessage and streamMessage — context + prompt assembly is identical either way, only how the provider is called differs. */
	private async prepareRequest(
		memberId: ObjectId,
		conversation: AIConversation,
		input: SendMessageInput,
		locale: Locale,
	): Promise<{ context: GoTripAIContextSources; messages: ChatMessage[] }> {
		const context = await this.contextService.buildContext({
			memberId,
			locale,
			currentPage: input.currentPage,
		});

		const history = await this.conversationService.getMessages(memberId, {
			conversationId: conversation._id.toString(),
			page: 1,
			limit: 50,
		});

		const messages = this.promptBuilder.buildMessages(history.list, input.content, context);
		return { context, messages };
	}

	private async completeWithProvider(
		conversationId: ObjectId,
		memberId: ObjectId,
		messages: ChatMessage[],
		locale: Locale,
		provider: ChatProvider,
	): Promise<AIMessage> {
		try {
			const result = await provider.complete({ messages, locale, tools: this.toolRegistry.getDefinitions() });
			return this.conversationService.appendMessage(conversationId, memberId, MessageRole.ASSISTANT, result.content, {
				tokenUsage: result.tokenUsage,
			});
		} catch (err) {
			this.logger.error(`ChatProvider "${provider.name}" failed: ${(err as Error).message}`);
			return this.conversationService.appendMessage(
				conversationId,
				memberId,
				MessageRole.SYSTEM,
				'GoTrip AI could not generate a reply just now. Please try again.',
				{ status: MessageStatus.FAILED },
			);
		}
	}
}
