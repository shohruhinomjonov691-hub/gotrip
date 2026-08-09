import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ConversationSchema from '../../schemas/Conversation.model';
import MessageSchema from '../../schemas/Message.model';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { SocketModule } from '../../socket/socket.module';
import { MessageResolver } from './message.resolver';
import { MessageService } from './message.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Conversation', schema: ConversationSchema },
			{ name: 'Message', schema: MessageSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		AuthModule,
		/* Two-way: NotificationModule also imports MessageModule (a tour inquiry
		   creates a message). forwardRef breaks the otherwise-circular require. */
		forwardRef(() => NotificationModule),
		SocketModule,
	],
	providers: [MessageResolver, MessageService],
	exports: [MessageService],
})
export class MessageModule {}
