import { registerEnumType } from '@nestjs/graphql';

export enum CommentStatus {
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}
registerEnumType(CommentStatus, {
	name: 'CommentStatus',
});

export enum CommentGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	TOUR = 'TOUR',
	DESTINATION = 'DESTINATION',
	COMMENT = 'COMMENT',
}
registerEnumType(CommentGroup, {
	name: 'CommentGroup',
});
