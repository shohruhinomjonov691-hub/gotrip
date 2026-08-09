import { Schema } from 'mongoose';
import { ConversationStatus } from '../libs/enums/conversation.enum';
import { Locale } from '../libs/enums/locale.enum';

/**
 * A GoTrip AI chat session (components/conversation). Named AIConversation —
 * not Conversation — and stored in its own `aiConversations` collection
 * specifically to never collide with the pre-existing private-messaging
 * Conversation model (components/message, schemas/Conversation.model.ts,
 * collection `conversations`) — an earlier version of this file used that
 * exact name/collection and silently broke private messaging by registering
 * a second Mongoose model under the same name. Keep these namespaced apart.
 *
 * Messages are a separate collection (AIMessage.model.ts, `conversationId`
 * ref) rather than an embedded array, matching this codebase's existing
 * convention for one-to-many history (Comment -> BoardArticle, View ->
 * Tour) — keeps a long-running conversation from ever hitting Mongo's 16MB
 * document cap and lets Message be indexed/queried/paginated independently.
 */
const AIConversationSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		title: {
			type: String,
			required: true,
			default: 'New chat',
		},

		// The locale replies should be generated in — read by PromptBuilderService's
		// language-instruction step. Defaults to the existing Locale enum so no
		// mapping layer is needed against the frontend's GoTripAI history (same
		// locale tag as router.locale, see locale.enum.ts).
		locale: {
			type: String,
			enum: Locale,
			default: Locale.en,
		},

		status: {
			type: String,
			enum: ConversationStatus,
			default: ConversationStatus.ACTIVE,
		},

		// Denormalized so "list my conversations, most recent first" never needs a
		// join/lookup into Message — same reasoning as Tour.tourLikes/tourViews.
		lastMessageAt: {
			type: Date,
		},

		messageCount: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true, collection: 'aiConversations' },
);

AIConversationSchema.index({ memberId: 1, status: 1, lastMessageAt: -1 });

export default AIConversationSchema;
