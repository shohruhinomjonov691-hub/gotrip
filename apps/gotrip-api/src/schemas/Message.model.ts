import { Schema } from 'mongoose';
import { MessageStatus } from '../libs/enums/message.enum';

/** A non-image attachment on a private message (PDF/DOC/DOCX/XLS/XLSX/PPT/PPTX/TXT/ZIP) — see libs/dto/message/message.ts's MessageAttachment. */
const MessageAttachmentSchema = new Schema(
	{
		url: { type: String, required: true },
		fileName: { type: String, required: true },
		fileSize: { type: Number, required: true },
		mimeType: { type: String, required: true },
	},
	{ _id: false },
);

/** One message in a private 1:1 thread (components/message). */
const MessageSchema = new Schema(
	{
		conversationId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Conversation',
		},

		senderId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		receiverId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		messageText: {
			type: String,
			default: '',
		},

		messageImages: {
			type: [String],
		},

		messageFiles: {
			type: [MessageAttachmentSchema],
		},

		messageStatus: {
			type: String,
			enum: MessageStatus,
			default: MessageStatus.SENT,
		},

		readAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'messages' },
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, messageStatus: 1 });

export default MessageSchema;
