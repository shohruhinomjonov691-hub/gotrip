import { Schema } from 'mongoose';
import { ConversationStatus } from '../libs/enums/message.enum';

/**
 * A private 1:1 thread between two members (components/message). Stored
 * once per unordered pair — `participants` is always the pair sorted as
 * strings before insert (see MessageService.getOrCreateConversation), and
 * `participantsKey` (the sorted pair joined with "_") is the actual
 * uniqueness key: a unique index directly on `participants` (an array)
 * would only dedupe exact array order/identity, not the pair regardless of
 * who initiated, so the sorted-join key exists specifically to make the
 * unique index mean "this pair", not "this exact document shape".
 */
const ConversationSchema = new Schema(
	{
		participants: {
			type: [Schema.Types.ObjectId],
			ref: 'Member',
			required: true,
		},

		participantsKey: {
			type: String,
			required: true,
			unique: true,
		},

		conversationStatus: {
			type: String,
			enum: ConversationStatus,
			default: ConversationStatus.ACTIVE,
		},

		// Denormalized summary of the latest message, kept in sync by
		// MessageService.persistMessage so the conversation list never needs to
		// join into Message just to render a preview.
		lastMessageText: {
			type: String,
		},
		lastMessageAt: {
			type: Date,
		},
		lastMessageSenderId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},

		// Distinct from lastMessageAt: bumped on any activity that should
		// resurface the thread (e.g. un-deleting it), not only a new message.
		lastActivityAt: {
			type: Date,
			required: true,
			default: Date.now,
		},
	},
	{ timestamps: true, collection: 'conversations' },
);

// Powers MessageService.getMyConversations' $match on {participants, conversationStatus} + $sort on lastActivityAt.
ConversationSchema.index({ participants: 1, conversationStatus: 1, lastActivityAt: -1 });

export default ConversationSchema;
