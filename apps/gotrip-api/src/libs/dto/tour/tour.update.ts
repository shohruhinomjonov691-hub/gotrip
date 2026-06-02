import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { TourCategory, TourDifficulty, TourLanguage, TourLocation, TourStatus } from '../../enums/tour.enum';
import * as mongoose from 'mongoose';

@InputType()
export class TourUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: mongoose.ObjectId;

	@IsOptional()
	@Field(() => TourCategory, { nullable: true })
	tourCategory?: TourCategory;

	@IsOptional()
	@Field(() => TourStatus, { nullable: true })
	tourStatus?: TourStatus;

	@IsOptional()
	@Field(() => TourLocation, { nullable: true })
	tourLocation?: TourLocation;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	tourTitle?: string;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	tourPrice?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	tourDuration?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	tourMaxPeople?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	tourMinPeople?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	tourAvailableSeats?: number;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	tourImages?: string[];

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

	deletedAt?: Date;
}
