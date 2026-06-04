import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import * as mongoose from 'mongoose';
import { BookingStatus } from '../../enums/tour.enum';

@InputType()
export class BookingUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: mongoose.ObjectId;

	@IsOptional()
	@Field(() => BookingStatus, { nullable: true })
	bookingStatus?: BookingStatus;

	@IsOptional()
	@Length(2, 80)
	@Field(() => String, { nullable: true })
	travelerName?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	travelerEmail?: string;

	@IsOptional()
	@Length(5, 30)
	@Field(() => String, { nullable: true })
	travelerPhone?: string;

	@IsOptional()
	@Length(3, 40)
	@Field(() => String, { nullable: true })
	passportNumber?: string;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	specialRequest?: string;

	@IsOptional()
	@Length(1, 300)
	@Field(() => String, { nullable: true })
	cancelReason?: string;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	expiresAt?: Date;
}
