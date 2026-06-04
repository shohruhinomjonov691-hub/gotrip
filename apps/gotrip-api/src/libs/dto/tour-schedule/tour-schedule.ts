import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { TourScheduleStatus } from '../../enums/tour.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class TourSchedule {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => TourScheduleStatus)
	scheduleStatus: TourScheduleStatus;

	@Field(() => String)
	tourId: mongoose.ObjectId;

	@Field(() => Date)
	startDate: Date;

	@Field(() => Date)
	endDate: Date;

	@Field(() => Int)
	availableSeats: number;

	@Field(() => Int)
	reservedSeats: number;

	@Field(() => Number)
	price: number;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class TourSchedules {
	@Field(() => [TourSchedule])
	list: TourSchedule[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
