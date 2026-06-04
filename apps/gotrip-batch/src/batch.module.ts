import { Module } from '@nestjs/common';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import TourSchema from 'apps/gotrip-api/src/schemas/Tour.model';
import MemberSchema from 'apps/gotrip-api/src/schemas/Member.model';
import BookingSchema from 'apps/gotrip-api/src/schemas/Booking.model';
import WishlistSchema from 'apps/gotrip-api/src/schemas/Wishlist.model';
import DestinationSchema from 'apps/gotrip-api/src/schemas/Destination.model';

@Module({
	imports: [
		ConfigModule.forRoot(),
		DatabaseModule,
		ScheduleModule.forRoot(),
		MongooseModule.forFeature([
			{ name: 'Tour', schema: TourSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Booking', schema: BookingSchema },
			{ name: 'Wishlist', schema: WishlistSchema },
			{ name: 'Destination', schema: DestinationSchema },
		]),
	],
	controllers: [BatchController],
	providers: [BatchService],
})
export class BatchModule {}
