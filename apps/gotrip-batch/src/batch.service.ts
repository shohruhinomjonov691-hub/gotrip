import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Member } from 'apps/gotrip-api/src/libs/dto/member/member';
import { Tour } from 'apps/gotrip-api/src/libs/dto/tour/tour';
import { MemberStatus, MemberType } from 'apps/gotrip-api/src/libs/enums/member.enum';
import { TourStatus } from 'apps/gotrip-api/src/libs/enums/tour.enum';
import { Model } from 'mongoose';

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Tour') private readonly tourModel: Model<Tour>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
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
	}

	public async batchTopTours(): Promise<void> {
		const tours: Tour[] = await this.tourModel
			.find({
				tourStatus: TourStatus.ACTIVE,
				tourRank: 0,
			})
			.exec();

		const promisedList = tours.map(async (ele: Tour) => {
			const { _id, tourLikes, tourViews } = ele;
			const rank = tourLikes * 2 + tourViews * 1;
			return await this.tourModel.findByIdAndUpdate(_id, { tourRank: rank });
		});
		await Promise.all(promisedList);
	}

	public async batchTopAgents(): Promise<void> {
		const agents: Member[] = await this.memberModel
			.find({
				memberType: MemberType.AGENT,
				memberStatus: MemberStatus.ACTIVE,
				memberRank: 0,
			})
			.exec();

		const promisedList = agents.map(async (ele: Member) => {
			const { _id, memberTours, memberLikes, memberArticles, memberViews } = ele;
			const rank = memberTours * 5 + memberArticles * 3 + memberLikes * 2 + memberViews * 1;
			return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank });
		});
		await Promise.all(promisedList);
	}

	public getHello(): string {
		return 'Welcome to GoTrip BATCH Server!';
	}
}
