import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { TourModule } from './tour/tour.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { NotificationModule } from './notification/notification.module';
import { NoticeModule } from './notice/notice.module';
import { CategoryModule } from './category/category.module';
import { DestinationModule } from './destination/destination.module';
import { TestimonialModule } from './testimonial/testimonial.module';
import { MessageModule } from './message/message.module';
import { ConversationModule } from './conversation/conversation.module';

@Module({
	imports: [
		MemberModule,
		AuthModule,
		TourModule,
		BoardArticleModule,
		LikeModule,
		ViewModule,
		CommentModule,
		FollowModule,
		NotificationModule,
		NoticeModule,
		CategoryModule,
		DestinationModule,
		TestimonialModule,
		MessageModule,
		ConversationModule,
	],
})
export class ComponentsModule {}
