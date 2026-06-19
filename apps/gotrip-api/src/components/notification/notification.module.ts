import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationResolver } from './notification.resolver';
import { NotificationService } from './notification.service';
import NotificationSchema from '../../schemas/Notification.model';
import BookingSchema from '../../schemas/Booking.model';
import PaymentSchema from '../../schemas/Payment.model';
import CommentSchema from '../../schemas/Comment.model';
import TourSchema from '../../schemas/Tour.model';
import BoardArticleSchema from '../../schemas/BoardArticle.model';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Notification', schema: NotificationSchema },
			{ name: 'Booking', schema: BookingSchema },
			{ name: 'Payment', schema: PaymentSchema },
				{ name: 'Comment', schema: CommentSchema },
				{ name: 'Tour', schema: TourSchema },
				{ name: 'BoardArticle', schema: BoardArticleSchema },
				{ name: 'Member', schema: MemberSchema },
			]),
		AuthModule,
	],
	providers: [NotificationResolver, NotificationService],
	exports: [NotificationService],
})
export class NotificationModule {}
