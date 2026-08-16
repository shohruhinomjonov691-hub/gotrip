import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Conversation, Conversations, Message, MessageAttachment, Messages } from '../../libs/dto/message/message';
import { ConversationsInquiry, MessageInput, MessagesInquiry } from '../../libs/dto/message/message.input';
import { Member } from '../../libs/dto/member/member';
import { Message as ErrorMessage } from '../../libs/enums/common.enum';
import { ConversationStatus, MessageStatus } from '../../libs/enums/message.enum';
import { MemberStatus } from '../../libs/enums/member.enum';
import { NotificationService } from '../notification/notification.service';
import { SocketGateway } from '../../socket/socket.gateway';
import { escapeRegex, shapeIntoMongoObjectId } from '../../libs/config';

/**
 * Private messaging. MongoDB is the source of truth; the socket gateway only
 * broadcasts what this service has already persisted.
 *
 * Every read is scoped by participation — a member can only ever reach a
 * conversation they belong to (assertParticipant), so no permission decision is
 * left to the client.
 */
@Injectable()
export class MessageService {
	constructor(
		@InjectModel('Conversation') private readonly conversationModel: Model<Conversation>,
		@InjectModel('Message') private readonly messageModel: Model<Message>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		/* NotificationService -> MessageService (tour inquiries create a message)
		   and MessageService -> NotificationService (chat messages notify their
		   receiver) form a genuine two-way dependency, resolved with forwardRef on
		   both sides — see notification.service.ts and the two *.module.ts files. */
		@Inject(forwardRef(() => NotificationService)) private readonly notificationService: NotificationService,
		/* Forward-ref-free: the gateway has no dependency on this service. */
		private readonly socketGateway: SocketGateway,
	) {}

	/**
	 * Returns the conversation for a pair, creating it if absent.
	 *
	 * participants is stored sorted so the pair maps to one document regardless
	 * of who initiates; combined with the unique index this is safe when both
	 * sides press "message" simultaneously — the loser of the race catches the
	 * duplicate-key error and re-reads.
	 */
	public async getOrCreateConversation(memberId: ObjectId, partnerId: ObjectId): Promise<Conversation> {
		if (String(memberId) === String(partnerId)) {
			throw new BadRequestException('You cannot start a conversation with yourself.');
		}

		const partner = await this.memberModel.findOne({ _id: partnerId, memberStatus: MemberStatus.ACTIVE }).lean().exec();
		if (!partner) throw new BadRequestException(ErrorMessage.NO_MEMBER_NICK);

		const sortedIds = [String(memberId), String(partnerId)].sort();
		const participants = sortedIds.map(shapeIntoMongoObjectId);
		/* The real identity of a pair — see the note on the schema for why this
		   exists instead of a unique index on `participants` itself. */
		const participantsKey = sortedIds.join('_');

		const existing = await this.conversationModel.findOne({ participantsKey }).exec();
		if (existing) {
			/* Re-opening a thread the caller had removed restores it for them. */
			if (existing.conversationStatus === ConversationStatus.DELETED) {
				existing.conversationStatus = ConversationStatus.ACTIVE;
				await existing.save();
			}
			return existing;
		}

		try {
			return await this.conversationModel.create({ participants, participantsKey, lastActivityAt: new Date() });
		} catch (err: any) {
			/* Unique index tripped by a concurrent create — read the winner. */
			if (err?.code === 11000) {
				const raced = await this.conversationModel.findOne({ participantsKey }).exec();
				if (raced) return raced;
			}
			throw new InternalServerErrorException(ErrorMessage.CREATE_FAILED);
		}
	}

