import { registerEnumType } from '@nestjs/graphql';

export enum ConversationStatus {
	ACTIVE = 'ACTIVE',
	ARCHIVED = 'ARCHIVED',
	DELETED = 'DELETED',
}
// GraphQL name is 'AIConversationStatus', not 'ConversationStatus' — the pre-existing
// private-messaging feature (libs/enums/message.enum.ts) already registered a
// DIFFERENT enum under that exact GraphQL name; two enums can't share a GraphQL
// type name once both are resolver-reachable (surfaced at boot once Phase 4.5's
// ConversationResolver made this one reachable). The TS identifier is unchanged
// everywhere it's imported — only the wire-facing name differs.
registerEnumType(ConversationStatus, { name: 'AIConversationStatus' });

/**
 * 'TOOL' is included now (not just USER/ASSISTANT/SYSTEM) even though no tool
 * exists yet — see components/conversation/tools — so the Message schema
 * never needs a breaking migration once tool-calling is implemented; a tool
 * result is conventionally modeled as its own message with this role.
 */
export enum MessageRole {
	SYSTEM = 'SYSTEM',
	USER = 'USER',
	ASSISTANT = 'ASSISTANT',
	TOOL = 'TOOL',
}
registerEnumType(MessageRole, { name: 'MessageRole' });

/**
 * Lifecycle of a single message. PENDING/STREAMING exist for the future
 * streaming provider (components/conversation/streaming) — a real-time
 * subscription can watch a message move PENDING -> STREAMING -> COMPLETE.
 * FAILED mirrors AiTranslationService's graceful-failure convention: a
 * failed provider call still leaves a real, visible message row.
 */
export enum MessageStatus {
	PENDING = 'PENDING',
	STREAMING = 'STREAMING',
	COMPLETE = 'COMPLETE',
	FAILED = 'FAILED',
}
// Same GraphQL-name collision as ConversationStatus above — see that comment.
registerEnumType(MessageStatus, { name: 'AIMessageStatus' });
