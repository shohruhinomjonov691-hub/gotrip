import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import DestinationSchema from '../../schemas/Destination.model';
import { DestinationResolver } from './destination.resolver';
import { DestinationService } from './destination.service';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { LikeModule } from '../like/like.module';
import { MemberModule } from '../member/member.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Destination', schema: DestinationSchema }]),
		AuthModule,
		ViewModule,
		LikeModule,
		MemberModule,
	],
	providers: [DestinationResolver, DestinationService],
	exports: [DestinationService],
})
export class DestinationModule {}
