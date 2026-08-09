import { MessageRole } from '../../../libs/enums/conversation.enum';
import { Locale } from '../../../libs/enums/locale.enum';
import { ToolCall, ToolDefinition, ToolResult } from '../tools/tool.interface';

/**
 * Provider-agnostic chat message — the SAME idea as TranslationProvider's
 * TranslatableFields (components/translation/providers), applied to chat.
 * PromptBuilderService only ever produces/consumes this shape; no vendor
 * SDK type (OpenAI's ChatCompletionMessageParam, Anthropic's MessageParam,
 * ...) appears above the provider boundary.
 */
export interface ChatMessage {
	role: MessageRole;
	content: string;
	/** Present on a role: TOOL message — which call this is the result of. */
	toolCallId?: string;
}

export interface ChatCompletionRequest {
	messages: ChatMessage[];
	locale: Locale;
	/** Tool definitions the provider may call — empty until components/conversation/tools has real tools registered. */
	tools?: ToolDefinition[];
	maxTokens?: number;
	temperature?: number;
}

export interface ChatCompletionResult {
	content: string;
	toolCalls?: ToolCall[];
	tokenUsage?: { prompt: number; completion: number };
	/** Why generation stopped — mirrors the stop_reason/finish_reason field every major provider already returns. */
	finishReason?: 'stop' | 'tool_call' | 'length' | 'error';
}

/** One incremental piece of a streaming reply — see components/conversation/streaming. */
export interface ChatStreamChunk {
	delta: string;
	done: boolean;
	toolCall?: ToolCall;
}

/**
 * DI token for the optional ChatProvider binding — see conversation.module.ts,
 * which does NOT bind this token yet, and GoTripAIService, which injects it
 * with @Optional() and gets `undefined` until a future phase adds
 * `{ provide: CHAT_PROVIDER, useClass: AnthropicChatProvider }` to the
 * module's providers array. No other file changes when that happens.
 */
export const CHAT_PROVIDER = 'CHAT_PROVIDER';

/**
 * The contract every future concrete provider (Claude, OpenAI, Gemini, a
 * local model) implements. GoTripAIService talks only to this interface —
 * exactly how AiTranslationService only talks to TranslationProvider — so
 * adding a provider is a new class here plus a DI binding, never a change to
 * ConversationService, ConversationContextService, or PromptBuilderService.
 *
 * No implementation exists yet (Phase 4.2 is architecture-only); `complete`
 * and `streamComplete` are the two seams a future
 * `AnthropicChatProvider`/`OpenAiChatProvider`/etc. fills in.
 */
export interface ChatProvider {
	readonly name: string;
	complete(request: ChatCompletionRequest): Promise<ChatCompletionResult>;
	streamComplete(
		request: ChatCompletionRequest,
		onChunk: (chunk: ChatStreamChunk) => void,
	): Promise<ChatCompletionResult>;
}

/** Re-exported so callers of chat-provider.interface.ts don't also need a direct import from tools/. */
export type { ToolCall, ToolDefinition, ToolResult };
