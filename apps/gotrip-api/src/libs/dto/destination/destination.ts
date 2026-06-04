import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { DestinationStatus } from '../../enums/tour.enum';
import { TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class Destination {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => DestinationStatus)
	destinationStatus: DestinationStatus;

	@Field(() => String)
	destinationCountry: string;

	@Field(() => String)
	destinationCity: string;

	@Field(() => String, { nullable: true })
	destinationAddress?: string;

	@Field(() => String)
	destinationTitle: string;

	@Field(() => String, { nullable: true })
	destinationDesc?: string;

	@Field(() => [String])
	destinationImages: string[];

	@Field(() => Int)
	destinationViews: number;

	@Field(() => Int)
	destinationLikes: number;

	@Field(() => Int)
	destinationComments: number;

	@Field(() => Float)
	destinationRating: number;

	@Field(() => Int)
	destinationTours: number;

	@Field(() => Int)
	destinationRank: number;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class Destinations {
	@Field(() => [Destination])
	list: Destination[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
