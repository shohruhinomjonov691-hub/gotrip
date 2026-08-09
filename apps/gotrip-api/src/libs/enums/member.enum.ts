import { registerEnumType } from '@nestjs/graphql';

export enum MemberType {
	USER = 'USER',
	AGENT = 'AGENT',
	ADMIN = 'ADMIN',
}

registerEnumType(MemberType, {
	name: 'MemberType',
});

export enum MemberStatus {
	ACTIVE = 'ACTIVE',
	BLOCK = 'BLOCK',
	DELETE = 'DELETE',
}

registerEnumType(MemberStatus, {
	name: 'MemberStatus',
});

export enum MemberAuthType {
	PHONE = 'PHONE',
	EMAIL = 'EMAIL',
	TELEGRAM = 'TELEGRAM',
}

registerEnumType(MemberAuthType, {
	name: 'MemberAuthType',
});

// Guide workflow: USER -> requestAgentRole (PENDING) -> admin approve/reject.
// Signup always creates USER; MemberType only becomes AGENT via admin approval
// (or a direct admin override through updateMemberByAdmin).
export enum AgentRequestStatus {
	NONE = 'NONE',
	PENDING = 'PENDING',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
}

registerEnumType(AgentRequestStatus, {
	name: 'AgentRequestStatus',
});
