import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { availableWishlistSorts } from '../../config';
import { Direction } from '../../enums/common.enum';
import { WishlistGroup } from '../../enums/tour.enum';

@InputType()
export class WishlistInput {
	@IsNotEmpty()
	@Field(() => WishlistGroup)
	wishlistGroup: WishlistGroup;

	@IsNotEmpty()
	@Field(() => String)
	wishlistRefId: mongoose.ObjectId;
}

@InputType()
class WISearch {
	@IsOptional()
	@Field(() => WishlistGroup, { nullable: true })
	wishlistGroup?: WishlistGroup;
}

@InputType()
export class WishlistsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableWishlistSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => WISearch)
	search: WISearch;
}
