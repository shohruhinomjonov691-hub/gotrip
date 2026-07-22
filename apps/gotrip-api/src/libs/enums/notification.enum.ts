import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
	CONTACT_AGENT = 'CONTACT_AGENT',
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
	ARTICLE = 'ARTICLE',
	COMMENT = 'COMMENT',
	NOTICE = 'NOTICE',
}
registerEnumType(NotificationGroup, {
	name: 'NotificationGroup',
});
