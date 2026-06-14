import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Booking } from 'apps/gotrip-api/src/libs/dto/booking/booking';
import { Destination } from 'apps/gotrip-api/src/libs/dto/destination/destination';
import { Member } from 'apps/gotrip-api/src/libs/dto/member/member';
import { Tour } from 'apps/gotrip-api/src/libs/dto/tour/tour';
import { TourSchedule } from 'apps/gotrip-api/src/libs/dto/tour-schedule/tour-schedule';
import { Wishlist } from 'apps/gotrip-api/src/libs/dto/wishlist/wishlist';
import { MemberStatus, MemberType } from 'apps/gotrip-api/src/libs/enums/member.enum';
import {
	BookingStatus,
	DestinationStatus,
	TourScheduleStatus,
	TourStatus,
	WishlistGroup,
} from 'apps/gotrip-api/src/libs/enums/tour.enum';
import { Model } from 'mongoose';

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Tour') private readonly tourModel: Model<Tour>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Booking') private readonly bookingModel: Model<Booking>,
		@InjectModel('Wishlist') private readonly wishlistModel: Model<Wishlist>,
		@InjectModel('Destination') private readonly destinationModel: Model<Destination>,
		@InjectModel('TourSchedule') private readonly tourScheduleModel: Model<TourSchedule>,
	) {}

	public async batchRollback(): Promise<void> {
		await this.tourModel
			.updateMany(
				{
					tourStatus: TourStatus.ACTIVE,
				},
				{ tourRank: 0 },
			)
			.exec();

		await this.memberModel
			.updateMany(
				{
					memberStatus: MemberStatus.ACTIVE,
					memberType: MemberType.AGENT,
				},
				{ memberRank: 0 },
			)
			.exec();

		await this.destinationModel
			.updateMany(
				{
					destinationStatus: DestinationStatus.ACTIVE,
				},
				{ destinationRank: 0, destinationTours: 0 },
			)
			.exec();
	}

	public async batchTopTours(): Promise<void> {
		const successfulBookingsMap = await this.getSuccessfulBookingsByTourMap();
		const wishlistMap = await this.getTourWishlistMap();
		const tours: Tour[] = await this.tourModel
			.find({
				tourStatus: TourStatus.ACTIVE,
			})
			.exec();

		const promisedList = tours.map(async (ele: Tour) => {
			const { _id, tourViews, tourLikes, tourComments } = ele;
			const successfulBookings = successfulBookingsMap.get(String(_id)) ?? 0;
			const wishlistCount = wishlistMap.get(String(_id)) ?? 0;
			// Simple tour rank: views + likes + comments + successful bookings + wishlists.
			const rank =
				(tourViews ?? 0) * 1 +
				(tourLikes ?? 0) * 2 +
				(tourComments ?? 0) * 3 +
				successfulBookings * 5 +
				wishlistCount * 4;
			return await this.tourModel.findByIdAndUpdate(_id, { tourRank: rank });
		});
		await Promise.all(promisedList);
	}

	public async batchTopAgents(): Promise<void> {
		const successfulBookingsMap = await this.getSuccessfulBookingsByAgentMap();
		const agents: Member[] = await this.memberModel
			.find({
				memberType: MemberType.AGENT,
				memberStatus: MemberStatus.ACTIVE,
			})
			.exec();

		const promisedList = agents.map(async (ele: Member) => {
			const { _id, memberTours, memberFollowers, memberLikes, memberViews, memberComments } = ele;
			const successfulAgentBookings = successfulBookingsMap.get(String(_id)) ?? 0;
			// Simple member rank: engagement + tour count + successful agent bookings.
			const rank =
				(memberViews ?? 0) * 1 +
				(memberLikes ?? 0) * 2 +
				(memberComments ?? 0) * 3 +
				(memberFollowers ?? 0) * 4 +
				(memberTours ?? 0) * 5 +
				successfulAgentBookings * 5;
			return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank });
		});
		await Promise.all(promisedList);
	}

	public async batchDestinationTourCounts(): Promise<void> {
		const destinationTourMap = await this.getActiveToursByDestinationMap();
		const destinations: Destination[] = await this.destinationModel
			.find({
				destinationStatus: DestinationStatus.ACTIVE,
			})
			.exec();

		const promisedList = destinations.map(async (ele: Destination) => {
			const destinationTours = destinationTourMap.get(String(ele._id)) ?? 0;
			return await this.destinationModel.findByIdAndUpdate(ele._id, { destinationTours });
		});
		await Promise.all(promisedList);
	}

	public async batchTopDestinations(): Promise<void> {
		const destinations: Destination[] = await this.destinationModel
			.find({
				destinationStatus: DestinationStatus.ACTIVE,
			})
			.exec();

		const promisedList = destinations.map(async (ele: Destination) => {
			const {
				_id,
				destinationViews,
				destinationLikes,
				destinationComments,
				destinationRating,
				destinationTours,
			} = ele;
			// Simple destination rank: engagement + rating + active tour count.
			const rank =
				(destinationViews ?? 0) * 1 +
				(destinationLikes ?? 0) * 2 +
				(destinationComments ?? 0) * 3 +
				Math.round((destinationRating ?? 0) * 10) +
				(destinationTours ?? 0) * 5;
			return await this.destinationModel.findByIdAndUpdate(_id, { destinationRank: rank });
		});
		await Promise.all(promisedList);
	}

	public async batchExpirePendingBookings(): Promise<number> {
		const expiredBookings = await this.bookingModel
			.find({
				bookingStatus: BookingStatus.PENDING,
				expiresAt: { $lt: new Date() },
			})
			.exec();

		let expiredCount = 0;
		for (const booking of expiredBookings) {
			const cancelled = await this.bookingModel
				.findOneAndUpdate(
					{
						_id: booking._id,
						bookingStatus: BookingStatus.PENDING,
						expiresAt: { $lt: new Date() },
					},
					{
						bookingStatus: BookingStatus.CANCELLED,
						cancelReason: 'Booking expired before payment.',
						cancelledAt: new Date(),
					},
					{ new: true },
				)
				.exec();
			if (!cancelled) continue;

			await this.releaseReservedScheduleSeats(cancelled.scheduleId, cancelled.peopleCount);
			expiredCount++;
		}

		return expiredCount;
	}

	public getHello(): string {
		return 'Welcome to GoTrip BATCH Server!';
	}

	private async getSuccessfulBookingsByTourMap(): Promise<Map<string, number>> {
		const result = await this.bookingModel
			.aggregate([
				{ $match: { bookingStatus: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } } },
				{ $group: { _id: '$tourId', total: { $sum: 1 } } },
			])
			.exec();

		return this.shapeCountMap(result);
	}

	private async getSuccessfulBookingsByAgentMap(): Promise<Map<string, number>> {
		const result = await this.bookingModel
			.aggregate([
				{ $match: { bookingStatus: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } } },
				{ $group: { _id: '$agentId', total: { $sum: 1 } } },
			])
			.exec();

		return this.shapeCountMap(result);
	}

	private async getTourWishlistMap(): Promise<Map<string, number>> {
		const result = await this.wishlistModel
			.aggregate([
				{ $match: { wishlistGroup: WishlistGroup.TOUR } },
				{ $group: { _id: '$wishlistRefId', total: { $sum: 1 } } },
			])
			.exec();

		return this.shapeCountMap(result);
	}

	private async getActiveToursByDestinationMap(): Promise<Map<string, number>> {
		const result = await this.tourModel
			.aggregate([
				{
					$match: {
						tourStatus: TourStatus.ACTIVE,
						destinationId: { $exists: true, $ne: null },
					},
				},
				{ $group: { _id: '$destinationId', total: { $sum: 1 } } },
			])
			.exec();

		return this.shapeCountMap(result);
	}

	private async releaseReservedScheduleSeats(scheduleId: unknown, seats: number): Promise<void> {
		if (!Number.isInteger(seats) || seats < 1) return;

		const schedule = await this.tourScheduleModel
			.findOneAndUpdate(
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
					$expr: { $gte: [{ $subtract: ['$reservedSeats', seats] }, 0] },
				},
				{ $inc: { reservedSeats: -seats } },
				{ new: true },
			)
			.exec();
		if (!schedule) return;

		if (schedule.scheduleStatus === TourScheduleStatus.FULL && schedule.reservedSeats < schedule.availableSeats) {
			await this.tourScheduleModel
				.findByIdAndUpdate(schedule._id, { scheduleStatus: TourScheduleStatus.ACTIVE }, { new: true })
				.exec();
		}
	}

	private shapeCountMap(result: { _id: unknown; total: number }[]): Map<string, number> {
		return new Map(result.map((ele) => [String(ele._id), ele.total]));
	}
}
