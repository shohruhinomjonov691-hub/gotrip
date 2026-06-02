import { Field, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { TourCategory, TourDifficulty, TourLanguage, TourLocation, TourStatus } from '../../enums/tour.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class Tour {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => TourCategory)
	tourCategory: TourCategory;

	@Field(() => TourStatus)
	tourStatus: TourStatus;

	@Field(() => TourLocation)
	tourLocation: TourLocation;

	@Field(() => String)
	@Field(() => String)
	tourTitle: string;

	@Field(() => Number)
	tourPrice: number;

	@Field(() => Number)
	tourDuration: number;

	@Field(() => Number)
	tourMaxPeople: number;

	@Field(() => Number)
	tourMinPeople: number;

	@Field(() => Number)
	tourAvailableSeats: number;

	@Field(() => Number)
	tourViews: number;

	@Field(() => Number)
	tourLikes: number;

	@Field(() => Number)
	tourComments: number;

	@Field(() => Number)
	tourRank: number;

	@Field(() => [String])
	tourImages: string[];

	@Field(() => String, { nullable: true })
	tourDesc?: string;

	@Field(() => [String], { nullable: true })
	tourItinerary?: string[];

	@Field(() => [String], { nullable: true })
	tourIncluded?: string[];

	@Field(() => [String], { nullable: true })
	tourExcluded?: string[];

	@Field(() => String, { nullable: true })
	tourMeetingPoint?: string;

	@Field(() => TourLanguage, { nullable: true })
	tourLanguage?: TourLanguage;

	@Field(() => TourDifficulty, { nullable: true })
	tourDifficulty?: TourDifficulty;

	@Field(() => String)
	memberId: mongoose.ObjectId;

	@Field(() => String, { nullable: true })
	destinationId?: mongoose.ObjectId;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class Tours {
	@Field(() => [Tour])
	list: Tour[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
