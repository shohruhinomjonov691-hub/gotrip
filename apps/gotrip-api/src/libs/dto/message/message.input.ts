import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import mongoose from 'mongoose';

/** Mirrors the MessageAttachment ObjectType — the client already has this
 *  shape back from documentsUploader and just forwards it through Send. */
@InputType()
export class MessageAttachmentInput {
	@IsNotEmpty()
	@Field(() => String)
	url: string;

	@IsNotEmpty()
	@Field(() => String)
	fileName: string;

	@IsNotEmpty()
	@Field(() => Int)
	fileSize: number;

	@IsNotEmpty()
	@Field(() => String)
	mimeType: string;
}

@InputType()
export class MessageInput {
	/** The member being written to. The conversation is created on first send. */
	@IsNotEmpty()
	@Field(() => String)
	receiverId: mongoose.ObjectId;

	/* Optional so an image/file-only message is valid — the service still
	   rejects a request that has neither text, images nor files. */
	@IsOptional()
	@Length(0, 4000)
	@Field(() => String, { nullable: true })
	messageText?: string;

	/** Paths already returned by imagesUploader(target: "message"). */
	@IsOptional()
	@Field(() => [String], { nullable: true })
	messageImages?: string[];

	/** Attachments already returned by documentsUploader(target: "message"). */
	@IsOptional()
	@Field(() => [MessageAttachmentInput], { nullable: true })
	messageFiles?: MessageAttachmentInput[];
}

@InputType()
export class MessagesInquiry {
	@Min(1)
	@Field(() => Int)
	page: number;

	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsNotEmpty()
	@Field(() => String)
	conversationId: mongoose.ObjectId;
}

@InputType()
export class ConversationsInquiry {
	@Min(1)
	@Field(() => Int)
	page: number;

	@Min(1)
	@Field(() => Int)
	limit: number;

	/** Filters the conversation list by partner nickname. */
	@IsOptional()
	@Length(1, 100)
	@Field(() => String, { nullable: true })
	text?: string;
}
