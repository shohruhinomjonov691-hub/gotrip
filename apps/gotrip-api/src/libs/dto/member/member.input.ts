import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { AgentRequestStatus, MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { availableAgentSorts, availableMemberSorts } from '../../config';
import { Direction } from '../../enums/common.enum';
import { TourCategory, TourLanguage } from '../../enums/tour.enum';

@InputType()
export class MemberInput {
	@IsNotEmpty()
	@Length(3, 12)
	@Field(() => String)
	memberNick: string;

	@IsNotEmpty()
	@Length(5, 30)
	@Field(() => String)
	memberPassword: string;

	@IsNotEmpty()
	@Field(() => String)
	memberPhone: string;

	@IsOptional()
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsOptional()
	@Field(() => MemberAuthType, { nullable: true })
	memberAuthType?: MemberAuthType;
}

// Self-service Guide (Agent) request — USER -> PENDING -> admin approve/reject.
@InputType()
export class AgentRequestInput {
	@IsOptional()
	@Length(0, 500)
	@Field(() => String, { nullable: true })
	agentRequestMessage?: string;

	@IsOptional()
	@Length(0, 500)
	@Field(() => String, { nullable: true })
	agentExperience?: string;
}

@InputType()
export class LoginInput {
	@IsNotEmpty()
	@Length(3, 12)
	@Field(() => String)
	memberNick: string;

	@IsNotEmpty()
	@Length(5, 30)
	@Field(() => String)
	memberPassword: string;
}

@InputType()
class AISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;

	// Filters over guide-profile fields that already exist on Member — additive and
	// optional, so every existing getAgents caller keeps working unchanged.
	@IsOptional()
	@Field(() => [TourLanguage], { nullable: true })
	languages?: TourLanguage[];

	@IsOptional()
	@Field(() => [TourCategory], { nullable: true })
	specialties?: TourCategory[];

	@IsOptional()
	@Field(() => String, { nullable: true })
	location?: string;
}

@InputType()
export class AgentsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableAgentSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AISearch)
	search: AISearch;
}

@InputType()
class MISearch {
	@IsOptional()
	@Field(() => MemberStatus, { nullable: true })
	memberStatus?: MemberStatus;

	@IsOptional()
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsOptional()
	@Field(() => AgentRequestStatus, { nullable: true })
	agentRequestStatus?: AgentRequestStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class MembersInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableMemberSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => MISearch)
	search: MISearch;
}

/**
 * Directory search used by the messaging composer. Deliberately minimal — it is
 * a picker, not a listing screen, so it carries no sort/direction/like filters.
 */
@InputType()
export class MemberSearchInquiry {
	@Min(1)
	@Field(() => Int)
	page: number;

	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@Length(1, 100)
	@Field(() => String, { nullable: true })
	text?: string;

	/** Optional narrowing to USER or AGENT; omitted means both. */
	@IsOptional()
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;
}
