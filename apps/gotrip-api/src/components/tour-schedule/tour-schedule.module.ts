import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import TourScheduleSchema from '../../schemas/TourSchedule.model';
import { TourScheduleService } from './tour-schedule.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'TourSchedule', schema: TourScheduleSchema }])],
	providers: [TourScheduleService],
	exports: [TourScheduleService],
})
export class TourScheduleModule {}
