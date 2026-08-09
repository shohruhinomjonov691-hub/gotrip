import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { T } from '../../libs/types/common';
import { OrdinaryInquiry } from '../../libs/dto/tour/tour.input';
import { Tours } from '../../libs/dto/tour/tour';
import { ViewGroup } from '../../libs/enums/view.enum';
import { TourStatus } from '../../libs/enums/tour.enum';
import { lookupVisit } from '../../libs/config';

@Injectable()
export class ViewService {
	constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

	public async recordView(input: ViewInput): Promise<View | null> {
		const viewExist = await this.checkViewExixtence(input);
		if (!viewExist) {
			return await this.viewModel.create(input);
		} else return null;
	}

	private async checkViewExixtence(input: ViewInput): Promise<View | null> {
		const { memberId, viewGroup, viewRefId } = input;
		const search: T = { viewGroup: viewGroup, viewRefId: viewRefId, memberId: memberId };
		return await this.viewModel.findOne(search).exec();
	}

	public async getVisitedTours(memberId: ObjectId, input: OrdinaryInquiry): Promise<Tours> {
		const { page, limit } = input;
		const match: T = { viewGroup: ViewGroup.TOUR, memberId: memberId };

		const data: T = await this.viewModel
			.aggregate([
				{ $match: match },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'tours',
						localField: 'viewRefId',
						foreignField: '_id',
						as: 'visitedTour',
					},
				},
				{ $unwind: '$visitedTour' },
				{ $match: { 'visitedTour.tourStatus': { $ne: TourStatus.DELETED } } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupVisit,
							{ $unwind: '$visitedTour.memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		const result: Tours = { list: [], metaCounter: data[0].metaCounter };
		result.list = data[0].list.map((ele) => ele.visitedTour);

		return result;
	}
}
