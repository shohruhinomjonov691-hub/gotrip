import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
	CONTACT_AGENT = 'CONTACT_AGENT',
	COMMENT_CREATED = 'COMMENT_CREATED',
	LIKE_CREATED = 'LIKE_CREATED',
	FOLLOW_CREATED = 'FOLLOW_CREATED',
	ADMIN_NOTICE = 'ADMIN_NOTICE',
	/* Guide (agent) application lifecycle. GUIDE_REQUEST fans out to every ADMIN;
	   the two outcomes go back to the single applicant. */
	GUIDE_REQUEST = 'GUIDE_REQUEST',
	GUIDE_APPROVED = 'GUIDE_APPROVED',
	GUIDE_REJECTED = 'GUIDE_REJECTED',
	MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
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
	ARTICLE = 'ARTICLE',
	COMMENT = 'COMMENT',
	NOTICE = 'NOTICE',
}
registerEnumType(NotificationGroup, {
	name: 'NotificationGroup',
});
