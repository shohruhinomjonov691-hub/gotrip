import { Types } from 'mongoose';
import { PaymentService } from './payment.service';
import { PaymentStatus } from '../../libs/enums/tour.enum';

describe('PaymentService.markPaymentFailedByAdmin', () => {
	const execResult = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

	let paymentModel: { findOneAndUpdate: jest.Mock };
	let bookingService: { markBookingPaymentFailed: jest.Mock };
	let notificationService: { notifyPaymentFailed: jest.Mock };
	let service: PaymentService;

	beforeEach(() => {
		paymentModel = { findOneAndUpdate: jest.fn() };
		bookingService = { markBookingPaymentFailed: jest.fn() };
		notificationService = { notifyPaymentFailed: jest.fn() };
		service = new PaymentService(paymentModel as any, {} as any, bookingService as any, notificationService as any);
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
});
