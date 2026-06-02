import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import PaymentSchema from '../../schemas/Payment.model';
import { PaymentService } from './payment.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Payment', schema: PaymentSchema }])],
	providers: [PaymentService],
	exports: [PaymentService],
})
export class PaymentModule {}
