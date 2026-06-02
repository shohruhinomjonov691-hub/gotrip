import { registerEnumType } from '@nestjs/graphql';

export enum TourCategory {
	ADVENTURE = 'ADVENTURE',
	CULTURAL = 'CULTURAL',
	HISTORICAL = 'HISTORICAL',
	BEACH = 'BEACH',
	MOUNTAIN = 'MOUNTAIN',
	CITY = 'CITY',
	CRUISE = 'CRUISE',
}
registerEnumType(TourCategory, {
	name: 'TourCategory',
});

export enum TourStatus {
	ACTIVE = 'ACTIVE',
	SOLD_OUT = 'SOLD_OUT',
	PAUSED = 'PAUSED',
	DELETED = 'DELETED',
}
registerEnumType(TourStatus, {
	name: 'TourStatus',
});

export enum TourLocation {
	SEOUL = 'SEOUL',
	BUSAN = 'BUSAN',
	INCHEON = 'INCHEON',
	DAEGU = 'DAEGU',
	GYEONGJU = 'GYEONGJU',
	GWANGJU = 'GWANGJU',
	CHONJU = 'CHONJU',
	DAEJON = 'DAEJON',
	JEJU = 'JEJU',
}
registerEnumType(TourLocation, {
	name: 'TourLocation',
});

export enum TourLanguage {
	ENGLISH = 'ENGLISH',
	KOREAN = 'KOREAN',
	RUSSIAN = 'RUSSIAN',
	UZBEK = 'UZBEK',
}
registerEnumType(TourLanguage, {
	name: 'TourLanguage',
});

export enum TourDifficulty {
	EASY = 'EASY',
	MODERATE = 'MODERATE',
	CHALLENGING = 'CHALLENGING',
}
registerEnumType(TourDifficulty, {
	name: 'TourDifficulty',
});

export enum BookingStatus {
	PENDING = 'PENDING',
	CONFIRMED = 'CONFIRMED',
	CANCELLED = 'CANCELLED',
	COMPLETED = 'COMPLETED',
}
registerEnumType(BookingStatus, {
	name: 'BookingStatus',
});

export enum DestinationStatus {
	ACTIVE = 'ACTIVE',
	PAUSED = 'PAUSED',
	DELETED = 'DELETED',
}
registerEnumType(DestinationStatus, {
	name: 'DestinationStatus',
});

export enum TourScheduleStatus {
	ACTIVE = 'ACTIVE',
	SOLD_OUT = 'SOLD_OUT',
	CANCELLED = 'CANCELLED',
}
registerEnumType(TourScheduleStatus, {
	name: 'TourScheduleStatus',
});

export enum WishlistGroup {
	TOUR = 'TOUR',
}
registerEnumType(WishlistGroup, {
	name: 'WishlistGroup',
});

export enum PaymentStatus {
	PENDING = 'PENDING',
	PAID = 'PAID',
	FAILED = 'FAILED',
	REFUNDED = 'REFUNDED',
}
registerEnumType(PaymentStatus, {
	name: 'PaymentStatus',
});

export enum PaymentMethod {
	CARD = 'CARD',
	CASH = 'CASH',
	BANK_TRANSFER = 'BANK_TRANSFER',
}
registerEnumType(PaymentMethod, {
	name: 'PaymentMethod',
});
