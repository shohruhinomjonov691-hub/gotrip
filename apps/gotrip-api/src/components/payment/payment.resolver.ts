import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { PaymentService } from './payment.service';
import { Payment, Payments } from '../../libs/dto/payment/payment';
import { AllPaymentsInquiry, PaymentInput, PaymentsInquiry } from '../../libs/dto/payment/payment.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class PaymentResolver {
	constructor(private readonly paymentService: PaymentService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Payment)
	public async createPayment(
		@Args('input') input: PaymentInput,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Payment> {
		console.log('Mutation: createPayment');
		input.bookingId = shapeIntoMongoObjectId(input.bookingId);
		return await this.paymentService.createPayment(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Payments)
	public async getMyPayments(
		@Args('input') input: PaymentsInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Payments> {
		console.log('Query: getMyPayments');
		this.shapePaymentsInquiry(input);
		return await this.paymentService.getMyPayments(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Payment)
	public async getMyPayment(
		@Args('paymentId') input: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Payment> {
		console.log('Query: getMyPayment');
		const paymentId = shapeIntoMongoObjectId(input);
		return await this.paymentService.getMyPayment(memberId, paymentId);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => Payments)
	public async getAgentPayments(
		@Args('input') input: PaymentsInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Payments> {
		console.log('Query: getAgentPayments');
		this.shapePaymentsInquiry(input);
		return await this.paymentService.getAgentPayments(memberId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => Payment)
	public async getAgentPayment(
		@Args('paymentId') input: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Payment> {
		console.log('Query: getAgentPayment');
		const paymentId = shapeIntoMongoObjectId(input);
		return await this.paymentService.getAgentPayment(memberId, paymentId);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Payments)
	public async getAllPaymentsByAdmin(@Args('input') input: AllPaymentsInquiry): Promise<Payments> {
		console.log('Query: getAllPaymentsByAdmin');
		this.shapeAllPaymentsInquiry(input);
		return await this.paymentService.getAllPaymentsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Payment)
	public async getPaymentByAdmin(@Args('paymentId') input: string): Promise<Payment> {
		console.log('Query: getPaymentByAdmin');
		const paymentId = shapeIntoMongoObjectId(input);
		return await this.paymentService.getPaymentByAdmin(paymentId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Payment)
	public async markPaymentSuccessByAdmin(
		@Args('paymentId') input: string,
		@Args('transactionId') transactionId: string,
	): Promise<Payment> {
		console.log('Mutation: markPaymentSuccessByAdmin');
		const paymentId = shapeIntoMongoObjectId(input);
		return await this.paymentService.markPaymentSuccessByAdmin(paymentId, transactionId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Payment)
	public async markPaymentFailedByAdmin(@Args('paymentId') input: string): Promise<Payment> {
		console.log('Mutation: markPaymentFailedByAdmin');
		const paymentId = shapeIntoMongoObjectId(input);
		return await this.paymentService.markPaymentFailedByAdmin(paymentId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Payment)
	public async refundPaymentByAdmin(@Args('paymentId') input: string): Promise<Payment> {
		console.log('Mutation: refundPaymentByAdmin');
		const paymentId = shapeIntoMongoObjectId(input);
		return await this.paymentService.refundPaymentByAdmin(paymentId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Payment)
	public async cancelPaymentByAdmin(@Args('paymentId') input: string): Promise<Payment> {
		console.log('Mutation: cancelPaymentByAdmin');
		const paymentId = shapeIntoMongoObjectId(input);
		return await this.paymentService.cancelPaymentByAdmin(paymentId);
	}

	private shapePaymentsInquiry(input: PaymentsInquiry): void {
		if (input.search.bookingId) input.search.bookingId = shapeIntoMongoObjectId(input.search.bookingId);
		if (input.search.tourId) input.search.tourId = shapeIntoMongoObjectId(input.search.tourId);
	}

	private shapeAllPaymentsInquiry(input: AllPaymentsInquiry): void {
		this.shapePaymentsInquiry(input);
		if (input.search.memberId) input.search.memberId = shapeIntoMongoObjectId(input.search.memberId);
	}
}
