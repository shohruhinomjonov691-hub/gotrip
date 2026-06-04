import { Field, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { WishlistGroup } from '../../enums/tour.enum';
import { Destination } from '../destination/destination';
import { TotalCounter } from '../member/member';
import { Tour } from '../tour/tour';

@ObjectType()
export class Wishlist {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => WishlistGroup)
	wishlistGroup: WishlistGroup;

	@Field(() => String)
	wishlistRefId: mongoose.ObjectId;

	@Field(() => String)
	memberId: mongoose.ObjectId;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	@Field(() => Tour, { nullable: true })
	tourData?: Tour;

	@Field(() => Destination, { nullable: true })
	destinationData?: Destination;
}

@ObjectType()
export class Wishlists {
	@Field(() => [Wishlist])
	list: Wishlist[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
