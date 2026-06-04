import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { BookingStatus } from '../../enums/tour.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Booking {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => BookingStatus)
	bookingStatus: BookingStatus;

	@Field(() => String)
	bookingNumber: string;

	@Field(() => String)
	tourId: mongoose.ObjectId;

	@Field(() => String)
	memberId: mongoose.ObjectId;

	@Field(() => String)
	agentId: mongoose.ObjectId;

	@Field(() => String)
	scheduleId: mongoose.ObjectId;

	@Field(() => Int)
	peopleCount: number;

	@Field(() => Number)
	totalPrice: number;

	@Field(() => Date)
	bookingDate: Date;

	@Field(() => String)
	travelerName: string;

	@Field(() => String)
	travelerEmail: string;

	@Field(() => String)
	travelerPhone: string;

	@Field(() => String, { nullable: true })
	passportNumber?: string;

	@Field(() => String, { nullable: true })
	specialRequest?: string;

	@Field(() => String, { nullable: true })
	cancelReason?: string;

	@Field(() => Date, { nullable: true })
	cancelledAt?: Date;

	@Field(() => Date)
	expiresAt: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Bookings {
	@Field(() => [Booking])
	list: Booking[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
