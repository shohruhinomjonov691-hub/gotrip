import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { BookingStatus } from '../../enums/tour.enum';
import { availableBookingSorts } from '../../config';

@InputType()
export class BookingInput {
	@IsNotEmpty()
	@Field(() => String)
	tourId: mongoose.ObjectId;

	@IsNotEmpty()
	@Field(() => String)
	scheduleId: mongoose.ObjectId;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	peopleCount: number;

	@IsNotEmpty()
	@Length(2, 80)
	@Field(() => String)
	travelerName: string;

	@IsNotEmpty()
	@IsEmail()
	@Field(() => String)
	travelerEmail: string;

	@IsNotEmpty()
	@Length(5, 30)
	@Field(() => String)
	travelerPhone: string;

	@IsOptional()
	@Length(3, 40)
	@Field(() => String, { nullable: true })
	passportNumber?: string;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	specialRequest?: string;
}

@InputType()
class BookingSearch {
	@IsOptional()
	@Field(() => BookingStatus, { nullable: true })
	bookingStatus?: BookingStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	tourId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	scheduleId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	bookingNumber?: string;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	startDate?: Date;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	endDate?: Date;
}

@InputType()
export class BookingsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableBookingSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => BookingSearch)
	search: BookingSearch;
}

@InputType()
class AdminBookingSearch extends BookingSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	agentId?: mongoose.ObjectId;
}

@InputType()
export class AllBookingsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableBookingSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AdminBookingSearch)
	search: AdminBookingSearch;
}
