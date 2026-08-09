import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { availableConversationSorts, availableMessageSorts } from '../../config';
import { Direction } from '../../enums/common.enum';
import { ConversationStatus } from '../../enums/conversation.enum';
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
