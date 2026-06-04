import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Tour } from '../../libs/dto/tour/tour';
import { TourSchedule, TourSchedules } from '../../libs/dto/tour-schedule/tour-schedule';
import { AllTourSchedulesInquiry, TourScheduleInput } from '../../libs/dto/tour-schedule/tour-schedule.input';
import { TourScheduleUpdate } from '../../libs/dto/tour-schedule/tour-schedule.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { TourScheduleStatus, TourStatus } from '../../libs/enums/tour.enum';
import { T } from '../../libs/types/common';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Injectable()
export class TourScheduleService {
	constructor(
		@InjectModel('TourSchedule') private readonly tourScheduleModel: Model<TourSchedule>,
		@InjectModel('Tour') private readonly tourModel: Model<Tour>,
	) {}

	public async createTourSchedule(memberId: ObjectId, input: TourScheduleInput): Promise<TourSchedule> {
		await this.validateTourOwnership(input.tourId, memberId);
		this.validateSchedulePayload(input);

		const reservedSeats = input.reservedSeats ?? 0;
		const scheduleStatus = this.resolveSeatStatus(TourScheduleStatus.ACTIVE, input.availableSeats, reservedSeats);

		try {
			return await this.tourScheduleModel.create({
				...input,
				reservedSeats,
				scheduleStatus,
			});
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getTourSchedules(tourId: ObjectId): Promise<TourSchedules> {
		await this.validatePublicTour(tourId);
		const list = await this.getActiveSchedulesByTour(tourId);
		return {
			list,
			metaCounter: [{ total: list.length }],
		};
	}

	public async getActiveSchedulesByTour(tourId: ObjectId): Promise<TourSchedule[]> {
		return await this.tourScheduleModel
			.find({
				tourId,
				scheduleStatus: TourScheduleStatus.ACTIVE,
			})
			.sort({ startDate: Direction.ASC })
			.lean()
			.exec();
	}

	public async getTourSchedule(scheduleId: ObjectId): Promise<TourSchedule> {
		const result = await this.tourScheduleModel
			.findOne({
				_id: scheduleId,
				scheduleStatus: TourScheduleStatus.ACTIVE,
			})
			.lean()
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		await this.validatePublicTour(result.tourId);

		return result;
	}

	public async updateTourSchedule(memberId: ObjectId, input: TourScheduleUpdate): Promise<TourSchedule> {
		const target = await this.findEditableSchedule(input._id);
		const nextTourId = input.tourId ?? target.tourId;

		await this.validateTourOwnership(target.tourId, memberId);
		if (input.tourId) await this.validateTourOwnership(input.tourId, memberId);

		const update = this.buildScheduleUpdate(target, { ...input, tourId: nextTourId });
		const result = await this.tourScheduleModel
			.findOneAndUpdate(
				{
					_id: input._id,
					scheduleStatus: { $ne: TourScheduleStatus.DELETED },
				},
				update,
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async deleteTourSchedule(memberId: ObjectId, scheduleId: ObjectId): Promise<TourSchedule> {
		const target = await this.findEditableSchedule(scheduleId);
		await this.validateTourOwnership(target.tourId, memberId);

		return await this.softDeleteSchedule(scheduleId);
	}

	/** ADMIN **/

	public async getAllTourSchedulesByAdmin(input: AllTourSchedulesInquiry): Promise<TourSchedules> {
		const match: T = {};
		const sort: T = { [input?.sort ?? 'startDate']: input?.direction ?? Direction.ASC };

		this.shapeAdminMatchQuery(match, input);

		const result = await this.tourScheduleModel
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

	public async createTourScheduleByAdmin(input: TourScheduleInput): Promise<TourSchedule> {
		await this.validateTourOwnership(input.tourId);
		this.validateSchedulePayload(input);

		const reservedSeats = input.reservedSeats ?? 0;
		const scheduleStatus = this.resolveSeatStatus(TourScheduleStatus.ACTIVE, input.availableSeats, reservedSeats);

		try {
			return await this.tourScheduleModel.create({
				...input,
				reservedSeats,
				scheduleStatus,
			});
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateTourScheduleByAdmin(input: TourScheduleUpdate): Promise<TourSchedule> {
		const target = await this.findEditableSchedule(input._id);
		const nextTourId = input.tourId ?? target.tourId;
		if (input.tourId) await this.validateTourOwnership(input.tourId);

		const update = this.buildScheduleUpdate(target, { ...input, tourId: nextTourId });
		const result = await this.tourScheduleModel
			.findOneAndUpdate(
				{
					_id: input._id,
					scheduleStatus: { $ne: TourScheduleStatus.DELETED },
				},
				update,
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async deleteTourScheduleByAdmin(scheduleId: ObjectId): Promise<TourSchedule> {
		await this.findEditableSchedule(scheduleId);
		return await this.softDeleteSchedule(scheduleId);
	}

	public async increaseReservedSeats(scheduleId: ObjectId, seats: number): Promise<TourSchedule> {
		return await this.applyReservedSeatChange(scheduleId, seats);
	}

	public async decreaseReservedSeats(scheduleId: ObjectId, seats: number): Promise<TourSchedule> {
		return await this.applyReservedSeatChange(scheduleId, -seats);
	}

	private async validateTourOwnership(tourId: ObjectId, memberId?: ObjectId): Promise<Tour> {
		const search: T = {
			_id: tourId,
			tourStatus: { $ne: TourStatus.DELETED },
		};
		if (memberId) search.memberId = memberId;

		const tour = await this.tourModel.findOne(search).exec();
		if (!tour) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return tour;
	}

	private async validatePublicTour(tourId: ObjectId): Promise<Tour> {
		const tour = await this.tourModel
			.findOne({
				_id: tourId,
				tourStatus: TourStatus.ACTIVE,
			})
			.exec();
		if (!tour) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return tour;
	}

	private validateSchedulePayload(input: Partial<TourScheduleInput | TourScheduleUpdate>): void {
		if (input.startDate && input.endDate && new Date(input.endDate).getTime() < new Date(input.startDate).getTime()) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}
		if (input.availableSeats !== undefined && input.availableSeats < 1) throw new BadRequestException(Message.BAD_REQUEST);
		if (input.reservedSeats !== undefined && input.reservedSeats < 0) throw new BadRequestException(Message.BAD_REQUEST);
		if (input.price !== undefined && input.price < 0) throw new BadRequestException(Message.BAD_REQUEST);
		if (
			input.availableSeats !== undefined &&
			input.reservedSeats !== undefined &&
			input.reservedSeats > input.availableSeats
		) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}
	}

	private buildScheduleUpdate(target: TourSchedule, input: TourScheduleUpdate): T {
		const update: T = { ...input };
		delete update._id;
		const startDate = input.startDate ?? target.startDate;
		const endDate = input.endDate ?? target.endDate;
		const availableSeats = input.availableSeats ?? target.availableSeats;
		const reservedSeats = input.reservedSeats ?? target.reservedSeats;
		const scheduleStatus = input.scheduleStatus ?? target.scheduleStatus;

		this.validateSchedulePayload({
			...input,
			startDate,
			endDate,
			availableSeats,
			reservedSeats,
		});

		update.scheduleStatus = this.resolveSeatStatus(scheduleStatus, availableSeats, reservedSeats);
		return update;
	}

	private resolveSeatStatus(
		scheduleStatus: TourScheduleStatus,
		availableSeats: number,
		reservedSeats: number,
	): TourScheduleStatus {
		if (reservedSeats > availableSeats) throw new BadRequestException(Message.BAD_REQUEST);
		if (reservedSeats < 0) throw new BadRequestException(Message.BAD_REQUEST);
		if ([TourScheduleStatus.PAUSED, TourScheduleStatus.DELETED].includes(scheduleStatus)) return scheduleStatus;

		return reservedSeats === availableSeats ? TourScheduleStatus.FULL : TourScheduleStatus.ACTIVE;
	}

	private async findEditableSchedule(scheduleId: ObjectId): Promise<TourSchedule> {
		const target = await this.tourScheduleModel
			.findOne({
				_id: scheduleId,
				scheduleStatus: { $ne: TourScheduleStatus.DELETED },
			})
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return target;
	}

	private async softDeleteSchedule(scheduleId: ObjectId): Promise<TourSchedule> {
		const result = await this.tourScheduleModel
			.findOneAndUpdate(
				{
					_id: scheduleId,
					scheduleStatus: { $ne: TourScheduleStatus.DELETED },
				},
				{ scheduleStatus: TourScheduleStatus.DELETED },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	private async applyReservedSeatChange(scheduleId: ObjectId, modifier: number): Promise<TourSchedule> {
		if (!Number.isInteger(modifier) || modifier === 0) throw new BadRequestException(Message.BAD_REQUEST);

		const search: T = {
			_id: scheduleId,
			scheduleStatus:
				modifier > 0
					? TourScheduleStatus.ACTIVE
					: { $in: [TourScheduleStatus.ACTIVE, TourScheduleStatus.FULL, TourScheduleStatus.PAUSED, TourScheduleStatus.DELETED] },
			$expr:
				modifier > 0
					? { $lte: [{ $add: ['$reservedSeats', modifier] }, '$availableSeats'] }
					: { $gte: [{ $add: ['$reservedSeats', modifier] }, 0] },
		};

		const result = await this.tourScheduleModel
			.findOneAndUpdate(search, { $inc: { reservedSeats: modifier } }, { new: true })
			.exec();
		if (!result) throw new BadRequestException(Message.BAD_REQUEST);

		const scheduleStatus = this.resolveSeatStatus(result.scheduleStatus, result.availableSeats, result.reservedSeats);
		if (scheduleStatus !== result.scheduleStatus) {
			const updated = await this.tourScheduleModel
				.findByIdAndUpdate(scheduleId, { scheduleStatus }, { new: true })
				.exec();
			if (!updated) throw new InternalServerErrorException(Message.UPDATE_FAILED);
			return updated;
		}

		return result;
	}

	private shapeAdminMatchQuery(match: T, input: AllTourSchedulesInquiry): void {
		const { tourId, scheduleStatus, startDate, endDate } = input.search;
		if (tourId) match.tourId = shapeIntoMongoObjectId(tourId);
		if (scheduleStatus) match.scheduleStatus = scheduleStatus;
		if (startDate) match.startDate = { $gte: startDate };
		if (endDate) match.endDate = { $lte: endDate };
	}
}
