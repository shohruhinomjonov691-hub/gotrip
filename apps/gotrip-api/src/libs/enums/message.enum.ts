import { registerEnumType } from '@nestjs/graphql';

export enum MessageStatus {
	/** Persisted and delivered to the conversation room. */
	SENT = 'SENT',
	/** Opened by the receiver. */
	READ = 'READ',
	/** Soft-deleted by the sender; hidden from both sides but retained. */
	DELETED = 'DELETED',
}
registerEnumType(MessageStatus, { name: 'MessageStatus' });

export enum ConversationStatus {
	ACTIVE = 'ACTIVE',
	/** Soft-deleted; excluded from the conversation list but kept for history. */
	DELETED = 'DELETED',
}
registerEnumType(ConversationStatus, { name: 'ConversationStatus' });
