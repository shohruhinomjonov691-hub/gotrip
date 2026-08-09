import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Destination, Destinations } from '../../libs/dto/destination/destination';
import {
	AllDestinationsInquiry,
	DestinationInput,
	DestinationsInquiry,
} from '../../libs/dto/destination/destination.input';
import { DestinationUpdate } from '../../libs/dto/destination/destination.update';
import { DestinationStatus } from '../../libs/enums/destination.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { escapeRegex, lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { MemberService } from '../member/member.service';

const tourCountLookup = {
	$lookup: {
		from: 'tours',
		let: { localId: '$_id', localLocationKey: '$locationKey' },
		pipeline: [
			{
				$match: {
					$expr: {
						$and: [
							{ $eq: ['$tourStatus', 'ACTIVE'] },
							{
								$or: [{ $eq: ['$destinationId', '$$localId'] }, { $eq: ['$tourLocation', '$$localLocationKey'] }],
							},
						],
					},
				},
			},
			{ $count: 'total' },
		],
		as: 'tourCountLookup',
	},
};

const tourCountAddFields = {
	$addFields: {
		tourCount: { $ifNull: [{ $arrayElemAt: ['$tourCountLookup.total', 0] }, 0] },
	},
};

/**
 * The admin catalogue's Views/Likes columns were always reading only the
 * destination's own direct counters (destinationViews/destinationLikes),
 * which only increment when someone opens the destination page itself or
 * likes the destination directly. Almost all real interaction happens at
 * the tour level (tourViews/tourLikes on the tours that belong to this
 * destination — same match rule as tourCountLookup above), so a destination
 * with genuinely viewed/liked tours still showed 0/0. This sums those tour
 * stats in and adds them to the destination's own counters so the column
 * shows the real total, matching how the Tours column is already a
 * computed aggregate rather than a stored field.
 */
const tourStatsLookup = {
	$lookup: {
		from: 'tours',
		let: { localId: '$_id', localLocationKey: '$locationKey' },
		pipeline: [
			{
				$match: {
					$expr: {
						$and: [
							{ $eq: ['$tourStatus', 'ACTIVE'] },
							{
								$or: [{ $eq: ['$destinationId', '$$localId'] }, { $eq: ['$tourLocation', '$$localLocationKey'] }],
							},
						],
					},
				},
			},
			{
				$group: {
					_id: null,
					totalViews: { $sum: '$tourViews' },
					totalLikes: { $sum: '$tourLikes' },
				},
			},
		],
		as: 'tourStatsLookup',
	},
};

const tourStatsAddFields = {
	$addFields: {
		destinationViews: {
			$add: ['$destinationViews', { $ifNull: [{ $arrayElemAt: ['$tourStatsLookup.totalViews', 0] }, 0] }],
		},
		destinationLikes: {
			$add: ['$destinationLikes', { $ifNull: [{ $arrayElemAt: ['$tourStatsLookup.totalLikes', 0] }, 0] }],
		},
	},
};

@Injectable()
export class DestinationService {
	constructor(
		@InjectModel('Destination') private readonly destinationModel: Model<Destination>,
		private viewService: ViewService,
		private likeService: LikeService,
		private memberService: MemberService,
	) {}

	public async getDestinations(memberId: ObjectId, input: DestinationsInquiry): Promise<Destinations> {
		const { text, country, locationKey } = input.search;
		const match: T = { destinationStatus: DestinationStatus.ACTIVE };
		if (country) match.destinationCountry = country;
		if (locationKey) match.locationKey = locationKey;
		if (text) match.destinationTitle = { $regex: new RegExp(escapeRegex(text), 'i') };

		const sort: T = { [input?.sort ?? 'destinationRank']: input?.direction ?? Direction.DESC };

		const result = await this.destinationModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							tourCountLookup,
							tourCountAddFields,
							lookupAuthMemberLiked(memberId, '$_id', LikeGroup.DESTINATION),
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

	public async getDestination(memberId: ObjectId, destinationId: ObjectId): Promise<Destination> {
		const search: T = { _id: destinationId, destinationStatus: DestinationStatus.ACTIVE };

		const targetDestination: any = await this.destinationModel.findOne(search).lean().exec();
		if (!targetDestination) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId, viewRefId: destinationId, viewGroup: ViewGroup.DESTINATION };
			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.destinationStatsEditor({ _id: destinationId, targetKey: 'destinationViews', modifier: 1 });
				targetDestination.destinationViews++;
			}

