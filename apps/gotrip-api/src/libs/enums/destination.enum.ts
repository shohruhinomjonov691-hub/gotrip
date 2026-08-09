import { registerEnumType } from '@nestjs/graphql';

export enum DestinationStatus {
	ACTIVE = 'ACTIVE',
	PAUSED = 'PAUSED',
	DELETED = 'DELETED',
}
registerEnumType(DestinationStatus, {
	name: 'DestinationStatus',
});
