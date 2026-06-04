import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { TourScheduleStatus } from '../../enums/tour.enum';
import { availableTourScheduleSorts } from '../../config';

@InputType()
export class TourScheduleInput {
	@IsNotEmpty()
	@Field(() => String)
	tourId: mongoose.ObjectId;

	@IsNotEmpty()
	@Field(() => Date)
	startDate: Date;

	@IsNotEmpty()
	@Field(() => Date)
	endDate: Date;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	availableSeats: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	reservedSeats?: number;

	@IsNotEmpty()
	@Min(0)
	@Field(() => Number)
	price: number;
}

@InputType()
export class TourSchedulesInquiry {
	@IsNotEmpty()
	@Field(() => String)
	tourId: mongoose.ObjectId;
}

@InputType()
class ATSISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	tourId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => TourScheduleStatus, { nullable: true })
	scheduleStatus?: TourScheduleStatus;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	startDate?: Date;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	endDate?: Date;
}

@InputType()
export class AllTourSchedulesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableTourScheduleSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ATSISearch)
	search: ATSISearch;
}
