import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { WishlistService } from './wishlist.service';
import { Wishlist, Wishlists } from '../../libs/dto/wishlist/wishlist';
import { WishlistInput, WishlistsInquiry } from '../../libs/dto/wishlist/wishlist.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class WishlistResolver {
	constructor(private readonly wishlistService: WishlistService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Wishlist)
	public async toggleWishlist(
		@Args('input') input: WishlistInput,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Wishlist> {
		console.log('Mutation: toggleWishlist');
		input.wishlistRefId = shapeIntoMongoObjectId(input.wishlistRefId);
		return await this.wishlistService.toggleWishlist(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Wishlists)
	public async getMyWishlist(
		@Args('input') input: WishlistsInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Wishlists> {
		console.log('Query: getMyWishlist');
		return await this.wishlistService.getMyWishlist(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Boolean)
	public async checkWishlist(
		@Args('input') input: WishlistInput,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<boolean> {
		console.log('Query: checkWishlist');
		input.wishlistRefId = shapeIntoMongoObjectId(input.wishlistRefId);
		return await this.wishlistService.checkWishlist(memberId, input);
	}
}
