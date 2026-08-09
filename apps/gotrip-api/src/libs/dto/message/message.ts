import { Field, Int, ObjectType } from '@nestjs/graphql';
import mongoose from 'mongoose';
import { Member, TotalCounter } from '../member/member';
import { ConversationStatus, MessageStatus } from '../../enums/message.enum';

/** A non-image message attachment (PDF/DOC/DOCX/XLS/XLSX/PPT/PPTX/TXT/ZIP).
 *  fileName/fileSize are captured at upload time and persisted here — the
 *  stored path alone can't tell the receiving member what the file is called
 *  or how large it is. */
@ObjectType()
export class MessageAttachment {
	@Field(() => String)
	url: string;

	@Field(() => String)
	fileName: string;

	@Field(() => Int)
	fileSize: number;

	@Field(() => String)
	mimeType: string;
}

@ObjectType()
export class Message {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => String)
	conversationId: mongoose.ObjectId;

	@Field(() => String)
	senderId: mongoose.ObjectId;

	@Field(() => String)
	receiverId: mongoose.ObjectId;

	@Field(() => String)
	messageText: string;

	@Field(() => [String], { nullable: true })
	messageImages?: string[];

	@Field(() => [MessageAttachment], { nullable: true })
	messageFiles?: MessageAttachment[];

	@Field(() => MessageStatus)
	messageStatus: MessageStatus;

	@Field(() => Date, { nullable: true })
	readAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** Populated via $lookup so bubbles can render an avatar without an N+1. */
	@Field(() => Member, { nullable: true })
	senderData?: Member;
}

@ObjectType()
export class Messages {
	@Field(() => [Message])
	list: Message[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}

@ObjectType()
export class Conversation {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => [String])
	participants: mongoose.ObjectId[];

	@Field(() => ConversationStatus)
	conversationStatus: ConversationStatus;

	@Field(() => String, { nullable: true })
	lastMessageText?: string;

	@Field(() => Date, { nullable: true })
	lastMessageAt?: Date;

	@Field(() => String, { nullable: true })
	lastMessageSenderId?: mongoose.ObjectId;

	@Field(() => Date)
	lastActivityAt: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** The other participant, resolved server-side so the client never has to. */
	@Field(() => Member, { nullable: true })
	partner?: Member;

	/** Unread messages in this thread addressed to the caller. */
	@Field(() => Int)
	unreadCount: number;
}

@ObjectType()
export class Conversations {
	@Field(() => [Conversation])
	list: Conversation[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
