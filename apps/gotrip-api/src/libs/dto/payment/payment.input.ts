import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { availablePaymentSorts } from '../../config';
import { Direction } from '../../enums/common.enum';
import { PaymentMethod, PaymentStatus } from '../../enums/tour.enum';

@InputType()
export class PaymentInput {
	@IsNotEmpty()
	@Field(() => PaymentMethod)
	paymentMethod: PaymentMethod;

	@IsNotEmpty()
	@Min(0)
	@Field(() => Number)
	paymentAmount: number;

	@IsNotEmpty()
	@Field(() => String)
	bookingId: mongoose.ObjectId;
}

@InputType()
class PaymentSearch {
	@IsOptional()
	@Field(() => PaymentStatus, { nullable: true })
	paymentStatus?: PaymentStatus;

	@IsOptional()
	@Field(() => PaymentMethod, { nullable: true })
	paymentMethod?: PaymentMethod;

	@IsOptional()
	@Field(() => String, { nullable: true })
	bookingId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	tourId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	startDate?: Date;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	endDate?: Date;
}

@InputType()
export class PaymentsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availablePaymentSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => PaymentSearch)
	search: PaymentSearch;
}

@InputType()
class AdminPaymentSearch extends PaymentSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: mongoose.ObjectId;
}

@InputType()
export class AllPaymentsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availablePaymentSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AdminPaymentSearch)
	search: AdminPaymentSearch;
}
