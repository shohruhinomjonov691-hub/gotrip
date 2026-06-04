import { Field, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../../enums/tour.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Payment {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => PaymentStatus)
	paymentStatus: PaymentStatus;

	@Field(() => PaymentMethod)
	paymentMethod: PaymentMethod;

	@Field(() => Number)
	paymentAmount: number;

	@Field(() => String)
	bookingId: mongoose.ObjectId;

	@Field(() => String)
	memberId: mongoose.ObjectId;

	@Field(() => String)
	tourId: mongoose.ObjectId;

	@Field(() => String, { nullable: true })
	transactionId?: string;

	@Field(() => Date, { nullable: true })
	paidAt?: Date;

	@Field(() => Date, { nullable: true })
	refundedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Payments {
	@Field(() => [Payment])
	list: Payment[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
