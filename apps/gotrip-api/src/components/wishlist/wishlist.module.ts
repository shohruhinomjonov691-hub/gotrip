import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import WishlistSchema from '../../schemas/Wishlist.model';
import { WishlistService } from './wishlist.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Wishlist', schema: WishlistSchema }])],
	providers: [WishlistService],
	exports: [WishlistService],
})
export class WishlistModule {}
