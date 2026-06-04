import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import PaymentSchema from '../../schemas/Payment.model';
import { PaymentService } from './payment.service';
import { PaymentResolver } from './payment.resolver';
import BookingSchema from '../../schemas/Booking.model';
import { AuthModule } from '../auth/auth.module';
import { BookingModule } from '../booking/booking.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Payment', schema: PaymentSchema },
			{ name: 'Booking', schema: BookingSchema },
		]),
		AuthModule,
		BookingModule,
		NotificationModule,
	],
	providers: [PaymentResolver, PaymentService],
	exports: [PaymentService],
})
export class PaymentModule {}
