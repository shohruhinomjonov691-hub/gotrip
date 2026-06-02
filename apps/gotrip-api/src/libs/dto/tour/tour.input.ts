import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { TourCategory, TourDifficulty, TourLanguage, TourLocation, TourStatus } from '../../enums/tour.enum';
import * as mongoose from 'mongoose';
import { availableTourSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

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
	tourTitle: String;

	@IsNotEmpty()
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
	@Field(() => [String])
	tourImages: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	tourDesc?: string;

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
	@Field(() => Int)
	limit: number;
}
