import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import BookingSchema from '../../schemas/Booking.model';
import { BookingService } from './booking.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Booking', schema: BookingSchema }])],
	providers: [BookingService],
	exports: [BookingService],
})
export class BookingModule {}
