import { Types } from 'mongoose';
import { PaymentService } from './payment.service';
import { BookingStatus, PaymentMethod, PaymentStatus } from '../../libs/enums/tour.enum';

const execResult = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('PaymentService.createPayment', () => {
	let paymentModel: { create: jest.Mock; findOne: jest.Mock; findOneAndUpdate: jest.Mock };
	let bookingModel: { findOne: jest.Mock };
	let bookingService: { markBookingConfirmed: jest.Mock };
	let notificationService: { notifyPaymentSuccess: jest.Mock };
	let service: PaymentService;

	beforeEach(() => {
		paymentModel = {
			create: jest.fn(),
			findOne: jest.fn(),
			findOneAndUpdate: jest.fn(),
		};
		bookingModel = { findOne: jest.fn() };
		bookingService = { markBookingConfirmed: jest.fn() };
		notificationService = { notifyPaymentSuccess: jest.fn() };
		service = new PaymentService(paymentModel as any, bookingModel as any, bookingService as any, notificationService as any);
	});

	it('creates a pending demo payment and immediately executes the shared success workflow', async () => {
		const memberId = new Types.ObjectId();
		const bookingId = new Types.ObjectId();
		const tourId = new Types.ObjectId();
		const paymentId = new Types.ObjectId();
		const booking = {
			_id: bookingId,
			memberId,
			tourId,
			totalPrice: 250,
			bookingStatus: BookingStatus.PENDING,
			expiresAt: new Date(Date.now() + 60_000),
		};
		const pendingPayment = {
			_id: paymentId,
			bookingId,
			memberId,
			tourId,
			paymentStatus: PaymentStatus.PENDING,
		};
		const paidPayment = {
			...pendingPayment,
			paymentStatus: PaymentStatus.PAID,
			transactionId: `DEMO-${paymentId}`,
			paidAt: new Date(),
		};

		bookingModel.findOne.mockReturnValue(execResult(booking));
		paymentModel.findOne.mockReturnValue(execResult(null));
		paymentModel.create.mockResolvedValue(pendingPayment);
		paymentModel.findOneAndUpdate.mockReturnValue(execResult(paidPayment));
		bookingService.markBookingConfirmed.mockResolvedValue({});
		notificationService.notifyPaymentSuccess.mockResolvedValue({});

		const result = await service.createPayment(memberId as any, {
			bookingId: bookingId as any,
			paymentMethod: PaymentMethod.CARD,
			paymentAmount: 250,
		});

		expect(result).toBe(paidPayment);
		expect(paymentModel.create).toHaveBeenCalledWith({
			bookingId,
			paymentMethod: PaymentMethod.CARD,
			paymentAmount: 250,
			paymentStatus: PaymentStatus.PENDING,
			memberId,
			tourId,
		});
		expect(paymentModel.findOneAndUpdate).toHaveBeenCalledWith(
			{ _id: paymentId, paymentStatus: PaymentStatus.PENDING },
			{
				paymentStatus: PaymentStatus.PAID,
				transactionId: `DEMO-${paymentId}`,
				paidAt: expect.any(Date),
			},
			{ new: true },
		);
		expect(bookingService.markBookingConfirmed).toHaveBeenCalledWith(bookingId);
		expect(notificationService.notifyPaymentSuccess).toHaveBeenCalledWith(paymentId);
	});
});

