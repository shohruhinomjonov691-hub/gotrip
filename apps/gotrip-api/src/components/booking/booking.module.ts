import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import BookingSchema from '../../schemas/Booking.model';
import { BookingService } from './booking.service';
import { BookingResolver } from './booking.resolver';
import TourSchema from '../../schemas/Tour.model';
import { AuthModule } from '../auth/auth.module';
import { TourScheduleModule } from '../tour-schedule/tour-schedule.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Booking', schema: BookingSchema },
			{ name: 'Tour', schema: TourSchema },
		]),
		AuthModule,
		TourScheduleModule,
		NotificationModule,
	],
	providers: [BookingResolver, BookingService],
	exports: [BookingService],
})
export class BookingModule {}
