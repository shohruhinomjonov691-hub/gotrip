import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
	ArrayMaxSize,
	ArrayNotEmpty,
	IsEnum,
	IsIn,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	Length,
	Max,
	MaxLength,
	Min,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TourCategory, TourDifficulty, TourLanguage, TourLocation, TourStatus } from '../../enums/tour.enum';
import { Locale } from '../../enums/locale.enum';
import * as mongoose from 'mongoose';
import { availableTourSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

/**
 * A guide/owner may hand-correct a per-locale override for their own tour
 * (see TourService.updateTour, which scopes the write to the caller's own
 * memberId — this DTO does not itself grant access to anyone else's tour).
 * Same bounds as the base TourInput/TourUpdate fields these mirror, so a
 * translation can't smuggle in a wildly oversized or malformed payload that
 * the base field would have rejected outright.
 */
@InputType()
export class TourTranslationInput {
	@IsNotEmpty()
	@IsEnum(Locale)
	@Field(() => Locale)
	locale: Locale;

	@IsOptional()
	@IsString()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	tourTitle?: string;

	@IsOptional()
	@IsString()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	tourDesc?: string;

	@IsOptional()
	@IsString()
	@MaxLength(300)
	@Field(() => String, { nullable: true })
	tourMeetingPoint?: string;

	@IsOptional()
	@IsString({ each: true })
	@MaxLength(300, { each: true })
	@ArrayMaxSize(50)
	@Field(() => [String], { nullable: true })
	tourItinerary?: string[];

	@IsOptional()
	@IsString({ each: true })
	@MaxLength(300, { each: true })
	@ArrayMaxSize(50)
	@Field(() => [String], { nullable: true })
	tourIncluded?: string[];

	@IsOptional()
	@IsString({ each: true })
	@MaxLength(300, { each: true })
	@ArrayMaxSize(50)
	@Field(() => [String], { nullable: true })
	tourExcluded?: string[];
}

@InputType()
export class TourInput {
	@IsNotEmpty()
	@Field(() => TourCategory)
	tourCategory: TourCategory;

	@IsNotEmpty()
	@Field(() => TourLocation)
	tourLocation: TourLocation;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	tourTitle: string;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Number)
	tourPrice: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	tourDuration: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	tourMaxPeople: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	tourMinPeople: number;

	@IsNotEmpty()
	@IsInt()
	@Min(0)
	@Field(() => Int)
	tourAvailableSeats: number;

	@IsNotEmpty()
	@ArrayNotEmpty()
	@Field(() => [String])
	tourImages: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	tourDesc?: string;

	@IsOptional()
	@Min(0)
	@Max(5)
	@Field(() => Float, { nullable: true })
	tourRating?: number;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	tourItinerary?: string[];

	@IsOptional()
	@Field(() => [String], { nullable: true })
	tourIncluded?: string[];

	@IsOptional()
	@Field(() => [String], { nullable: true })
	tourExcluded?: string[];

	@IsOptional()
	@Field(() => String, { nullable: true })
	tourMeetingPoint?: string;

	@IsOptional()
	@Field(() => TourLanguage, { nullable: true })
	tourLanguage?: TourLanguage;

	@IsOptional()
	@Field(() => TourDifficulty, { nullable: true })
	tourDifficulty?: TourDifficulty;

	@IsOptional()
	@Field(() => String, { nullable: true })
	destinationId?: mongoose.ObjectId;

	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => TourTranslationInput)
	@Field(() => [TourTranslationInput], { nullable: true })
	translations?: TourTranslationInput[];

	// Set by the service from the auth token (not client-supplied — no @Field), but still
	// needs at least one class-validator decorator: with whitelist+forbidNonWhitelisted, an
	// undecorated class field is instantiated as an own `undefined` property
	// (useDefineForClassFields) and gets rejected as "should not exist" even when the client
	// never sent it. @IsOptional prevents that.
	@IsOptional()
	memberId?: mongoose.ObjectId;
}

@InputType()
export class PricesRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class PeriodsRange {
	@Field(() => Date)
	start: Date;

	@Field(() => Date)
	end: Date;
}

@InputType()
class PISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => [TourLocation], { nullable: true })
	locationList?: TourLocation[];

	@IsOptional()
	@Field(() => [TourCategory], { nullable: true })
	categoryList?: TourCategory[];

	@IsOptional()
	@Field(() => String, { nullable: true })
	destinationId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => PricesRange, { nullable: true })
	pricesRange?: PricesRange;

	@IsOptional()
	@Field(() => PeriodsRange, { nullable: true })
	periodsRange?: PeriodsRange;

	@IsOptional()
	@Field(() => PricesRange, { nullable: true })
	durationRange?: PricesRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class ToursInquiry {
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
	@IsIn(availableTourSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => PISearch)
	search: PISearch;
}

@InputType()
class APISearch {
	@IsOptional()
	@Field(() => TourStatus, { nullable: true })
	tourStatus?: TourStatus;
}

@InputType()
export class AgentToursInquiry {
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
	@IsIn(availableTourSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => APISearch)
	search: APISearch;
}

@InputType()
class ALPISearch {
	@IsOptional()
	@Field(() => TourStatus, { nullable: true })
	tourStatus?: TourStatus;

	@IsOptional()
	@Field(() => [TourLocation], { nullable: true })
	tourLocationList?: TourLocation[];

	@IsOptional()
	@Field(() => [TourCategory], { nullable: true })
	tourCategoryList?: TourCategory[];
}

@InputType()
export class AllToursInquiry {
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
	@IsIn(availableTourSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ALPISearch)
	search: ALPISearch;
}

@InputType()
export class OrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit: number;
}
