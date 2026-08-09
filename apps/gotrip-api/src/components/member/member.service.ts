import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Member, Members } from '../../libs/dto/member/member';
import {
	AgentRequestInput,
	AgentsInquiry,
	LoginInput,
	MemberInput,
	MemberSearchInquiry,
	MembersInquiry,
} from '../../libs/dto/member/member.input';
import { AgentRequestStatus, MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import { MemberAdminUpdate, MemberUpdate } from '../../libs/dto/member/member.update';
import { ViewService } from '../view/view.service';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { Follower, Following, MeFollowed } from '../../libs/dto/follow/follow';
import { escapeRegex, lookupAuthMemberLiked } from '../../libs/config';
import { NotificationService } from '../notification/notification.service';
import { AiTranslationService, TranslationEntryLike } from '../translation/ai-translation.service';

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Follow') private readonly followModel: Model<Follower | Following>,
		private authService: AuthService,
		private viewService: ViewService,
		private likeService: LikeService,
		private notificationService: NotificationService,
		private aiTranslationService: AiTranslationService,
	) {}

	/**
	 * Same pattern as NoticeService/TourService/BoardArticleService's
	 * queueTranslation — memberDesc (the Guide/Agent "About" text) was the one
	 * Member field never wired into the AI translation pipeline, which is why
	 * it always rendered in whatever language it was written in regardless of
	 * the traveller's selected locale.
	 */
	private queueTranslation(member: Member): void {
		this.aiTranslationService.translateEntityAsync(this.memberModel, {
			entityType: 'member',
			entityId: member._id,
			fields: {
				memberDesc: member.memberDesc,
			},
			existingTranslations: member.translations as unknown as TranslationEntryLike[],
		});
	}

	public async signup(input: MemberInput): Promise<Member> {
		const { memberType: _memberType, ...signupInput } = input;

		signupInput.memberPassword = await this.authService.hashPassword(input.memberPassword);
		try {
			const result = await this.memberModel.create({
				...signupInput,
				memberType: MemberType.USER,
			});
			result.accessToken = await this.authService.createToken(result);
			return result;
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
		}
	}

	public async login(input: LoginInput): Promise<Member> {
		const { memberNick, memberPassword } = input;
		const response: Member | null = await this.memberModel
			.findOne({ memberNick: memberNick })
			.select('+memberPassword')
			.exec();

		if (!response || response.memberStatus === MemberStatus.DELETE) {
			throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
		} else if (response.memberStatus === MemberStatus.BLOCK) {
			throw new InternalServerErrorException(Message.BLOCKED_USER);
		}

		const isMatch = await this.authService.comparePasswords(input.memberPassword, response.memberPassword as string);
		if (!isMatch) throw new InternalServerErrorException(Message.WRONG_PASSWORD);
		response.accessToken = await this.authService.createToken(response);

		return response;
	}

	public async updateMember(memberId: ObjectId, input: MemberUpdate): Promise<Member> {
		const { _id: _inputId, ...safeInput } = input;
		if (safeInput.memberPassword) {
			safeInput.memberPassword = await this.authService.hashPassword(safeInput.memberPassword);
		}

		const result: Member | null = await this.memberModel
			.findOneAndUpdate(
				{
					_id: memberId,
					memberStatus: MemberStatus.ACTIVE,
				},
				safeInput,
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		this.queueTranslation(result);
		result.accessToken = await this.authService.createToken(result);
		return result;
	}

	public async getMember(memberId: ObjectId | null, targetId: ObjectId): Promise<Member> {
		const search: T = {
			_id: targetId,
			memberStatus: {
				$in: [MemberStatus.ACTIVE, MemberStatus.BLOCK],
			},
		};
		const targetMember: any = await this.memberModel.findOne(search).lean().exec();
		if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: targetId, viewGroup: ViewGroup.MEMBER };
			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.memberModel.findOneAndUpdate(search, { $inc: { memberViews: 1 } }, { new: true }).exec();
				targetMember.memberViews++;
			}

			const likeInput = { memberId: memberId, likeRefId: targetId, likeGroup: LikeGroup.MEMBER };
			targetMember.meLiked = await this.likeService.checkLikeExistence(likeInput);

			targetMember.meFollowed = await this.checkSubscription(memberId, targetId);
		}

		return targetMember;
	}

	private async checkSubscription(followerId: ObjectId, followingId: ObjectId): Promise<MeFollowed[]> {
		const result = await this.followModel.findOne({ followingId: followingId, followerId: followerId }).exec();
		return result ? [{ followerId: followerId, followingId: followingId, myFollowing: true }] : [];
	}

	public async getAgents(memberId: ObjectId, input: AgentsInquiry): Promise<Members> {
		const { text, languages, specialties, location } = input.search;
		const match: T = { memberType: MemberType.AGENT, memberStatus: MemberStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		// Keyword now covers the display name as well as the nickname — searching a guide by
		// the name shown in the UI previously returned nothing.
		if (text) {
			const rx = { $regex: new RegExp(escapeRegex(text), 'i') };
			match.$or = [{ memberNick: rx }, { memberFullName: rx }];
		}
		if (languages && languages.length) match.memberLanguages = { $in: languages };
		if (specialties && specialties.length) match.memberSpecialties = { $in: specialties };
		if (location) match.memberAddress = { $regex: new RegExp(escapeRegex(location), 'i') };

		const result = await this.memberModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId, '$_id', LikeGroup.MEMBER), // meLiked
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	/**
	 * Directory search for starting a conversation.
	 *
	 * getAgents only returns AGENTs and getAllMembersByAdmin is ADMIN-only, so
	 * neither can back "find any member to message". This keeps the same match
	 * shape and escapeRegex handling as getAgents — it differs only in dropping
	 * the memberType filter, excluding the caller, and omitting the like lookup
	 * (irrelevant for a picker).
	 *
	 * ADMINs are excluded: staff accounts are not a messaging destination.
	 */
	public async searchMembers(memberId: ObjectId, input: MemberSearchInquiry): Promise<Members> {
		const { text, memberType } = input;
		const match: T = {
			memberStatus: MemberStatus.ACTIVE,
			_id: { $ne: memberId },
			memberType: memberType ? memberType : { $in: [MemberType.USER, MemberType.AGENT] },
		};

		if (text) {
			const rx = { $regex: new RegExp(escapeRegex(text), 'i') };
			match.$or = [{ memberNick: rx }, { memberFullName: rx }];
		}

		const result = await this.memberModel
			.aggregate([
				{ $match: match },
				{ $sort: { memberNick: 1 } },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return result[0];
	}

	public async likeTargetMember(memberId: ObjectId, likeRefId: ObjectId): Promise<Member> {
		const target: Member | null = await this.memberModel
			.findOne({ _id: likeRefId, memberStatus: MemberStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (String(target._id) === String(memberId)) throw new BadRequestException('Cannot like yourself.');

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.MEMBER,
		};

		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.memberStatsEditor({ _id: likeRefId, targetKey: 'memberLikes', modifier: modifier });
		if (modifier === 1) {
			await this.notificationService.notifyLikeCreated(memberId, target._id, LikeGroup.MEMBER, likeRefId);
		}

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
		const { memberStatus, memberType, agentRequestStatus, text } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (memberStatus) match.memberStatus = memberStatus;
		if (memberType) match.memberType = memberType;
		if (agentRequestStatus) match.agentRequestStatus = agentRequestStatus;
		if (text) match.memberNick = { $regex: new RegExp(escapeRegex(text), 'i') };

		const result = await this.memberModel
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
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updateMemberByAdmin(input: MemberAdminUpdate): Promise<Member> {
		const update: T = { ...input };
		delete update._id;
		if (update.memberPassword) {
			update.memberPassword = await this.authService.hashPassword(update.memberPassword);
		}

		const result: Member | null = await this.memberModel
			.findOneAndUpdate({ _id: input._id }, update, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		this.queueTranslation(result);
		return result;
	}

	/** GUIDE (AGENT) REQUEST WORKFLOW **/
	/* USER -> requestAgentRole (PENDING) -> admin approve (AGENT) / reject (back to USER, REJECTED) */

	public async requestAgentRole(memberId: ObjectId, input: AgentRequestInput): Promise<Member> {
		const member = await this.memberModel.findOne({ _id: memberId, memberStatus: MemberStatus.ACTIVE }).exec();
		if (!member) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (member.memberType !== MemberType.USER) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}
		if (member.agentRequestStatus === AgentRequestStatus.PENDING) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		const result = await this.memberModel
			.findOneAndUpdate(
				{ _id: memberId },
				{
					agentRequestStatus: AgentRequestStatus.PENDING,
					agentRequestMessage: input.agentRequestMessage,
					agentExperience: input.agentExperience,
				},
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		/* Fan out to ADMINs. Internally guarded, so a notification failure can
		   never fail the application itself — the same contract the existing
		   follow / like / comment call sites rely on. */
		await this.notificationService.notifyGuideRequestSubmitted(result._id, result.memberNick);
		return result;
	}

	public async getAgentRequestsByAdmin(input: MembersInquiry): Promise<Members> {
		if (!input.search.agentRequestStatus) input.search.agentRequestStatus = AgentRequestStatus.PENDING;
		return this.getAllMembersByAdmin(input);
	}

	public async approveAgentRequestByAdmin(memberId: ObjectId): Promise<Member> {
		const result = await this.memberModel
			.findOneAndUpdate(
				{ _id: memberId, agentRequestStatus: AgentRequestStatus.PENDING },
				{ memberType: MemberType.AGENT, agentRequestStatus: AgentRequestStatus.APPROVED },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		await this.notificationService.notifyGuideRequestApproved(result._id);
		return result;
	}

	public async rejectAgentRequestByAdmin(memberId: ObjectId): Promise<Member> {
		const result = await this.memberModel
			.findOneAndUpdate(
				{ _id: memberId, agentRequestStatus: AgentRequestStatus.PENDING },
				{ agentRequestStatus: AgentRequestStatus.REJECTED },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		await this.notificationService.notifyGuideRequestRejected(result._id);
		return result;
	}

	public async memberStatsEditor(input: StatisticModifier): Promise<Member> {
		const { _id, targetKey, modifier } = input;
		const result = await this.memberModel
			.findByIdAndUpdate(
				_id,
				{
					$inc: { [targetKey]: modifier },
				},
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}
}
