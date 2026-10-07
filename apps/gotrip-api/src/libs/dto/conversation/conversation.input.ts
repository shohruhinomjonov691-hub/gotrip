import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
	ArrayMaxSize,
	IsArray,
	IsIn,
	IsNotEmpty,
	IsOptional,
	IsString,
	Length,
	Matches,
	Max,
	Min,
	ValidateNested,
} from 'class-validator';
import { availableConversationSorts, availableMessageSorts } from '../../config';
import { Direction } from '../../enums/common.enum';
import { ConversationStatus, MessageRole } from '../../enums/conversation.enum';
import { Locale } from '../../enums/locale.enum';

@InputType()
export class ConversationInput {
	@IsOptional()
	@Length(1, 120)
	@Field(() => String, { nullable: true })
	title?: string;

	@IsOptional()
	@Field(() => Locale, { nullable: true })
	locale?: Locale;
}

/**
 * The single entry point GoTripAIService.sendMessage() will accept once a
 * provider is wired. `conversationId` omitted starts a new Conversation.
 * `contextSources`/`currentPage` feed ConversationContextService — see
 * components/conversation/conversation-context.service.ts.
 */
@InputType()
export class SendMessageInput {
	@IsOptional()
	@Field(() => String, { nullable: true })
	conversationId?: string;

	@IsNotEmpty()
	@Length(1, 8000)
	@Field(() => String)
	content: string;

	@IsOptional()
	@Field(() => Locale, { nullable: true })
	locale?: Locale;

	@IsOptional()
	@Field(() => String, { nullable: true })
	currentPage?: string;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	contextSources?: string[];

	/**
	 * Client-generated id for one streaming send. Echoed on every
	 * `gotripAiStream` socket frame of that send (deltas, done, error), so the
	 * client can ignore frames from any other request — a stream left running
	 * by New chat / a conversation switch, or another tab's send.
	 */
	@IsOptional()
	@IsString()
	@Length(1, 64)
	@Matches(/^[A-Za-z0-9_-]+$/, { message: 'requestId may only contain letters, digits, "_" and "-"' })
	@Field(() => String, { nullable: true })
	requestId?: string;
}

/** Limits for the unauthenticated guest flow — see GoTripAIService.sendGuestMessage. */
export const GUEST_CONTENT_MAX_LENGTH = 1000;
export const GUEST_HISTORY_MAX_ITEMS = 10;
export const GUEST_HISTORY_CONTENT_MAX_LENGTH = 2000;
/** The only roles a guest may replay — SYSTEM/TOOL from a client would be a prompt-injection vector. */
export const GUEST_HISTORY_ROLES = [MessageRole.USER, MessageRole.ASSISTANT];

/**
 * One prior turn of a guest chat, replayed by the client because guest turns
 * are never persisted. Untrusted input: role is whitelisted here and again
 * in GoTripAIService before it reaches the prompt.
 */
@InputType()
export class GuestHistoryMessageInput {
	@IsIn(GUEST_HISTORY_ROLES)
	@Field(() => MessageRole)
	role: MessageRole;

	@IsString()
	@Length(1, GUEST_HISTORY_CONTENT_MAX_LENGTH)
	@Field(() => String)
	content: string;
}

@InputType()
export class SendGuestMessageInput {
	@IsString()
	@Length(1, GUEST_CONTENT_MAX_LENGTH)
	@Matches(/\S/, { message: 'content must not be blank' })
	@Field(() => String)
	content: string;

	@IsOptional()
	@Field(() => Locale, { nullable: true })
	locale?: Locale;

	// No `currentPage` on purpose: PromptBuilderService puts it verbatim into
	// the SYSTEM prompt, so for an unauthenticated caller it would be a way to
	// lift arbitrary text to instruction level. Sending it is rejected by the
	// global ValidationPipe (forbidNonWhitelisted).

	@IsOptional()
	@IsArray()
	@ArrayMaxSize(GUEST_HISTORY_MAX_ITEMS)
	@ValidateNested({ each: true })
	@Type(() => GuestHistoryMessageInput)
	@Field(() => [GuestHistoryMessageInput], { nullable: true })
	history?: GuestHistoryMessageInput[];
}

@InputType()
class ConversationSearch {
	@IsOptional()
	@Field(() => ConversationStatus, { nullable: true })
	status?: ConversationStatus;
}

// GraphQL name is 'AIConversationsInquiry' — libs/dto/message/message.input.ts
// already registers an unrelated input type as 'ConversationsInquiry' for the
// pre-existing private-messaging feature; two input types can't share a
// GraphQL name once both are resolver-reachable (surfaced at boot once Phase
// 4.5's ConversationResolver made this one reachable). The TS identifier is
// unchanged everywhere it's imported — only the wire-facing name differs.
@InputType('AIConversationsInquiry')
export class ConversationsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableConversationSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => ConversationSearch, { nullable: true })
	search?: ConversationSearch;
}

/** Same GraphQL-name collision as ConversationsInquiry above — see that comment. */
@InputType('AIMessagesInquiry')
export class MessagesInquiry {
	@IsNotEmpty()
	@Field(() => String)
	conversationId: string;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Max(200)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableMessageSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;
}
