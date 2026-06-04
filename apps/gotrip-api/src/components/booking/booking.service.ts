import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Booking, Bookings } from '../../libs/dto/booking/booking';
import { AllBookingsInquiry, BookingInput, BookingsInquiry } from '../../libs/dto/booking/booking.input';
import { BookingUpdate } from '../../libs/dto/booking/booking.update';
import { Tour } from '../../libs/dto/tour/tour';
import { Direction, Message } from '../../libs/enums/common.enum';
import { BookingStatus, TourScheduleStatus, TourStatus } from '../../libs/enums/tour.enum';
import { T } from '../../libs/types/common';
import { TourScheduleService } from '../tour-schedule/tour-schedule.service';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BookingService {
	constructor(
		@InjectModel('Booking') private readonly bookingModel: Model<Booking>,
		@InjectModel('Tour') private readonly tourModel: Model<Tour>,
		private tourScheduleService: TourScheduleService,
		private notificationService: NotificationService,
	) {}

	public async createBooking(memberId: ObjectId, input: BookingInput): Promise<Booking> {
		if (input.peopleCount < 1) throw new BadRequestException(Message.BAD_REQUEST);

		const tour = await this.tourModel
			.findOne({
				_id: input.tourId,
				tourStatus: { $ne: TourStatus.DELETED },
			})
			.exec();
		if (!tour) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (String(tour.memberId) === String(memberId)) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const schedule = await this.tourScheduleService.getTourSchedule(input.scheduleId);
		if (String(schedule.tourId) !== String(input.tourId)) throw new BadRequestException(Message.BAD_REQUEST);
		if (schedule.scheduleStatus !== TourScheduleStatus.ACTIVE) throw new BadRequestException(Message.BAD_REQUEST);
		if (schedule.availableSeats - schedule.reservedSeats < input.peopleCount) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const unitPrice = schedule.price || tour.tourPrice;
		const now = new Date();
		const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);

		await this.tourScheduleService.increaseReservedSeats(input.scheduleId, input.peopleCount);

		let result: Booking;
		try {
			result = await this.bookingModel.create({
				...input,
				bookingStatus: BookingStatus.PENDING,
				bookingNumber: this.generateBookingNumber(),
				memberId,
				agentId: tour.memberId,
				totalPrice: unitPrice * input.peopleCount,
				bookingDate: now,
				expiresAt,
			});
		} catch (err) {
			await this.releaseSeatsSafely(input.scheduleId, input.peopleCount);
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		await this.notificationService.notifyBookingCreated(result._id);
		return result;
	}

	public async cancelBooking(memberId: ObjectId, bookingId: ObjectId, cancelReason: string): Promise<Booking> {
		const booking = await this.bookingModel.findOne({ _id: bookingId, memberId }).exec();
		if (!booking) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return await this.cancelBookingRecord(booking, cancelReason);
	}

	public async getMyBookings(memberId: ObjectId, input: BookingsInquiry): Promise<Bookings> {
		const match: T = { memberId };
		return await this.getBookingsByMatch(match, input);
	}

	public async getMyBooking(memberId: ObjectId, bookingId: ObjectId): Promise<Booking> {
		const booking = await this.bookingModel.findOne({ _id: bookingId, memberId }).exec();
		if (!booking) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return booking;
	}

	public async getAgentBookings(agentId: ObjectId, input: BookingsInquiry): Promise<Bookings> {
		const match: T = { agentId };
		return await this.getBookingsByMatch(match, input);
	}

	public async getAgentBooking(agentId: ObjectId, bookingId: ObjectId): Promise<Booking> {
		const booking = await this.bookingModel.findOne({ _id: bookingId, agentId }).exec();
		if (!booking) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return booking;
	}

	public async updateAgentBookingStatus(
		agentId: ObjectId,
		bookingId: ObjectId,
		bookingStatus: BookingStatus,
	): Promise<Booking> {
		const booking = await this.bookingModel.findOne({ _id: bookingId, agentId }).exec();
		if (!booking) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (booking.bookingStatus === BookingStatus.PENDING && bookingStatus === BookingStatus.CANCELLED) {
			return await this.cancelBookingRecord(booking, 'Cancelled by agent.');
		}
		if (booking.bookingStatus === BookingStatus.CONFIRMED && bookingStatus === BookingStatus.COMPLETED) {
			return await this.updateBookingStatus(booking._id, BookingStatus.COMPLETED);
		}

		throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
	}

	/** ADMIN **/

	public async getAllBookingsByAdmin(input: AllBookingsInquiry): Promise<Bookings> {
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		this.shapeBookingMatchQuery(match, input.search);

		const result = await this.bookingModel
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

	public async getBookingByAdmin(bookingId: ObjectId): Promise<Booking> {
		const booking = await this.bookingModel.findById(bookingId).exec();
		if (!booking) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return booking;
	}

	public async updateBookingByAdmin(input: BookingUpdate): Promise<Booking> {
		const booking = await this.bookingModel.findById(input._id).exec();
		if (!booking) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (input.bookingStatus && input.bookingStatus !== booking.bookingStatus) {
			if (booking.bookingStatus === BookingStatus.PENDING && input.bookingStatus === BookingStatus.CANCELLED) {
				return await this.cancelBookingRecord(booking, input.cancelReason ?? 'Cancelled by admin.');
			}
			if (booking.bookingStatus === BookingStatus.CONFIRMED && input.bookingStatus === BookingStatus.CANCELLED) {
				return await this.cancelBookingRecord(booking, input.cancelReason ?? 'Cancelled by admin.');
			}
			if (booking.bookingStatus === BookingStatus.PENDING && input.bookingStatus === BookingStatus.CONFIRMED) {
				return await this.updateBookingByAdminFields(input, BookingStatus.CONFIRMED);
			}
			if (booking.bookingStatus === BookingStatus.CONFIRMED && input.bookingStatus === BookingStatus.COMPLETED) {
				return await this.updateBookingByAdminFields(input, BookingStatus.COMPLETED);
			}

			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		return await this.updateBookingByAdminFields(input);
	}

	public async cancelBookingByAdmin(bookingId: ObjectId, cancelReason: string): Promise<Booking> {
		const booking = await this.bookingModel.findById(bookingId).exec();
		if (!booking) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return await this.cancelBookingRecord(booking, cancelReason);
	}

	public async expirePendingBookings(): Promise<Booking[]> {
		const expiredBookings = await this.bookingModel
			.find({
				bookingStatus: BookingStatus.PENDING,
				expiresAt: { $lt: new Date() },
			})
			.exec();

		const results: Booking[] = [];
		for (const booking of expiredBookings) {
			results.push(await this.cancelBookingRecord(booking, 'Booking expired before payment.'));
		}

		return results;
	}

	public async markBookingConfirmed(bookingId: ObjectId): Promise<Booking> {
		const booking = await this.bookingModel
			.findOneAndUpdate(
				{
					_id: bookingId,
					bookingStatus: BookingStatus.PENDING,
				},
				{ bookingStatus: BookingStatus.CONFIRMED },
				{ new: true },
			)
			.exec();
		if (!booking) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return booking;
	}

	public async markBookingPaymentFailed(bookingId: ObjectId): Promise<Booking> {
		const booking = await this.bookingModel
			.findOne({
				_id: bookingId,
				bookingStatus: BookingStatus.PENDING,
			})
			.exec();
		if (!booking) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return await this.cancelBookingRecord(booking, 'Payment failed.');
	}

	private async getBookingsByMatch(match: T, input: BookingsInquiry): Promise<Bookings> {
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		this.shapeBookingMatchQuery(match, input.search);

		const result = await this.bookingModel
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

	private shapeBookingMatchQuery(match: T, search: T): void {
		if (search.bookingStatus) match.bookingStatus = search.bookingStatus;
		if (search.tourId) match.tourId = shapeIntoMongoObjectId(search.tourId);
		if (search.scheduleId) match.scheduleId = shapeIntoMongoObjectId(search.scheduleId);
		if (search.memberId) match.memberId = shapeIntoMongoObjectId(search.memberId);
		if (search.agentId) match.agentId = shapeIntoMongoObjectId(search.agentId);
		if (search.bookingNumber) match.bookingNumber = { $regex: new RegExp(search.bookingNumber, 'i') };
		if (search.startDate || search.endDate) {
			match.bookingDate = {};
			if (search.startDate) match.bookingDate.$gte = search.startDate;
			if (search.endDate) match.bookingDate.$lte = search.endDate;
		}
	}

	private async cancelBookingRecord(booking: Booking, cancelReason: string): Promise<Booking> {
		if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.bookingStatus)) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		const result = await this.bookingModel
			.findOneAndUpdate(
				{
					_id: booking._id,
					bookingStatus: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
				},
				{
					bookingStatus: BookingStatus.CANCELLED,
					cancelReason,
					cancelledAt: new Date(),
				},
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		await this.tourScheduleService.decreaseReservedSeats(booking.scheduleId, booking.peopleCount);

		return result;
	}

	private async updateBookingStatus(bookingId: ObjectId, bookingStatus: BookingStatus): Promise<Booking> {
		const result = await this.bookingModel.findByIdAndUpdate(bookingId, { bookingStatus }, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	private async updateBookingByAdminFields(input: BookingUpdate, bookingStatus?: BookingStatus): Promise<Booking> {
		const update: T = { ...input };
		delete update._id;
		if (bookingStatus) update.bookingStatus = bookingStatus;

		const result = await this.bookingModel.findByIdAndUpdate(input._id, update, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	private async releaseSeatsSafely(scheduleId: ObjectId, peopleCount: number): Promise<void> {
		try {
			await this.tourScheduleService.decreaseReservedSeats(scheduleId, peopleCount);
		} catch (err) {
			console.log('Warning, failed to release seats after booking failure:', err);
		}
	}

	private generateBookingNumber(): string {
		const now = new Date();
		const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(
			2,
			'0',
		)}`;
		const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
		return `GTB-${date}-${suffix}`;
	}
}
