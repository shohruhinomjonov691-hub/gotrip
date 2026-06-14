import { Types } from 'mongoose';
import { BatchService } from './batch.service';
import { BookingStatus, TourScheduleStatus } from 'apps/gotrip-api/src/libs/enums/tour.enum';

describe('BatchService.batchExpirePendingBookings', () => {
	const execResult = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

	let bookingModel: {
		find: jest.Mock;
		findOneAndUpdate: jest.Mock;
	};
	let tourScheduleModel: {
		findOneAndUpdate: jest.Mock;
		findByIdAndUpdate: jest.Mock;
	};
	let service: BatchService;

	beforeEach(() => {
		bookingModel = {
			find: jest.fn(),
			findOneAndUpdate: jest.fn(),
		};
		tourScheduleModel = {
			findOneAndUpdate: jest.fn(),
			findByIdAndUpdate: jest.fn(),
		};

		service = new BatchService(
			{} as any,
			{} as any,
			bookingModel as any,
			{} as any,
			{} as any,
			tourScheduleModel as any,
		);
	});

	it('cancels expired pending bookings and releases reserved seats', async () => {
		const bookingId = new Types.ObjectId();
		const scheduleId = new Types.ObjectId();
		const expiredBooking = {
			_id: bookingId,
			bookingStatus: BookingStatus.PENDING,
			scheduleId,
			peopleCount: 2,
		};
		const releasedSchedule = {
			_id: scheduleId,
			scheduleStatus: TourScheduleStatus.FULL,
			availableSeats: 10,
			reservedSeats: 8,
		};

		bookingModel.find.mockReturnValue(execResult([expiredBooking]));
		bookingModel.findOneAndUpdate.mockReturnValue(execResult(expiredBooking));
		tourScheduleModel.findOneAndUpdate.mockReturnValue(execResult(releasedSchedule));
		tourScheduleModel.findByIdAndUpdate.mockReturnValue(execResult({ ...releasedSchedule, scheduleStatus: TourScheduleStatus.ACTIVE }));

		const result = await service.batchExpirePendingBookings();

		expect(result).toBe(1);
		expect(bookingModel.find).toHaveBeenCalledWith({
			bookingStatus: BookingStatus.PENDING,
			expiresAt: { $lt: expect.any(Date) },
		});
		expect(bookingModel.findOneAndUpdate).toHaveBeenCalledWith(
			{
				_id: bookingId,
				bookingStatus: BookingStatus.PENDING,
				expiresAt: { $lt: expect.any(Date) },
			},
			{
				bookingStatus: BookingStatus.CANCELLED,
				cancelReason: 'Booking expired before payment.',
				cancelledAt: expect.any(Date),
			},
			{ new: true },
		);
		expect(tourScheduleModel.findOneAndUpdate).toHaveBeenCalledWith(
			{
				_id: scheduleId,
				scheduleStatus: {
					$in: [
						TourScheduleStatus.ACTIVE,
						TourScheduleStatus.FULL,
						TourScheduleStatus.PAUSED,
						TourScheduleStatus.DELETED,
					],
				},
				$expr: { $gte: [{ $subtract: ['$reservedSeats', 2] }, 0] },
			},
			{ $inc: { reservedSeats: -2 } },
			{ new: true },
		);
		expect(tourScheduleModel.findByIdAndUpdate).toHaveBeenCalledWith(
			scheduleId,
			{ scheduleStatus: TourScheduleStatus.ACTIVE },
			{ new: true },
		);
	});

	it('does not release seats when another worker already cancelled the booking', async () => {
		const expiredBooking = {
			_id: new Types.ObjectId(),
			bookingStatus: BookingStatus.PENDING,
			scheduleId: new Types.ObjectId(),
			peopleCount: 1,
		};

		bookingModel.find.mockReturnValue(execResult([expiredBooking]));
		bookingModel.findOneAndUpdate.mockReturnValue(execResult(null));

		const result = await service.batchExpirePendingBookings();

		expect(result).toBe(0);
		expect(tourScheduleModel.findOneAndUpdate).not.toHaveBeenCalled();
	});
});
