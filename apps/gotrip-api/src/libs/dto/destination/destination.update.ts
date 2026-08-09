import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import * as mongoose from 'mongoose';
import { DestinationStatus } from '../../enums/destination.enum';
import { TourLocation } from '../../enums/tour.enum';
import { DestinationCoordinatesInput, DestinationTranslationInput } from './destination.input';

@InputType()
export class DestinationUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: mongoose.ObjectId;

	@IsOptional()
	@Field(() => DestinationStatus, { nullable: true })
	destinationStatus?: DestinationStatus;

	// Reassign ownership to a different Guide. Must be a Member with MemberType.AGENT.
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	destinationTitle?: string;

	@IsOptional()
	@Length(0, 2000)
	@Field(() => String, { nullable: true })
	destinationDesc?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	destinationThumbnail?: string;

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

	@IsOptional()
	@Field(() => String, { nullable: true })
	destinationCountry?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	destinationCity?: string;

	@IsOptional()
	@Field(() => DestinationCoordinatesInput, { nullable: true })
	destinationCoordinates?: DestinationCoordinatesInput;

	@IsOptional()
	@Field(() => TourLocation, { nullable: true })
	locationKey?: TourLocation;

	@IsOptional()
	@Field(() => [DestinationTranslationInput], { nullable: true })
	translations?: DestinationTranslationInput[];

	// Set by the service (not client-supplied — no @Field), but still needs at least one
	// class-validator decorator: with whitelist+forbidNonWhitelisted, an undecorated class
	// field is instantiated as an own `undefined` property (useDefineForClassFields) and gets
	// rejected as "should not exist" even when the client never sent it. @IsOptional prevents that.
	@IsOptional()
	deletedAt?: Date;
}
