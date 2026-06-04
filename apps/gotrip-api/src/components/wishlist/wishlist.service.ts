import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Tour } from '../../libs/dto/tour/tour';
import { Destination } from '../../libs/dto/destination/destination';
import { Wishlist, Wishlists } from '../../libs/dto/wishlist/wishlist';
import { WishlistInput, WishlistsInquiry } from '../../libs/dto/wishlist/wishlist.input';
import { DestinationStatus, TourStatus, WishlistGroup } from '../../libs/enums/tour.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class WishlistService {
	constructor(
		@InjectModel('Wishlist') private readonly wishlistModel: Model<Wishlist>,
		@InjectModel('Tour') private readonly tourModel: Model<Tour>,
		@InjectModel('Destination') private readonly destinationModel: Model<Destination>,
	) {}

	public async toggleWishlist(memberId: ObjectId, input: WishlistInput): Promise<Wishlist> {
		await this.validateTarget(input);

		const search: T = {
			wishlistGroup: input.wishlistGroup,
			wishlistRefId: input.wishlistRefId,
			memberId,
		};

		const existing = await this.wishlistModel.findOne(search).exec();
		if (existing) {
			const deleted = await this.wishlistModel.findOneAndDelete(search).exec();
			if (!deleted) throw new InternalServerErrorException(Message.REMOVE_FAILED);
			return deleted;
		}

		try {
			return await this.wishlistModel.create({
				...input,
				memberId,
			});
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getMyWishlist(memberId: ObjectId, input: WishlistsInquiry): Promise<Wishlists> {
		const match: T = { memberId };
		if (input.search.wishlistGroup) match.wishlistGroup = input.search.wishlistGroup;
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.wishlistModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							{
								$lookup: {
									from: 'tours',
									localField: 'wishlistRefId',
									foreignField: '_id',
									as: 'tourData',
								},
							},
							{
								$lookup: {
									from: 'destinations',
									localField: 'wishlistRefId',
									foreignField: '_id',
									as: 'destinationData',
								},
							},
							{ $unwind: { path: '$tourData', preserveNullAndEmptyArrays: true } },
							{ $unwind: { path: '$destinationData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async checkWishlist(memberId: ObjectId, input: WishlistInput): Promise<boolean> {
		const result = await this.wishlistModel
			.findOne({
				wishlistGroup: input.wishlistGroup,
				wishlistRefId: input.wishlistRefId,
				memberId,
			})
			.exec();

		return !!result;
	}

	private async validateTarget(input: WishlistInput): Promise<void> {
		switch (input.wishlistGroup) {
			case WishlistGroup.TOUR: {
				const tour = await this.tourModel
					.findOne({
						_id: input.wishlistRefId,
						tourStatus: { $ne: TourStatus.DELETED },
					})
					.exec();
				if (!tour) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
				return;
			}

			case WishlistGroup.DESTINATION: {
				const destination = await this.destinationModel
					.findOne({
						_id: input.wishlistRefId,
						destinationStatus: { $ne: DestinationStatus.DELETED },
					})
					.exec();
				if (!destination) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
				return;
			}

			default:
				throw new BadRequestException(Message.BAD_REQUEST);
		}
	}
}
