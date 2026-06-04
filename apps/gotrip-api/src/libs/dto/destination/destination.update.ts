import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import * as mongoose from 'mongoose';
import { DestinationStatus } from '../../enums/tour.enum';

@InputType()
export class DestinationUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: mongoose.ObjectId;

	@IsOptional()
	@Field(() => DestinationStatus, { nullable: true })
	destinationStatus?: DestinationStatus;

	@IsOptional()
	@Length(2, 80)
	@Field(() => String, { nullable: true })
	destinationCountry?: string;

	@IsOptional()
	@Length(2, 80)
	@Field(() => String, { nullable: true })
	destinationCity?: string;

	@IsOptional()
	@Length(2, 150)
	@Field(() => String, { nullable: true })
	destinationAddress?: string;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	destinationTitle?: string;

	@IsOptional()
	@Length(5, 700)
	@Field(() => String, { nullable: true })
	destinationDesc?: string;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	destinationImages?: string[];
}
