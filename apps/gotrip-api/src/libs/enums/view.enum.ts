import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	TOUR = 'TOUR',
	DESTINATION = 'DESTINATION',
}
registerEnumType(ViewGroup, {
	name: 'ViewGroup',
});
