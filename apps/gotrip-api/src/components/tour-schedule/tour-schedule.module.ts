import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import TourScheduleSchema from '../../schemas/TourSchedule.model';
import TourSchema from '../../schemas/Tour.model';
import { TourScheduleService } from './tour-schedule.service';
import { TourScheduleResolver } from './tour-schedule.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'TourSchedule', schema: TourScheduleSchema },
			{ name: 'Tour', schema: TourSchema },
		]),
		AuthModule,
	],
	providers: [TourScheduleResolver, TourScheduleService],
	exports: [TourScheduleService],
})
export class TourScheduleModule {}