	/**
	 * Persists a message, updates the conversation's denormalised summary, and
	 * notifies the receiver. Returns the stored document — the gateway broadcasts
	 * this, so what clients render is always what is in the database.
	 */
	public async sendMessage(memberId: ObjectId, input: MessageInput): Promise<Message> {
		const text = (input.messageText ?? '').trim();
		const images = (input.messageImages ?? []).filter(Boolean);
		const files = (input.messageFiles ?? []).filter((f) => !!f?.url);
		if (!text && !images.length && !files.length) throw new BadRequestException('Message cannot be empty.');
		if (images.length > 6) throw new BadRequestException('Up to 6 images per message.');
		if (files.length > 6) throw new BadRequestException('Up to 6 files per message.');

		const { conversation, message } = await this.persistMessage(memberId, input.receiverId, text, images, files);

		/* Reuses the existing notification pipeline — internally guarded, so a
		   notification failure can never fail the send. */
		const sender = await this.memberModel.findById(memberId).select('memberNick').lean().exec();
		await this.notificationService.notifyMessageReceived(
			memberId,
			input.receiverId,
			conversation._id,
			sender?.memberNick,
			text,
		);

		return message;
	}

	/**
	 * Tour-inquiry entry point, called by NotificationService.contactAgent.
	 *
	 * BUG THIS FIXES (reproduced in the browser): submitting a Tour Inquiry
	 * created a bare CONTACT_AGENT notification with no backing conversation or
	 * message, and the notification's fallback route carried a notificationId
	 * the Messages screen never reads — clicking it opened Messages Center on
	 * whatever conversation happened to be first, empty of any inquiry content.
	 *
	 * This persists a real first message (composed by the caller, who has the
	 * Tour context) into a real conversation and returns it, so the caller can
	 * build a notification that deep-links straight to it. It deliberately does
	 * NOT call notifyMessageReceived — NotificationService creates exactly one
	 * CONTACT_AGENT notification for this action, not a second MESSAGE_RECEIVED
	 * one for the same event.
	 */
	public async deliverTourInquiry(memberId: ObjectId, receiverId: ObjectId, text: string): Promise<Conversation> {
		const { conversation } = await this.persistMessage(memberId, receiverId, text);
		return conversation;
	}

	/** Shared core: create/find the thread, persist the message, denormalise the
	 *  conversation summary, and broadcast to the two participants only. */
	private async persistMessage(
		memberId: ObjectId,
		receiverId: ObjectId,
		text: string,
		messageImages?: string[],
		messageFiles?: MessageAttachment[],
	): Promise<{ conversation: Conversation; message: Message }> {
		const conversation = await this.getOrCreateConversation(memberId, receiverId);

		const message = await this.messageModel.create({
			conversationId: conversation._id,
			senderId: memberId,
			receiverId,
			messageText: text,
			messageImages: messageImages?.length ? messageImages : undefined,
			messageFiles: messageFiles?.length ? messageFiles : undefined,
			messageStatus: MessageStatus.SENT,
		});

		const now = new Date();
		await this.conversationModel
			.findByIdAndUpdate(conversation._id, {
				lastMessageText: text.slice(0, 200),
				lastMessageAt: now,
				lastMessageSenderId: memberId,
				lastActivityAt: now,
				conversationStatus: ConversationStatus.ACTIVE,
			})
			.exec();

		/* Realtime fan-out AFTER the write, to the two participants only. The
		   payload mirrors the stored document so clients render persisted truth. */
		this.socketGateway.emitToConversation((conversation.participants as any[]).map(String), {
			event: 'messageCreated',
			conversationId: String(conversation._id),
			message: {
				_id: String(message._id),
				conversationId: String(conversation._id),
				senderId: String(memberId),
				receiverId: String(receiverId),
				messageText: text,
				messageImages: (message as any).messageImages ?? [],
				messageFiles: (message as any).messageFiles ?? [],
				messageStatus: MessageStatus.SENT,
				createdAt: (message as any).createdAt,
			},
		});

		return { conversation, message };
	}

