import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Tours, Tour } from '../../libs/dto/tour/tour';
import {
	AgentToursInquiry,
	AllToursInquiry,
	OrdinaryInquiry,
	ToursInquiry,
	TourInput,
} from '../../libs/dto/tour/tour.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';
import { StatisticModifier, T } from '../../libs/types/common';
import { TourStatus } from '../../libs/enums/tour.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import { TourUpdate } from '../../libs/dto/tour/tour.update';
import { lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { TourScheduleService } from '../tour-schedule/tour-schedule.service';
import { MemberType } from '../../libs/enums/member.enum';

@Injectable()
export class TourService {
	constructor(
		@InjectModel('Tour') private readonly tourModel: Model<Tour>,
		private memberService: MemberService,
		private viewService: ViewService,
		private likeService: LikeService,
		private tourScheduleService: TourScheduleService,
	) {}

	public async createTour(memberId: ObjectId, input: TourInput): Promise<Tour> {
		const authMember = await this.memberService.getMember(null, memberId);
		if (authMember.memberType !== MemberType.AGENT) {
			throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);
		}

		input.memberId = memberId;

		try {
			const result = await this.tourModel.create(input);
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberTours',
				modifier: 1,
			});
			return result;
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getTour(memberId: ObjectId, tourId: ObjectId): Promise<Tour> {
		const search: T = {
			_id: tourId,
			tourStatus: TourStatus.ACTIVE,
		};

		const targetTour: Tour | null = await this.tourModel.findOne(search).lean().exec();
		if (!targetTour) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: tourId, viewGroup: ViewGroup.TOUR };
			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.tourStatsEditor({ _id: tourId, targetKey: 'tourViews', modifier: 1 });
				targetTour.tourViews++;
			}

			// meLiked
			const likeInput = { memberId: memberId, likeRefId: tourId, likeGroup: LikeGroup.TOUR };
			targetTour.meLiked = await this.likeService.checkLikeExistence(likeInput);
		}

		targetTour.memberData = await this.memberService.getMember(null, targetTour.memberId);
		targetTour.schedules = await this.tourScheduleService.getActiveSchedulesByTour(tourId);
		return targetTour;
	}

	public async updateTour(memberId: ObjectId, input: TourUpdate): Promise<Tour> {
		const { tourStatus } = input;
		const search: T = {
			_id: input._id,
			memberId: memberId,
			tourStatus: TourStatus.ACTIVE,
		};

		if (tourStatus === TourStatus.DELETED) input.deletedAt = new Date();

		const result = await this.tourModel
			.findOneAndUpdate(search, input, {
				new: true,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (tourStatus === TourStatus.SOLD_OUT || tourStatus === TourStatus.DELETED) {
			await this.memberService.memberStatsEditor({
				_id: memberId,
				targetKey: 'memberTours',
				modifier: -1,
			});
		}

		return result;
	}

	public async getTours(memberId: ObjectId, input: ToursInquiry): Promise<Tours> {
		const match: T = { tourStatus: TourStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);
		console.log('match', match);

		const result = await this.tourModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId, '$_id', LikeGroup.TOUR),
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	private shapeMatchQuery(match: T, input: ToursInquiry): void {
		const { memberId, destinationId, locationList, categoryList, periodsRange, pricesRange, durationRange, text } =
			input.search;
		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
		if (destinationId) match.destinationId = shapeIntoMongoObjectId(destinationId);
		if (locationList && locationList.length) match.tourLocation = { $in: locationList };
		if (categoryList && categoryList.length) match.tourCategory = { $in: categoryList };

		if (pricesRange) match.tourPrice = { $gte: pricesRange.start, $lte: pricesRange.end };
		if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };
		if (durationRange) match.tourDuration = { $gte: durationRange.start, $lte: durationRange.end };

		if (text) match.tourTitle = { $regex: new RegExp(text, 'i') };
	}

	public async getFavorites(memberId: ObjectId, input: OrdinaryInquiry): Promise<Tours> {
		return await this.likeService.getFavoriteTours(memberId, input);
	}

	public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Tours> {
		return await this.viewService.getVisitedTours(memberId, input);
	}

	public async getAgentTours(memberId: ObjectId, input: AgentToursInquiry): Promise<Tours> {
		const { tourStatus } = input.search;
		if (tourStatus === TourStatus.DELETED) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const match: T = {
			memberId: memberId,
			tourStatus: tourStatus ?? { $ne: TourStatus.DELETED },
		};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.tourModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async likeTargetTour(memberId: ObjectId, likeRefId: ObjectId): Promise<Tour> {
		const target: Tour | null = await this.tourModel.findOne({ _id: likeRefId, tourStatus: TourStatus.ACTIVE }).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.TOUR,
		};

		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.tourStatsEditor({ _id: likeRefId, targetKey: 'tourLikes', modifier: modifier });

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	/** ADMIN **/

	public async getAllToursByAdmin(input: AllToursInquiry): Promise<Tours> {
		const { tourStatus, tourLocationList, tourCategoryList } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (tourStatus) match.tourStatus = tourStatus;
		if (tourLocationList) match.tourLocation = { $in: tourLocationList };
		if (tourCategoryList) match.tourCategory = { $in: tourCategoryList };

		const result = await this.tourModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit }, // [tour1, tour2]
							lookupMember, // memberData: [memberDataValue]
							{ $unwind: '$memberData' }, // memberData: memberDataValue
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updateTourByAdmin(input: TourUpdate): Promise<Tour> {
		const { tourStatus } = input;
		const search: T = {
			_id: input._id,
			tourStatus: TourStatus.ACTIVE,
		};

		if (tourStatus === TourStatus.DELETED) input.deletedAt = new Date();

		const result = await this.tourModel
			.findOneAndUpdate(search, input, {
				new: true,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (tourStatus === TourStatus.SOLD_OUT || tourStatus === TourStatus.DELETED) {
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberTours',
				modifier: -1,
			});
		}

		return result;
	}

	public async removeTourByAdmin(tourId: ObjectId): Promise<Tour> {
		const search: T = { _id: tourId, tourStatus: TourStatus.DELETED };
		const result = await this.tourModel.findOneAndDelete(search).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async tourStatsEditor(input: StatisticModifier): Promise<Tour> {
		const { _id, targetKey, modifier } = input;
		const result = await this.tourModel
			.findByIdAndUpdate(
				_id,
				{ $inc: { [targetKey]: modifier } },
				{
					new: true,
				},
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result;
	}
}
