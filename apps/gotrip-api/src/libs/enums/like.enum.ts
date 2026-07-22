import { registerEnumType } from '@nestjs/graphql';

export enum LikeGroup {
	MEMBER = 'MEMBER',
	TOUR = 'TOUR',
	ARTICLE = 'ARTICLE',
	COMMENT = 'COMMENT',
}
registerEnumType(LikeGroup, {
	name: 'LikeGroup',
});
