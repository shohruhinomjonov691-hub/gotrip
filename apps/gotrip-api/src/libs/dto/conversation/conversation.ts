import { Field, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { ConversationStatus, MessageRole, MessageStatus } from '../../enums/conversation.enum';
import { Locale } from '../../enums/locale.enum';
import { TotalCounter } from '../member/member';

/**
 * GraphQL-decorated now even though no resolver is registered this phase
 * (see components/conversation/conversation.module.ts) — so wiring a
 * @Query/@Mutation in a later phase is purely additive, never a rewrite of
 * these shapes. Undecorated types stay in context.types.ts.
 *
 * Named AIMessage/AIConversation — not Message/Conversation — because those
 * GraphQL type names are already taken by the pre-existing private-messaging
 * feature (libs/dto/message/message.ts). Two @ObjectType() classes can't
 * share a GraphQL type name once both are resolver-reachable; keeping these
 * namespaced apart now avoids a schema-build error the moment a future
 * phase adds a resolver here.
 */
/** Not yet reachable from any registered resolver (see the module-level comment above) — adding this field changes nothing about the live GraphQL schema. */
@ObjectType()
export class AITokenUsage {
	@Field(() => Number)
	prompt: number;

	@Field(() => Number)
	completion: number;
}

@ObjectType()
export class AIMessage {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => String)
	conversationId: mongoose.ObjectId;

	@Field(() => String)
	memberId: mongoose.ObjectId;

	@Field(() => MessageRole)
	role: MessageRole;

	@Field(() => String)
	content: string;

	@Field(() => String, { nullable: true })
	toolCallId?: string;

	@Field(() => AITokenUsage, { nullable: true })
	tokenUsage?: { prompt: number; completion: number };

	@Field(() => MessageStatus)
	status: MessageStatus;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

/** A guest turn's reply — never persisted, so no _id/conversationId/memberId. */
@ObjectType()
export class AIGuestReply {
	@Field(() => MessageRole)
	role: MessageRole;

	@Field(() => String)
	content: string;

	@Field(() => MessageStatus)
	status: MessageStatus;
}

@ObjectType()
export class AIConversation {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => String)
	memberId: mongoose.ObjectId;

	@Field(() => String)
	title: string;

	@Field(() => Locale)
	locale: Locale;

	@Field(() => ConversationStatus)
	status: ConversationStatus;

	@Field(() => Date, { nullable: true })
	lastMessageAt?: Date;

	@Field(() => Number)
	messageCount: number;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class AIConversations {
	@Field(() => [AIConversation])
	list: AIConversation[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}

@ObjectType()
export class AIMessages {
	@Field(() => [AIMessage])
	list: AIMessage[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
