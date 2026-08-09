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
	PARIS = 'PARIS',
	LONDON = 'LONDON',
	ROME = 'ROME',
	BARCELONA = 'BARCELONA',
	ISTANBUL = 'ISTANBUL',
	DUBAI = 'DUBAI',
	TOKYO = 'TOKYO',
	BALI = 'BALI',
	BANGKOK = 'BANGKOK',
	SINGAPORE = 'SINGAPORE',
	NEW_YORK = 'NEW_YORK',
	TASHKENT = 'TASHKENT',
	SAMARKAND = 'SAMARKAND',
	CAIRO = 'CAIRO',
	AMSTERDAM = 'AMSTERDAM',
	MALDIVES = 'MALDIVES',
	PRAGUE = 'PRAGUE',
	SANTORINI = 'SANTORINI',
	BUKHARA = 'BUKHARA',
	KHIVA = 'KHIVA',
	SHAHRISABZ = 'SHAHRISABZ',
	CHORVOQ = 'CHORVOQ',
	NUROTA = 'NUROTA',
	AMIRSOY = 'AMIRSOY',
	ZOMIN = 'ZOMIN',
	CHIMYON = 'CHIMYON',
	MUYNOQ = 'MUYNOQ',
	NAMI = 'NAMI',
	SEORAKSAN = 'SEORAKSAN',
	KYOTO = 'KYOTO',
	ZERMATT = 'ZERMATT',
	AMALFI = 'AMALFI',
	GOREME = 'GOREME',
	HALONG = 'HALONG',
	CORTINA = 'CORTINA',
	MARRAKECH = 'MARRAKECH',
	PETRA = 'PETRA',
	DUBROVNIK = 'DUBROVNIK',
	LISBON = 'LISBON',
	POKHARA = 'POKHARA',
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

