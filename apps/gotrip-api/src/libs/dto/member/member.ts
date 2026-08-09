import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { AgentRequestStatus, MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { TourCategory, TourLanguage } from '../../enums/tour.enum';
import { Locale } from '../../enums/locale.enum';
import { MeLiked } from '../like/like';
import { MeFollowed } from '../follow/follow';

/**
 * One locale's translated override for a Member's free-text bio
 * (`memberDesc` — the Guide/Agent "About" section, and the same field a
 * BoardArticle author's info panel reads). Mirrors NoticeTranslation/
 * TourTranslation exactly — same AiTranslationService pipeline, just a new
 * content type registered with it.
 */
@ObjectType()
export class MemberTranslation {
	@Field(() => Locale)
	locale: Locale;

	@Field(() => String, { nullable: true })
	memberDesc?: string;
}

@ObjectType()
export class MemberSocial {
	@Field(() => String, { nullable: true })
	facebook?: string;

	@Field(() => String, { nullable: true })
	twitter?: string;

	@Field(() => String, { nullable: true })
	linkedin?: string;

	@Field(() => String, { nullable: true })
	youtube?: string;

	@Field(() => String, { nullable: true })
	instagram?: string;
}

@ObjectType()
export class Member {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => MemberType)
	memberType: MemberType;

	@Field(() => MemberStatus)
	memberStatus: MemberStatus;

	@Field(() => MemberAuthType)
	memberAuthType: MemberAuthType;

	@Field(() => String)
	memberPhone: string;

	@Field(() => String)
	memberNick: string;

	memberPassword?: string;

	@Field(() => String, { nullable: true })
	memberFullName?: string;

	@Field(() => String)
	memberImage: string;

	@Field(() => String, { nullable: true })
	memberAddress?: string;

	@Field(() => String, { nullable: true })
	memberDesc?: string;

	@Field(() => Int)
	memberTours: number;

	@Field(() => Int)
	memberArticles: number;

	@Field(() => Int)
	memberFollowers: number;

	@Field(() => Int)
	memberFollowings: number;

	@Field(() => Int)
	memberPoints: number;

	@Field(() => Int)
	memberLikes: number;

	@Field(() => Int)
	memberViews: number;

	@Field(() => Int)
	memberComments: number;

	@Field(() => Int)
	memberRank: number;

	@Field(() => Int)
	memberWarnings: number;

	@Field(() => Int)
	memberBlocks: number;

	@Field(() => AgentRequestStatus)
	agentRequestStatus: AgentRequestStatus;

	@Field(() => String, { nullable: true })
	agentRequestMessage?: string;

	@Field(() => String, { nullable: true })
	agentExperience?: string;

	@Field(() => String, { nullable: true })
	memberCoverImage?: string;

	@Field(() => [TourLanguage], { nullable: true })
	memberLanguages?: TourLanguage[];

	@Field(() => [TourCategory], { nullable: true })
	memberSpecialties?: TourCategory[];

	@Field(() => MemberSocial, { nullable: true })
	memberSocial?: MemberSocial;

	@Field(() => [MemberTranslation], { nullable: true })
	translations?: MemberTranslation[];

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	@Field(() => String, { nullable: true })
	accessToken?: string;

	/** from aggregation **/

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => [MeFollowed], { nullable: true })
	meFollowed?: MeFollowed[];
}

@ObjectType()
export class TotalCounter {
	@Field(() => Int, { nullable: true })
	total: number;
}

@ObjectType()
export class Members {
	@Field(() => [Member])
	list: Member[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
