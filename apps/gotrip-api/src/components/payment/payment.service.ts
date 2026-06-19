import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Payment, Payments } from '../../libs/dto/payment/payment';
import { AllPaymentsInquiry, PaymentInput, PaymentsInquiry } from '../../libs/dto/payment/payment.input';
import { Booking } from '../../libs/dto/booking/booking';
import { BookingService } from '../booking/booking.service';
import { BookingStatus, PaymentStatus } from '../../libs/enums/tour.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class PaymentService {
	constructor(
		@InjectModel('Payment') private readonly paymentModel: Model<Payment>,
		@InjectModel('Booking') private readonly bookingModel: Model<Booking>,
		private bookingService: BookingService,
		private notificationService: NotificationService,
	) {}

	public async createPayment(memberId: ObjectId, input: PaymentInput): Promise<Payment> {
		const booking = await this.bookingModel
			.findOne({
				_id: input.bookingId,
				memberId,
				bookingStatus: BookingStatus.PENDING,
			})
			.exec();
		if (!booking) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (booking.expiresAt.getTime() <= Date.now()) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		if (input.paymentAmount !== booking.totalPrice) throw new BadRequestException(Message.BAD_REQUEST);

		const activePayment = await this.paymentModel
			.findOne({
				bookingId: booking._id,
				paymentStatus: { $in: [PaymentStatus.PENDING, PaymentStatus.PAID] },
			})
			.exec();
		if (activePayment) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		try {
			const payment = await this.paymentModel.create({
				...input,
				paymentStatus: PaymentStatus.PENDING,
				memberId,
				tourId: booking.tourId,
			});
			return await this.executePaymentSuccess(payment._id, `DEMO-${payment._id}`);
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getMyPayments(memberId: ObjectId, input: PaymentsInquiry): Promise<Payments> {
		const match: T = { memberId };
		return await this.getPaymentsByMatch(match, input);
	}

	public async getMyPayment(memberId: ObjectId, paymentId: ObjectId): Promise<Payment> {
		const payment = await this.paymentModel.findOne({ _id: paymentId, memberId }).exec();
		if (!payment) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return payment;
	}

	public async getAgentPayments(agentId: ObjectId, input: PaymentsInquiry): Promise<Payments> {
		const match: T = {};
		this.shapePaymentMatchQuery(match, input.search);
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.paymentModel
			.aggregate([
				{ $match: match },
				{
					$lookup: {
						from: 'bookings',
						localField: 'bookingId',
						foreignField: '_id',
						as: 'bookingData',
					},
				},
				{ $unwind: '$bookingData' },
				{ $match: { 'bookingData.agentId': agentId } },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async getAgentPayment(agentId: ObjectId, paymentId: ObjectId): Promise<Payment> {
		const result = await this.paymentModel
			.aggregate([
				{ $match: { _id: paymentId } },
				{
					$lookup: {
						from: 'bookings',
						localField: 'bookingId',
						foreignField: '_id',
						as: 'bookingData',
					},
				},
				{ $unwind: '$bookingData' },
				{ $match: { 'bookingData.agentId': agentId } },
				{ $limit: 1 },
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	/** ADMIN **/

	public async getAllPaymentsByAdmin(input: AllPaymentsInquiry): Promise<Payments> {
		const match: T = {};
		return await this.getPaymentsByMatch(match, input);
	}

	public async getPaymentByAdmin(paymentId: ObjectId): Promise<Payment> {
		const payment = await this.paymentModel.findById(paymentId).exec();
		if (!payment) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return payment;
	}

	public async markPaymentSuccessByAdmin(paymentId: ObjectId, transactionId: string): Promise<Payment> {
		if (!transactionId) throw new BadRequestException(Message.BAD_REQUEST);

		return await this.executePaymentSuccess(paymentId, transactionId);
	}

	public async markPaymentFailedByAdmin(paymentId: ObjectId): Promise<Payment> {
		const payment = await this.paymentModel
			.findOneAndUpdate(
				{
					_id: paymentId,
					paymentStatus: PaymentStatus.PENDING,
				},
				{ paymentStatus: PaymentStatus.FAILED },
				{ new: true },
			)
			.exec();
		if (!payment) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		await this.bookingService.markBookingPaymentFailed(payment.bookingId);
		await this.notificationService.notifyPaymentFailed(payment._id);
		return payment;
	}

	public async refundPaymentByAdmin(paymentId: ObjectId): Promise<Payment> {
		const payment = await this.paymentModel
			.findOne({
				_id: paymentId,
				paymentStatus: PaymentStatus.PAID,
			})
			.exec();
		if (!payment) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const booking = await this.bookingModel
			.findOne({
				_id: payment.bookingId,
				bookingStatus: BookingStatus.CONFIRMED,
			})
			.exec();
		if (!booking) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const result = await this.paymentModel
			.findOneAndUpdate(
				{
					_id: paymentId,
					paymentStatus: PaymentStatus.PAID,
				},
				{
					paymentStatus: PaymentStatus.REFUNDED,
					refundedAt: new Date(),
				},
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		await this.bookingService.cancelBookingByAdmin(payment.bookingId, 'Payment refunded.');
		return result;
	}

	public async cancelPaymentByAdmin(paymentId: ObjectId): Promise<Payment> {
		const payment = await this.paymentModel
			.findOneAndUpdate(
				{
					_id: paymentId,
					paymentStatus: PaymentStatus.PENDING,
				},
				{ paymentStatus: PaymentStatus.CANCELLED },
				{ new: true },
			)
			.exec();
		if (!payment) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return payment;
	}

	private async executePaymentSuccess(paymentId: ObjectId, transactionId: string): Promise<Payment> {
		const payment = await this.paymentModel
			.findOneAndUpdate(
				{
					_id: paymentId,
					paymentStatus: PaymentStatus.PENDING,
				},
				{
					paymentStatus: PaymentStatus.PAID,
					transactionId,
					paidAt: new Date(),
				},
				{ new: true },
			)
			.exec();
		if (!payment) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		await this.bookingService.markBookingConfirmed(payment.bookingId);
		await this.notificationService.notifyPaymentSuccess(payment._id);
		return payment;
	}

	private async getPaymentsByMatch(match: T, input: PaymentsInquiry | AllPaymentsInquiry): Promise<Payments> {
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		this.shapePaymentMatchQuery(match, input.search);

		const result = await this.paymentModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	private shapePaymentMatchQuery(match: T, search: T): void {
		if (search.paymentStatus) match.paymentStatus = search.paymentStatus;
		if (search.paymentMethod) match.paymentMethod = search.paymentMethod;
		if (search.bookingId) match.bookingId = shapeIntoMongoObjectId(search.bookingId);
		if (search.memberId) match.memberId = shapeIntoMongoObjectId(search.memberId);
		if (search.tourId) match.tourId = shapeIntoMongoObjectId(search.tourId);
		if (search.startDate || search.endDate) {
			match.createdAt = {};
			if (search.startDate) match.createdAt.$gte = search.startDate;
			if (search.endDate) match.createdAt.$lte = search.endDate;
		}
	}
}
