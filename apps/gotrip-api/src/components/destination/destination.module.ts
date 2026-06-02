import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import DestinationSchema from '../../schemas/Destination.model';
import { DestinationService } from './destination.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Destination', schema: DestinationSchema }])],
	providers: [DestinationService],
	exports: [DestinationService],
})
export class DestinationModule {}