describe('PaymentService admin lifecycle methods', () => {

	let paymentModel: { findOne: jest.Mock; findOneAndUpdate: jest.Mock };
	let bookingModel: { findOne: jest.Mock };
	let bookingService: { markBookingConfirmed: jest.Mock; markBookingPaymentFailed: jest.Mock };
	let notificationService: { notifyPaymentSuccess: jest.Mock; notifyPaymentFailed: jest.Mock };
	let service: PaymentService;

	beforeEach(() => {
		paymentModel = { findOne: jest.fn(), findOneAndUpdate: jest.fn() };
		bookingModel = { findOne: jest.fn() };
		bookingService = { markBookingConfirmed: jest.fn(), markBookingPaymentFailed: jest.fn() };
		notificationService = { notifyPaymentSuccess: jest.fn(), notifyPaymentFailed: jest.fn() };
		service = new PaymentService(paymentModel as any, bookingModel as any, bookingService as any, notificationService as any);
	});

	it('keeps admin success on the shared success workflow', async () => {
		const paymentId = new Types.ObjectId();
		const bookingId = new Types.ObjectId();
		const paidPayment = {
			_id: paymentId,
			bookingId,
			paymentStatus: PaymentStatus.PAID,
			transactionId: 'admin-tx',
		};

		paymentModel.findOneAndUpdate.mockReturnValue(execResult(paidPayment));
		bookingService.markBookingConfirmed.mockResolvedValue({});
		notificationService.notifyPaymentSuccess.mockResolvedValue({});

		const result = await service.markPaymentSuccessByAdmin(paymentId as any, 'admin-tx');

		expect(result).toBe(paidPayment);
		expect(paymentModel.findOneAndUpdate).toHaveBeenCalledWith(
			{ _id: paymentId, paymentStatus: PaymentStatus.PENDING },
			{
				paymentStatus: PaymentStatus.PAID,
				transactionId: 'admin-tx',
				paidAt: expect.any(Date),
			},
			{ new: true },
		);
		expect(bookingService.markBookingConfirmed).toHaveBeenCalledWith(bookingId);
		expect(notificationService.notifyPaymentSuccess).toHaveBeenCalledWith(paymentId);
	});

	it('marks the payment failed, cancels the booking, and notifies the member', async () => {
		const paymentId = new Types.ObjectId();
		const bookingId = new Types.ObjectId();
		const failedPayment = {
			_id: paymentId,
			bookingId,
			paymentStatus: PaymentStatus.FAILED,
		};

		paymentModel.findOneAndUpdate.mockReturnValue(execResult(failedPayment));
		bookingService.markBookingPaymentFailed.mockResolvedValue({});
		notificationService.notifyPaymentFailed.mockResolvedValue({});

		const result = await service.markPaymentFailedByAdmin(paymentId as any);

		expect(result).toBe(failedPayment);
		expect(paymentModel.findOneAndUpdate).toHaveBeenCalledWith(
			{ _id: paymentId, paymentStatus: PaymentStatus.PENDING },
			{ paymentStatus: PaymentStatus.FAILED },
			{ new: true },
		);
		expect(bookingService.markBookingPaymentFailed).toHaveBeenCalledWith(bookingId);
		expect(notificationService.notifyPaymentFailed).toHaveBeenCalledWith(paymentId);
	});

	it('keeps admin refund callable for paid payments with confirmed bookings', async () => {
		const paymentId = new Types.ObjectId();
		const bookingId = new Types.ObjectId();
		const paidPayment = {
			_id: paymentId,
			bookingId,
			paymentStatus: PaymentStatus.PAID,
		};
		const refundedPayment = {
			...paidPayment,
			paymentStatus: PaymentStatus.REFUNDED,
			refundedAt: new Date(),
		};
		const cancelBookingByAdmin = jest.fn().mockResolvedValue({});
		(service as any).bookingService.cancelBookingByAdmin = cancelBookingByAdmin;

		paymentModel.findOne.mockReturnValue(execResult(paidPayment));
		bookingModel.findOne.mockReturnValue(execResult({ _id: bookingId, bookingStatus: BookingStatus.CONFIRMED }));
		paymentModel.findOneAndUpdate.mockReturnValue(execResult(refundedPayment));

		const result = await service.refundPaymentByAdmin(paymentId as any);

		expect(result).toBe(refundedPayment);
		expect(paymentModel.findOneAndUpdate).toHaveBeenCalledWith(
			{ _id: paymentId, paymentStatus: PaymentStatus.PAID },
			{
				paymentStatus: PaymentStatus.REFUNDED,
				refundedAt: expect.any(Date),
			},
			{ new: true },
		);
		expect(cancelBookingByAdmin).toHaveBeenCalledWith(bookingId, 'Payment refunded.');
	});

	it('keeps admin pending payment cancellation callable', async () => {
		const paymentId = new Types.ObjectId();
		const cancelledPayment = {
			_id: paymentId,
			paymentStatus: PaymentStatus.CANCELLED,
		};

		paymentModel.findOneAndUpdate.mockReturnValue(execResult(cancelledPayment));

		const result = await service.cancelPaymentByAdmin(paymentId as any);

		expect(result).toBe(cancelledPayment);
		expect(paymentModel.findOneAndUpdate).toHaveBeenCalledWith(
			{ _id: paymentId, paymentStatus: PaymentStatus.PENDING },
			{ paymentStatus: PaymentStatus.CANCELLED },
			{ new: true },
		);
	});
});
