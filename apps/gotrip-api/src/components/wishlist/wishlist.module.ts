import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import WishlistSchema from '../../schemas/Wishlist.model';
import { WishlistService } from './wishlist.service';
import { WishlistResolver } from './wishlist.resolver';
import TourSchema from '../../schemas/Tour.model';
import DestinationSchema from '../../schemas/Destination.model';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Wishlist', schema: WishlistSchema },
			{ name: 'Tour', schema: TourSchema },
			{ name: 'Destination', schema: DestinationSchema },
		]),
		AuthModule,
	],
	providers: [WishlistResolver, WishlistService],
	exports: [WishlistService],
})
export class WishlistModule {}
