import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class TourScheduleService {
	constructor(@InjectModel('TourSchedule') private readonly tourScheduleModel: Model<any>) {}
}
