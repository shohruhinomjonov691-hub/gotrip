import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
	AGENT_APPROVED = 'AGENT_APPROVED',
	AGENT_REJECTED = 'AGENT_REJECTED',
	BOOKING_CREATED = 'BOOKING_CREATED',
	PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
	PAYMENT_FAILED = 'PAYMENT_FAILED',
	COMMENT_CREATED = 'COMMENT_CREATED',
	LIKE_CREATED = 'LIKE_CREATED',
	FOLLOW_CREATED = 'FOLLOW_CREATED',
	ADMIN_NOTICE = 'ADMIN_NOTICE',
}
registerEnumType(NotificationType, {
	name: 'NotificationType',
});

export enum NotificationStatus {
	WAIT = 'WAIT',
	READ = 'READ',
	DELETED = 'DELETED',
}
registerEnumType(NotificationStatus, {
	name: 'NotificationStatus',
});

export enum NotificationGroup {
	MEMBER = 'MEMBER',
	TOUR = 'TOUR',
	BOOKING = 'BOOKING',
	PAYMENT = 'PAYMENT',
	ARTICLE = 'ARTICLE',
	COMMENT = 'COMMENT',
	NOTICE = 'NOTICE',
}
registerEnumType(NotificationGroup, {
	name: 'NotificationGroup',
});
