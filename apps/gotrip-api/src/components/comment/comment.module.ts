import { Module } from '@nestjs/common';
import { CommentResolver } from './comment.resolver';
import { CommentService } from './comment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { MemberModule } from '../member/member.module';
import CommentSchema from '../../schemas/Comment.model';
import TourSchema from '../../schemas/Tour.model';
import BoardArticleSchema from '../../schemas/BoardArticle.model';
import MemberSchema from '../../schemas/Member.model';
import { TourModule } from '../tour/tour.module';
import { BoardArticleModule } from '../board-article/board-article.module';
import { LikeModule } from '../like/like.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Comment', schema: CommentSchema },
			{ name: 'Tour', schema: TourSchema },
			{ name: 'BoardArticle', schema: BoardArticleSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		AuthModule,
		MemberModule,
		TourModule,
		BoardArticleModule,
		LikeModule,
		NotificationModule,
	],
	providers: [CommentResolver, CommentService],
})
export class CommentModule {}
