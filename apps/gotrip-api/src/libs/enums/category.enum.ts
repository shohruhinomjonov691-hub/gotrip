import { registerEnumType } from '@nestjs/graphql';

export enum CategoryType {
	TOUR = 'TOUR',
	ARTICLE = 'ARTICLE',
}
registerEnumType(CategoryType, {
	name: 'CategoryType',
});

export enum CategoryStatus {
	ACTIVE = 'ACTIVE',
	HOLD = 'HOLD',
	DELETE = 'DELETE',
}
registerEnumType(CategoryStatus, {
	name: 'CategoryStatus',
});
