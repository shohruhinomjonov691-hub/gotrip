import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TourCategory, TourDifficulty, TourLanguage, TourLocation, TourStatus } from '../../enums/tour.enum';
import * as mongoose from 'mongoose';
import { TourTranslationInput } from './tour.input';

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
	@Min(1)
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

	// Set by the service (not client-supplied — no @Field), but still needs at least one
	// class-validator decorator: with whitelist+forbidNonWhitelisted, an undecorated class
	// field is instantiated as an own `undefined` property (useDefineForClassFields) and gets
	// rejected as "should not exist" even when the client never sent it. @IsOptional prevents that.
	@IsOptional()
	deletedAt?: Date;
}
