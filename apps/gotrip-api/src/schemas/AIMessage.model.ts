import { Schema } from 'mongoose';
import { MessageRole, MessageStatus } from '../libs/enums/conversation.enum';

/**
 * One turn in an AIConversation (components/conversation). Named AIMessage —
 * not Message — and stored in `aiConversationMessages`, deliberately distinct
 * from the pre-existing private-messaging Message model/collection
 * (schemas/Message.model.ts, collection `messages`) — see AIConversation.model.ts
 * for why that separation matters.
 *
 * Shape is intentionally provider-agnostic — it stores role/content/toolCalls
 * the same way regardless of which ChatProvider (see components/conversation/
 * providers) produced it, mirroring how Tour/Notice/BoardArticle's
 * `translations` array doesn't care which AI vendor generated a given
 * translation.
 */
const AIMessageSchema = new Schema(
	{
		conversationId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'AIConversation',
		},

		// Denormalized from the parent AIConversation so an ownership check
		// (`findOne({_id, memberId})`, the pattern every other domain in this
		// codebase uses) never needs a second query against AIConversation first.
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		role: {
			type: String,
			enum: MessageRole,
			required: true,
		},

		// Not `required` — a STREAMING-status message is deliberately created
		// with empty content up front (see GoTripAIService.streamMessage) and
		// filled in as the stream progresses; Mongoose's String `required`
		// rejects '' the same as null/undefined, which would break that.
		content: {
			type: String,
			default: '',
		},

		// Populated only once Tool Calling (components/conversation/tools) is
		// implemented — a ToolCall[] the assistant requested, or (on a
		// role: TOOL message) the single call this message is the result of.
		toolCalls: {
			type: [Schema.Types.Mixed],
			default: undefined,
		},
		toolCallId: {
			type: String,
		},

		// What ConversationContextService assembled for this turn, kept for
		// debugging/audit ("why did the assistant say that") — not sent back to
		// the client verbatim. Optional and unstructured on purpose: the shape
		// of GoTripAIContextSources is expected to grow.
		contextSnapshot: {
			type: Schema.Types.Mixed,
		},

		tokenUsage: {
			prompt: { type: Number },
			completion: { type: Number },
		},

		status: {
			type: String,
			enum: MessageStatus,
			default: MessageStatus.COMPLETE,
		},
	},
	{ timestamps: true, collection: 'aiConversationMessages' },
);

AIMessageSchema.index({ conversationId: 1, createdAt: 1 });

export default AIMessageSchema;
