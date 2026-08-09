import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Member } from 'apps/gotrip-api/src/libs/dto/member/member';
import { Tour } from 'apps/gotrip-api/src/libs/dto/tour/tour';
import { Destination } from 'apps/gotrip-api/src/libs/dto/destination/destination';
import { MemberStatus, MemberType } from 'apps/gotrip-api/src/libs/enums/member.enum';
import { TourStatus } from 'apps/gotrip-api/src/libs/enums/tour.enum';
import { DestinationStatus } from 'apps/gotrip-api/src/libs/enums/destination.enum';
import { Model } from 'mongoose';

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Tour') private readonly tourModel: Model<Tour>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Destination') private readonly destinationModel: Model<Destination>,
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
				{ destinationRank: 0 },
			)
			.exec();
	}

	public async batchTopTours(): Promise<void> {
		const tours: Tour[] = await this.tourModel
			.find({
				tourStatus: TourStatus.ACTIVE,
			})
			.exec();

		const promisedList = tours.map(async (ele: Tour) => {
			const { _id, tourViews, tourLikes, tourComments } = ele;
			// Simple tour rank: views + likes + comments.
			const rank = (tourViews ?? 0) * 1 + (tourLikes ?? 0) * 2 + (tourComments ?? 0) * 3;
			return await this.tourModel.findByIdAndUpdate(_id, { tourRank: rank });
		});
		await Promise.all(promisedList);
	}

	public async batchTopAgents(): Promise<void> {
		const agents: Member[] = await this.memberModel
			.find({
				memberType: MemberType.AGENT,
				memberStatus: MemberStatus.ACTIVE,
			})
			.exec();

		const promisedList = agents.map(async (ele: Member) => {
			const { _id, memberTours, memberFollowers, memberLikes, memberViews, memberComments } = ele;
			// Simple member rank: engagement + tour count.
			const rank =
				(memberViews ?? 0) * 1 +
				(memberLikes ?? 0) * 2 +
				(memberComments ?? 0) * 3 +
				(memberFollowers ?? 0) * 4 +
				(memberTours ?? 0) * 5;
			return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank });
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
			const { _id, destinationViews, destinationLikes, locationKey } = ele;
			const tourCount = await this.tourModel.countDocuments({
				tourStatus: TourStatus.ACTIVE,
				$or: [{ destinationId: _id }, ...(locationKey ? [{ tourLocation: locationKey }] : [])],
			});
			// Simple destination rank: views + likes + how many tours are listed there.
			const rank = (destinationViews ?? 0) * 1 + (destinationLikes ?? 0) * 2 + tourCount * 3;
			return await this.destinationModel.findByIdAndUpdate(_id, { destinationRank: rank });
		});
		await Promise.all(promisedList);
	}

	public getHello(): string {
		return 'Welcome to GoTrip BATCH Server!';
	}
}
