import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import AIConversationSchema from '../../schemas/AIConversation.model';
import AIMessageSchema from '../../schemas/AIMessage.model';
import { GoTripAIService } from './gotrip-ai.service';
import { ConversationService } from './conversation.service';
import { ConversationContextService } from './conversation-context.service';
import { PromptBuilderService } from './prompt-builder.service';
import { ToolRegistryService } from './tools/tool-registry.service';
import { CHAT_PROVIDER } from './providers/chat-provider.interface';
import { OpenAIChatProvider } from './providers/openai-chat.provider';
import { TourModule } from '../tour/tour.module';
import { DestinationModule } from '../destination/destination.module';
import { BoardArticleModule } from '../board-article/board-article.module';
import { NoticeModule } from '../notice/notice.module';
import { MemberModule } from '../member/member.module';
import { LikeModule } from '../like/like.module';
import { ViewModule } from '../view/view.module';
import { SocketModule } from '../../socket/socket.module';
import { AuthModule } from '../auth/auth.module';
import { ConversationResolver } from './conversation.resolver';

/**
 * The Conversation module — GoTrip AI's backend architecture (Phase 4.2),
 * a real CHAT_PROVIDER binding (Phase 4.3), and now (Phase 4.5) a
 * ConversationResolver exposing it over GraphQL, with SocketModule imported
 * so streaming chunks can reach the caller over the existing raw WebSocket
 * gateway — see conversation.resolver.ts's header comment.
 *
 * Model tokens are 'AIConversation'/'AIMessage' — NOT 'Conversation'/
 * 'Message' — deliberately: those names are already used by the pre-existing
 * private-messaging feature (components/message, schemas/Conversation.model.ts
 * & Message.model.ts, collections `conversations`/`messages`). Registering
 * the same Mongoose model name twice via MongooseModule.forFeature silently
 * lets one registration win for the underlying schema/indexes while both
 * injections resolve to it — see AIConversation.model.ts's header comment for
 * the incident this caused and was fixed from.
 *
 * CHAT_PROVIDER is bound to OpenAIChatProvider — the ONLY line that changed
 * to go from "no provider" to "production OpenAI" (see
 * providers/chat-provider.interface.ts and gotrip-ai.service.ts, which
 * still only knows about the ChatProvider interface, never OpenAI
 * specifically). Swapping to Claude/Gemini/local later is the same
 * one-line change plus a new provider class — GoTripAIService,
 * ConversationService, ConversationContextService, and
 * PromptBuilderService are all untouched by this phase.
 *
 * Imports every content module ConversationContextService reads from
 * (read-only — nothing here modifies Tour/Destination/BoardArticle/Notice
 * business logic or their own modules), plus Member/Like/View for user
 * profile, wishlist, and recently-viewed context.
 */
@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'AIConversation', schema: AIConversationSchema },
			{ name: 'AIMessage', schema: AIMessageSchema },
		]),
		TourModule,
		DestinationModule,
		BoardArticleModule,
		NoticeModule,
		MemberModule,
		LikeModule,
		ViewModule,
		SocketModule,
		AuthModule,
	],
	providers: [
		GoTripAIService,
		ConversationService,
		ConversationContextService,
		PromptBuilderService,
		ToolRegistryService,
		OpenAIChatProvider,
		{ provide: CHAT_PROVIDER, useExisting: OpenAIChatProvider },
		ConversationResolver,
	],
	exports: [GoTripAIService, ConversationService],
})
export class ConversationModule {}