			const likeInput = { memberId, likeRefId: destinationId, likeGroup: LikeGroup.DESTINATION };
			targetDestination.meLiked = await this.likeService.checkLikeExistence(likeInput);
		}

		targetDestination.memberData = await this.memberService.getMember(null, targetDestination.memberId);

		const [countResult] = await this.destinationModel
			.aggregate([
				{ $match: { _id: destinationId } },
				tourCountLookup,
				tourCountAddFields,
				{ $project: { tourCount: 1 } },
			])
			.exec();
		targetDestination.tourCount = countResult?.tourCount ?? 0;

		return targetDestination;
	}

	public async likeTargetDestination(memberId: ObjectId, likeRefId: ObjectId): Promise<Destination> {
		const target: Destination | null = await this.destinationModel
			.findOne({ _id: likeRefId, destinationStatus: DestinationStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = { memberId, likeRefId, likeGroup: LikeGroup.DESTINATION };
		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.destinationStatsEditor({
			_id: likeRefId,
			targetKey: 'destinationLikes',
			modifier,
		});

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	/** ADMIN **/

	public async getAllDestinationsByAdmin(input: AllDestinationsInquiry): Promise<Destinations> {
		const { text, country, locationKey, destinationStatus } = input.search;
		const match: T = {};
		if (destinationStatus) match.destinationStatus = destinationStatus;
		if (country) match.destinationCountry = country;
		if (locationKey) match.locationKey = locationKey;
		if (text) match.destinationTitle = { $regex: new RegExp(escapeRegex(text), 'i') };

		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		/* destinationViews/destinationLikes are sortable (availableDestinationSorts),
		   so the tour-stats totals must be computed BEFORE $sort — sorting first and
		   computing the real total only for the paginated page would sort by the
		   stale raw counter while displaying the recomputed total. */
		const result = await this.destinationModel
			.aggregate([
				{ $match: match },
				tourStatsLookup,
				tourStatsAddFields,
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							tourCountLookup,
							tourCountAddFields,
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

	public async createDestinationByAdmin(input: DestinationInput): Promise<Destination> {
		await this.assertOwnerIsAgent(shapeIntoMongoObjectId(input.memberId));

		try {
			return await this.destinationModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateDestinationByAdmin(input: DestinationUpdate): Promise<Destination> {
		const { destinationStatus } = input;
		if (input.memberId) {
			await this.assertOwnerIsAgent(shapeIntoMongoObjectId(input.memberId));
		}

		const search: T = { _id: input._id, destinationStatus: { $ne: DestinationStatus.DELETED } };
		if (destinationStatus === DestinationStatus.DELETED) input.deletedAt = new Date();

		const result = await this.destinationModel.findOneAndUpdate(search, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	private async assertOwnerIsAgent(memberId: ObjectId): Promise<void> {
		const owner = await this.memberService.getMember(null, memberId);
		if (owner.memberType !== MemberType.AGENT) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}
	}

	// Used by TourService: a Guide may only create/assign a tour inside a destination they own.
	public async assertDestinationOwnership(destinationId: ObjectId, memberId: ObjectId): Promise<void> {
		const destination = await this.destinationModel
			.findOne({ _id: destinationId, destinationStatus: { $ne: DestinationStatus.DELETED } })
			.exec();
		if (!destination) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (String(destination.memberId) !== String(memberId)) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}
	}

	public async removeDestinationByAdmin(destinationId: ObjectId): Promise<Destination> {
		const search: T = { _id: destinationId, destinationStatus: DestinationStatus.DELETED };
		const result = await this.destinationModel.findOneAndDelete(search).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}

	public async destinationStatsEditor(input: StatisticModifier): Promise<Destination> {
		const { _id, targetKey, modifier } = input;
		const result = await this.destinationModel
			.findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result;
	}
}
