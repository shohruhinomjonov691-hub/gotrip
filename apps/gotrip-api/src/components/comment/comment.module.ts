import { Module } from '@nestjs/common';
import { CommentResolver } from './comment.resolver';
import { CommentService } from './comment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { MemberModule } from '../member/member.module';
import CommentSchema from '../../schemas/Comment.model';
import { TourModule } from '../tour/tour.module';
import { BoardArticleModule } from '../board-article/board-article.module';
import { LikeModule } from '../like/like.module';
import { DestinationModule } from '../destination/destination.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: 'Comment',
				schema: CommentSchema,
			},
		]),
		AuthModule,
		MemberModule,
		TourModule,
		BoardArticleModule,
		LikeModule,
		DestinationModule,
		NotificationModule,
	],
	providers: [CommentResolver, CommentService],
})
export class CommentModule {}
