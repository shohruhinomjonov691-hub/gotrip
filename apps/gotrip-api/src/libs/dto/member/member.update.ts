import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsUrl, Length, IsNotEmpty } from 'class-validator';
import { MemberStatus, MemberType } from '../../enums/member.enum';
import { TourCategory, TourLanguage } from '../../enums/tour.enum';
import * as mongoose from 'mongoose';

@InputType()
export class MemberSocialInput {
	@IsOptional()
	@IsUrl()
	@Field(() => String, { nullable: true })
	facebook?: string;

	@IsOptional()
	@IsUrl()
	@Field(() => String, { nullable: true })
	twitter?: string;

	@IsOptional()
	@IsUrl()
	@Field(() => String, { nullable: true })
	linkedin?: string;

	@IsOptional()
	@IsUrl()
	@Field(() => String, { nullable: true })
	youtube?: string;

	@IsOptional()
	@IsUrl()
	@Field(() => String, { nullable: true })
	instagram?: string;
}

// Self-service update — deliberately has no memberType/memberStatus field, so a
// member can never self-escalate role or clear a block by relying on service-level
// discipline. Only MemberAdminUpdate (admin-only resolver) exposes those.
@InputType()
export class MemberUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberPhone?: string;

	@IsOptional()
	@Length(3, 12)
	@Field(() => String, { nullable: true })
	memberNick?: string;

	@IsOptional()
	@Length(5, 30)
	@Field(() => String, { nullable: true })
	memberPassword?: string;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	memberFullName?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberImage?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberAddress?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberDesc?: string;

	@IsOptional()
	@Length(0, 500)
	@Field(() => String, { nullable: true })
	agentExperience?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberCoverImage?: string;

	@IsOptional()
	@Field(() => [TourLanguage], { nullable: true })
	memberLanguages?: TourLanguage[];

	@IsOptional()
	@Field(() => [TourCategory], { nullable: true })
	memberSpecialties?: TourCategory[];

	@IsOptional()
	@Field(() => MemberSocialInput, { nullable: true })
	memberSocial?: MemberSocialInput;
}

@InputType()
export class MemberAdminUpdate extends MemberUpdate {
	@IsOptional()
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsOptional()
	@Field(() => MemberStatus, { nullable: true })
	memberStatus?: MemberStatus;
}
