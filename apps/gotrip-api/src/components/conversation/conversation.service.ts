import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { AIConversation, AIConversations, AIMessage, AIMessages } from '../../libs/dto/conversation/conversation';
import {
	ConversationInput,
	ConversationsInquiry,
	MessagesInquiry,
} from '../../libs/dto/conversation/conversation.input';
import { ConversationUpdate } from '../../libs/dto/conversation/conversation.update';
import { ConversationStatus, MessageRole, MessageStatus } from '../../libs/enums/conversation.enum';
import { Direction, Message as ErrorMessage } from '../../libs/enums/common.enum';
import { Locale } from '../../libs/enums/locale.enum';
import { T } from '../../libs/types/common';
import { shapeIntoMongoObjectId } from '../../libs/config';

/**
 * Persistence + ownership for AIConversation/AIMessage — the "repository
 * structure" layer, same shape as every other domain service in this
 * codebase (direct Mongoose model injection, memberId-scoped queries,
 * $facet pagination). Model tokens are 'AIConversation'/'AIMessage' —
 * deliberately not 'Conversation'/'Message', which the pre-existing
 * private-messaging feature (components/message) already owns; see
 * conversation.module.ts's header comment.
 *
 * GoTripAIService is the only caller that also touches
 * ConversationContextService/PromptBuilderService; this service knows
 * nothing about prompts, context, or providers.
 */
@Injectable()
export class ConversationService {
	private readonly logger = new Logger(ConversationService.name);

	constructor(
		@InjectModel('AIConversation') private readonly conversationModel: Model<AIConversation>,
		@InjectModel('AIMessage') private readonly messageModel: Model<AIMessage>,
	) {}

	public async createConversation(
		memberId: ObjectId,
		input: ConversationInput,
		locale?: Locale,
	): Promise<AIConversation> {
		try {
			return await this.conversationModel.create({
				memberId,
				title: input.title ?? 'New chat',
				locale: input.locale ?? locale ?? Locale.en,
			});
		} catch (err) {
			this.logger.error(`createConversation failed: ${(err as Error).message}`);
			throw new BadRequestException(ErrorMessage.CREATE_FAILED);
		}
	}

	public async getConversation(memberId: ObjectId, conversationId: ObjectId): Promise<AIConversation> {
		const result = await this.conversationModel
			.findOne({ _id: conversationId, memberId, status: { $ne: ConversationStatus.DELETED } })
			.exec();
		if (!result) throw new InternalServerErrorException(ErrorMessage.NO_DATA_FOUND);
		return result;
	}

	public async getConversations(memberId: ObjectId, input: ConversationsInquiry): Promise<AIConversations> {
		const match: T = { memberId, status: input.search?.status ?? { $ne: ConversationStatus.DELETED } };
		const sort: T = { [input.sort ?? 'lastMessageAt']: input.direction ?? Direction.DESC };

		const result = await this.conversationModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(ErrorMessage.NO_DATA_FOUND);
		return result[0];
	}

	public async updateConversation(memberId: ObjectId, input: ConversationUpdate): Promise<AIConversation> {
		const result = await this.conversationModel
			.findOneAndUpdate({ _id: input._id, memberId, status: { $ne: ConversationStatus.DELETED } }, input, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(ErrorMessage.UPDATE_FAILED);
		return result;
	}

	/** Soft delete, matching every other domain's convention — never a hard remove. */
	public async deleteConversation(memberId: ObjectId, conversationId: ObjectId): Promise<AIConversation> {
		const result = await this.conversationModel
			.findOneAndUpdate(
				{ _id: conversationId, memberId, status: { $ne: ConversationStatus.DELETED } },
				{ status: ConversationStatus.DELETED },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(ErrorMessage.REMOVE_FAILED);
		return result;
	}

	public async getMessages(memberId: ObjectId, input: MessagesInquiry): Promise<AIMessages> {
		const conversationId = shapeIntoMongoObjectId(input.conversationId);
		// Ownership check first — a message list is useless without confirming the conversation is the caller's own.
		await this.getConversation(memberId, conversationId);

		const sort: T = { [input.sort ?? 'createdAt']: input.direction ?? Direction.ASC };
		const result = await this.messageModel
			.aggregate([
				{ $match: { conversationId } },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(ErrorMessage.NO_DATA_FOUND);
		return result[0];
	}

	/**
	 * The one write GoTripAIService needs regardless of whether a provider is
	 * connected: persist a turn and keep the parent AIConversation's
	 * denormalized counters (lastMessageAt/messageCount) in sync — same
	 * "stats editor" pattern as TourService.tourStatsEditor, just inlined
	 * since it's a single $inc + $set rather than a reusable multi-target
	 * updater.
	 */
	public async appendMessage(
		conversationId: ObjectId,
		memberId: ObjectId,
		role: MessageRole,
		content: string,
		extra?: Partial<Pick<AIMessage, 'status' | 'toolCallId' | 'tokenUsage'>>,
	): Promise<AIMessage> {
		const message = await this.messageModel.create({
			conversationId,
			memberId,
			role,
			content,
			status: extra?.status ?? MessageStatus.COMPLETE,
			toolCallId: extra?.toolCallId,
			tokenUsage: extra?.tokenUsage,
		});

		await this.conversationModel
			.updateOne({ _id: conversationId }, { $inc: { messageCount: 1 }, $set: { lastMessageAt: new Date() } })
			.exec();

		return message;
	}

	/**
	 * Finalizes a streaming turn: the same Message row created as
	 * status: STREAMING (see GoTripAIService.streamMessage) is updated in
	 * place with the fully-accumulated content — never a second row — so a
	 * plain history read (getMessages) always sees exactly what was streamed,
	 * with no separate "pending" duplicate to filter out.
	 */
	public async finalizeStreamingMessage(
		messageId: ObjectId,
		content: string,
		status: MessageStatus,
		tokenUsage?: AIMessage['tokenUsage'],
	): Promise<AIMessage> {
		const result = await this.messageModel
			.findByIdAndUpdate(messageId, { content, status, tokenUsage }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(ErrorMessage.UPDATE_FAILED);
		return result;
	}
}
