import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class DestinationService {
	constructor(@InjectModel('Destination') private readonly destinationModel: Model<any>) {}
}
