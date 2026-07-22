import { Module } from '@nestjs/common';
import { TourResolver } from './tour.resolver';
import { TourService } from './tour.service';
import { MongooseModule } from '@nestjs/mongoose';
import TourSchema from '../../schemas/Tour.model';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { MemberModule } from '../member/member.module';
import { LikeModule } from '../like/like.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: 'Tour',
				schema: TourSchema,
			},
		]),
		AuthModule,
		ViewModule,
		MemberModule,
		LikeModule,
		NotificationModule,
	],
	providers: [TourResolver, TourService],
	exports: [TourService],
})
export class TourModule {}
