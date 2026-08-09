import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { ArrayNotEmpty, IsIn, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { TourLocation } from '../../enums/tour.enum';
import { Direction } from '../../enums/common.enum';
import { DestinationStatus } from '../../enums/destination.enum';
import { Locale } from '../../enums/locale.enum';

@InputType()
export class DestinationTranslationInput {
	@IsNotEmpty()
	@Field(() => Locale)
	locale: Locale;

	@IsOptional()
	@Field(() => String, { nullable: true })
	destinationTitle?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	destinationDesc?: string;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	destinationHighlights?: string[];

	@IsOptional()
	@Field(() => String, { nullable: true })
	destinationSeason?: string;
}

export const availableDestinationSorts = [
	'createdAt',
	'updatedAt',
	'destinationViews',
	'destinationLikes',
	'destinationRank',
];

@InputType()
export class DestinationCoordinatesInput {
	@Field(() => Float)
	lat: number;

	@Field(() => Float)
	lng: number;
}

@InputType()
export class DestinationInput {
	// Must be a Member with MemberType.AGENT — validated server-side, not just by type.
	@IsNotEmpty()
	@Field(() => String)
	memberId: string;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	destinationTitle: string;

	@IsOptional()
	@Length(0, 2000)
	@Field(() => String, { nullable: true })
	destinationDesc?: string;

	@IsNotEmpty()
	@Field(() => String)
	destinationThumbnail: string;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	destinationGallery?: string[];

	@IsOptional()
	@Field(() => [String], { nullable: true })
	destinationHighlights?: string[];

	@IsOptional()
	@Length(0, 60)
	@Field(() => String, { nullable: true })
	destinationSeason?: string;

	@IsNotEmpty()
	@Field(() => String)
	destinationCountry: string;

	@IsNotEmpty()
	@Field(() => String)
	destinationCity: string;

	@IsOptional()
	@Field(() => DestinationCoordinatesInput, { nullable: true })
	destinationCoordinates?: DestinationCoordinatesInput;

	@IsOptional()
	@Field(() => TourLocation, { nullable: true })
	locationKey?: TourLocation;

	@IsOptional()
	@Field(() => [DestinationTranslationInput], { nullable: true })
	translations?: DestinationTranslationInput[];
}

@InputType()
class DISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	country?: string;

	@IsOptional()
	@Field(() => TourLocation, { nullable: true })
	locationKey?: TourLocation;
}

@InputType()
export class DestinationsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableDestinationSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => DISearch)
	search: DISearch;
}

@InputType()
class ADISearch extends DISearch {
	@IsOptional()
	@Field(() => DestinationStatus, { nullable: true })
	destinationStatus?: DestinationStatus;
}

@InputType()
export class AllDestinationsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableDestinationSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ADISearch)
	search: ADISearch;
}
