import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationResolver } from './notification.resolver';
import { NotificationService } from './notification.service';
import NotificationSchema from '../../schemas/Notification.model';
import CommentSchema from '../../schemas/Comment.model';
import TourSchema from '../../schemas/Tour.model';
import BoardArticleSchema from '../../schemas/BoardArticle.model';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';
import { MessageModule } from '../message/message.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Notification', schema: NotificationSchema },
			{ name: 'Comment', schema: CommentSchema },
			{ name: 'Tour', schema: TourSchema },
			{ name: 'BoardArticle', schema: BoardArticleSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		AuthModule,
		/* A tour inquiry (contactAgent) delivers its first message through
		   MessageService — see the note on that method. MessageModule imports
		   NotificationModule too (chat messages notify their receiver), so this
		   side must also use forwardRef. */
		forwardRef(() => MessageModule),
	],
	providers: [NotificationResolver, NotificationService],
	exports: [NotificationService],
})
export class NotificationModule {}
