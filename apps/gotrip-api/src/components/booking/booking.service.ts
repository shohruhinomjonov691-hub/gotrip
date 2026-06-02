import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class BookingService {
	constructor(@InjectModel('Booking') private readonly bookingModel: Model<any>) {}
}
