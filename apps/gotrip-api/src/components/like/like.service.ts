import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Like, MeLiked } from '../../libs/dto/like/like';
import { LikeInput } from '../../libs/dto/like/like.input';
import { T } from '../../libs/types/common';
import { Message } from '../../libs/enums/common.enum';
import { OrdinaryInquiry } from '../../libs/dto/tour/tour.input';
import { Tours } from '../../libs/dto/tour/tour';
import { LikeGroup } from '../../libs/enums/like.enum';
import { lookupFavorite } from '../../libs/config';

@Injectable()
export class LikeService {
	constructor(@InjectModel('Like') private readonly likeModel: Model<Like>) {}

	public async toggleLike(input: LikeInput): Promise<number> {
		const search: T = { likeGroup: input.likeGroup, likeRefId: input.likeRefId, memberId: input.memberId },
			exist = await this.likeModel.findOne(search).exec();
		let modifier = 1;

		if (exist) {
			await this.likeModel.findOneAndDelete(search).exec();
			modifier = -1;
		} else {
			try {
				await this.likeModel.create(input);
			} catch (err) {
				console.log('Error, Service.model:', err);
				throw new BadRequestException(Message.CREATE_FAILED);
			}
		}
		console.log(`- Like modifier ${modifier} -`);
		return modifier;
	}

	public async checkLikeExistence(input: LikeInput): Promise<MeLiked[]> {
		const { likeGroup, memberId, likeRefId } = input;
		const result = await this.likeModel
			.findOne({ likeGroup: likeGroup, likeRefId: likeRefId, memberId: memberId })
			.exec();
		return result ? [{ memberId: memberId, likeRefId: likeRefId, myFavorite: true }] : [];
	}

	public async getFavoriteTours(memberId: ObjectId, input: OrdinaryInquiry): Promise<Tours> {
		const { page, limit } = input;
		const match: T = { likeGroup: LikeGroup.TOUR, memberId: memberId };

		const data: T = await this.likeModel
			.aggregate([
				{ $match: match },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'tours',
						localField: 'likeRefId',
						foreignField: '_id',
						as: 'favoriteTour',
					},
				},
				{ $unwind: '$favoriteTour' },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupFavorite,
							{ $unwind: '$favoriteTour.memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		const result: Tours = { list: [], metaCounter: data[0].metaCounter };
		result.list = data[0].list.map((ele) => ele.favoriteTour);

		return result;
	}
}