	/** Conversation list for the caller, newest activity first, with unread counts. */
	public async getMyConversations(memberId: ObjectId, input: ConversationsInquiry): Promise<Conversations> {
		const { page, limit, text } = input;

		const match: any = { participants: memberId, conversationStatus: ConversationStatus.ACTIVE };

		const result = await this.conversationModel
			.aggregate([
				{ $match: match },
				{ $sort: { lastActivityAt: -1 } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							/* The other participant. */
							{
								$addFields: {
									partnerId: {
										$first: {
											$filter: { input: '$participants', as: 'p', cond: { $ne: ['$$p', memberId] } },
										},
									},
								},
							},
							{
								$lookup: {
									from: 'members',
									localField: 'partnerId',
									foreignField: '_id',
									as: 'partner',
								},
							},
							{ $unwind: { path: '$partner', preserveNullAndEmptyArrays: true } },
							/* Unread messages addressed to the caller in this thread. */
							{
								$lookup: {
									from: 'messages',
									let: { cid: '$_id' },
									pipeline: [
										{
											$match: {
												$expr: {
													$and: [
														{ $eq: ['$conversationId', '$$cid'] },
														{ $eq: ['$receiverId', memberId] },
														{ $eq: ['$messageStatus', MessageStatus.SENT] },
													],
												},
											},
										},
										{ $count: 'n' },
									],
									as: 'unread',
								},
							},
							{ $addFields: { unreadCount: { $ifNull: [{ $first: '$unread.n' }, 0] } } },
							...(text ? [{ $match: { 'partner.memberNick': { $regex: new RegExp(escapeRegex(text), 'i') } } }] : []),
							{ $project: { unread: 0, partnerId: 0 } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return result[0] as Conversations;
	}

	/** Paginated history, oldest-last. Participation is enforced before reading. */
	public async getMessages(memberId: ObjectId, input: MessagesInquiry): Promise<Messages> {
		await this.assertParticipant(memberId, input.conversationId);
		const { page, limit, conversationId } = input;

		const result = await this.messageModel
			.aggregate([
				{ $match: { conversationId, messageStatus: { $ne: MessageStatus.DELETED } } },
				{ $sort: { createdAt: -1 } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							/* The shared `lookupMember` helper joins on `memberId`; messages key
							   their author as `senderId`, so the join is spelled out here rather
							   than renaming a field just to reuse the constant. */
							{ $lookup: { from: 'members', localField: 'senderId', foreignField: '_id', as: 'senderData' } },
							{ $unwind: { path: '$senderData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return result[0] as Messages;
	}

	/** Marks everything addressed to the caller in a thread as read, then tells
	 *  the sender's live tab in realtime — mirrors the emit in persistMessage. */
	public async markConversationRead(memberId: ObjectId, conversationId: ObjectId): Promise<boolean> {
		const conversation = await this.assertParticipant(memberId, conversationId);
		const readAt = new Date();
		const { modifiedCount } = await this.messageModel
			.updateMany(
				{ conversationId, receiverId: memberId, messageStatus: MessageStatus.SENT },
				{ messageStatus: MessageStatus.READ, readAt },
			)
			.exec();

		if (modifiedCount > 0) {
			this.socketGateway.emitToConversation((conversation.participants as any[]).map(String), {
				event: 'messagesRead',
				conversationId: String(conversationId),
				readerId: String(memberId),
				readAt,
			});
		}

		return true;
	}

	/** Total unread across all threads — drives the Messages badge. */
	public async getUnreadMessageCount(memberId: ObjectId): Promise<number> {
		return await this.messageModel.countDocuments({ receiverId: memberId, messageStatus: MessageStatus.SENT }).exec();
	}

	/** Throws unless the caller belongs to the conversation. */
	private async assertParticipant(memberId: ObjectId, conversationId: ObjectId): Promise<Conversation> {
		const conversation = await this.conversationModel.findById(conversationId).exec();
		if (!conversation) throw new BadRequestException('Conversation not found.');
		const isParticipant = conversation.participants.some((p: any) => String(p) === String(memberId));
		if (!isParticipant) throw new BadRequestException('You are not a participant of this conversation.');
		return conversation;
	}
}
