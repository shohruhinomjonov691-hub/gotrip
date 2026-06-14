import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Destination, Destinations } from '../../libs/dto/destination/destination';
import {
	AllDestinationsInquiry,
	DestinationInput,
	DestinationsInquiry,
} from '../../libs/dto/destination/destination.input';
import { DestinationUpdate } from '../../libs/dto/destination/destination.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { DestinationStatus } from '../../libs/enums/tour.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeService } from '../like/like.service';
import { ViewService } from '../view/view.service';
import { StatisticModifier, T } from '../../libs/types/common';
import { lookupAuthMemberLiked } from '../../libs/config';

@Injectable()
export class DestinationService {
	constructor(
		@InjectModel('Destination') private readonly destinationModel: Model<Destination>,
		private viewService: ViewService,
		private likeService: LikeService,
	) {}

	public async createDestinationByAdmin(input: DestinationInput): Promise<Destination> {
		try {
			return await this.destinationModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getDestination(memberId: ObjectId, destinationId: ObjectId): Promise<Destination> {
		const targetDestination: Destination | null = await this.destinationModel
			.findOne({
				_id: destinationId,
				destinationStatus: DestinationStatus.ACTIVE,
			})
			.lean()
			.exec();
		if (!targetDestination) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const newView = await this.viewService.recordView({
				memberId,
				viewRefId: destinationId,
				viewGroup: ViewGroup.DESTINATION,
			});
			if (newView) {
				await this.destinationStatsEditor({
					_id: destinationId,
					targetKey: 'destinationViews',
					modifier: 1,
				});
				targetDestination.destinationViews++;
			}

			targetDestination.meLiked = await this.likeService.checkLikeExistence({
				memberId,
				likeRefId: destinationId,
				likeGroup: LikeGroup.DESTINATION,
			});
		}

		return targetDestination;
	}

	public async getDestinations(memberId: ObjectId, input: DestinationsInquiry): Promise<Destinations> {
		const match: T = { destinationStatus: DestinationStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapePublicMatchQuery(match, input);

		const result = await this.destinationModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId, '$_id', LikeGroup.DESTINATION),
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async likeTargetDestination(memberId: ObjectId, likeRefId: ObjectId): Promise<Destination> {
		const target: Destination | null = await this.destinationModel
			.findOne({
				_id: likeRefId,
				destinationStatus: DestinationStatus.ACTIVE,
			})
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const modifier = await this.likeService.toggleLike({
			memberId,
			likeRefId,
			likeGroup: LikeGroup.DESTINATION,
		});

		return await this.destinationStatsEditor({
			_id: likeRefId,
			targetKey: 'destinationLikes',
			modifier,
		});
	}

	public async getAllDestinationsByAdmin(input: AllDestinationsInquiry): Promise<Destinations> {
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeAdminMatchQuery(match, input);

		const result = await this.destinationModel
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

	public async updateDestinationByAdmin(input: DestinationUpdate): Promise<Destination> {
		const result: Destination | null = await this.destinationModel
			.findOneAndUpdate(
				{
					_id: input._id,
					destinationStatus: { $ne: DestinationStatus.DELETED },
				},
				input,
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async deleteDestinationByAdmin(destinationId: ObjectId): Promise<Destination> {
		const result: Destination | null = await this.destinationModel
			.findOneAndUpdate(
				{
					_id: destinationId,
					destinationStatus: { $ne: DestinationStatus.DELETED },
				},
				{ destinationStatus: DestinationStatus.DELETED },
				{ new: true },
			)
			.exec();
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

	public async updateDestinationRating(destinationId: ObjectId, destinationRating: number): Promise<Destination> {
		const result = await this.destinationModel
			.findByIdAndUpdate(destinationId, { destinationRating }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result;
	}

	private shapePublicMatchQuery(match: T, input: DestinationsInquiry): void {
		const { country, city, text } = input.search;
		if (country) match.destinationCountry = { $regex: new RegExp(country, 'i') };
		if (city) match.destinationCity = { $regex: new RegExp(city, 'i') };
		if (text) {
			match.$or = [
				{ destinationTitle: { $regex: new RegExp(text, 'i') } },
				{ destinationDesc: { $regex: new RegExp(text, 'i') } },
				{ destinationCountry: { $regex: new RegExp(text, 'i') } },
				{ destinationCity: { $regex: new RegExp(text, 'i') } },
			];
		}
	}

	private shapeAdminMatchQuery(match: T, input: AllDestinationsInquiry): void {
		const { destinationStatus, country, city, text } = input.search;
		if (destinationStatus) match.destinationStatus = destinationStatus;
		if (country) match.destinationCountry = { $regex: new RegExp(country, 'i') };
		if (city) match.destinationCity = { $regex: new RegExp(city, 'i') };
		if (text) {
			match.$or = [
				{ destinationTitle: { $regex: new RegExp(text, 'i') } },
				{ destinationDesc: { $regex: new RegExp(text, 'i') } },
				{ destinationCountry: { $regex: new RegExp(text, 'i') } },
				{ destinationCity: { $regex: new RegExp(text, 'i') } },
			];
		}
	}
}
