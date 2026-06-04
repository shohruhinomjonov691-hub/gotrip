import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { TourScheduleStatus } from '../../enums/tour.enum';

@InputType()
export class TourScheduleUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: mongoose.ObjectId;

	@IsOptional()
	@Field(() => TourScheduleStatus, { nullable: true })
	scheduleStatus?: TourScheduleStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	tourId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	startDate?: Date;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	endDate?: Date;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	availableSeats?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	reservedSeats?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	price?: number;
}
