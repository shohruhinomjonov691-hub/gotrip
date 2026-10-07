import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';
import { MessageRole } from '../../../libs/enums/conversation.enum';
import {
	ChatCompletionRequest,
	ChatCompletionResult,
	ChatMessage,
	ChatProvider,
	ChatStreamChunk,
} from './chat-provider.interface';
import { ToolCall, ToolDefinition } from '../tools/tool.interface';

const DEFAULT_MODEL = 'gpt-5.5';
/**
 * `ChatCompletionRequest.maxTokens` was declared on the interface but never
 * actually passed to the OpenAI SDK call — every response used the SDK's own
 * uncapped default, which is how the assistant drifted into long, unbounded
 * replies despite the system prompt asking for conciseness. This is a
 * backstop, not the primary conciseness mechanism (that's
 * PromptBuilderService's STYLE_INSTRUCTIONS) — it makes "keep it short" a
 * hard limit instead of only a request. Uses `max_completion_tokens`, not the
 * legacy `max_tokens` — gpt-5.5 (a reasoning-class model) rejects the old
 * parameter name. `temperature` is deliberately left unset for the same
 * reason: gpt-5.5 only accepts the default (1) and errors on any override.
 */
const DEFAULT_MAX_TOKENS = 700;

/**
 * Production ChatProvider backed by the official `openai` SDK. Implements
 * the exact same interface every other piece of the conversation
 * architecture already talks to (see chat-provider.interface.ts) — nothing
 * in ConversationService, ConversationContextService, PromptBuilderService,
 * or GoTripAIService's request flow changes to support this; only
 * conversation.module.ts's DI binding does (see CHAT_PROVIDER there).
 *
 * Role/message mapping is the only real translation this class does:
 * GoTripAI's MessageRole (SYSTEM/USER/ASSISTANT/TOOL) <-> OpenAI's lowercase
 * role strings, and ToolDefinition/ToolCall <-> OpenAI's function-calling
 * shape — both directions are pure data mapping, no business logic.
 */
@Injectable()
export class OpenAIChatProvider implements ChatProvider {
	readonly name = 'openai';
	private readonly logger = new Logger(OpenAIChatProvider.name);
	private readonly client: OpenAI;
	private readonly model: string;

	constructor() {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			// Never throw from a constructor for a missing key — the binding in
			// conversation.module.ts is unconditional so DI can resolve at boot
			// even in an environment without the key configured; every call
			// below re-checks and fails per-request instead (same convention as
			// AnthropicTranslationProvider).
			this.logger.warn('OPENAI_API_KEY is not set — OpenAIChatProvider will fail on first use.');
		}
		this.client = new OpenAI({ apiKey: apiKey || 'not-configured' });
		this.model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
	}

	public async complete(request: ChatCompletionRequest): Promise<ChatCompletionResult> {
		this.assertConfigured();
		try {
			const completion = await this.client.chat.completions.create(
				{
					model: this.model,
					messages: request.messages.map(toOpenAiMessage),
					tools: toOpenAiTools(request.tools),
					max_completion_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
					stream: false,
				},
				toRequestOptions(request),
			);

			const choice = completion.choices[0];
			return {
				content: choice?.message?.content ?? '',
				toolCalls: toGoTripToolCalls(choice?.message?.tool_calls),
				tokenUsage: completion.usage
					? { prompt: completion.usage.prompt_tokens, completion: completion.usage.completion_tokens }
					: undefined,
				finishReason: toFinishReason(choice?.finish_reason),
			};
		} catch (err) {
			this.logger.error(`OpenAI completion failed: ${(err as Error).message}`);
			throw err; // GoTripAIService.completeWithProvider() already catches this and persists a graceful SYSTEM message.
		}
	}

	public async streamComplete(
		request: ChatCompletionRequest,
		onChunk: (chunk: ChatStreamChunk) => void,
	): Promise<ChatCompletionResult> {
		this.assertConfigured();
		try {
			const stream = await this.client.chat.completions.create({
				model: this.model,
				messages: request.messages.map(toOpenAiMessage),
				tools: toOpenAiTools(request.tools),
				max_completion_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
				stream: true,
				// Without this, OpenAI never sends a usage-bearing chunk on a streamed
				// response — token usage would be silently unavailable for every
				// streamed turn (unlike complete(), which always gets `usage` back).
				stream_options: { include_usage: true },
			});

			let content = '';
			let finishReason: ChatCompletionResult['finishReason'];
			let tokenUsage: ChatCompletionResult['tokenUsage'];
			const toolCallBuffer = new Map<number, { id: string; name: string; arguments: string }>();

			for await (const part of stream) {
				// The final usage-bearing chunk (stream_options.include_usage) has an
				// empty `choices` array — nothing to read a delta/finish_reason from.
				const delta = part.choices[0]?.delta;
				const reason = part.choices[0]?.finish_reason;

				if (delta?.content) {
					content += delta.content;
					onChunk({ delta: delta.content, done: false });
				}

				// Tool-call arguments stream in fragments keyed by index — accumulate,
				// only emit once a call is fully identified (has a name).
				for (const toolDelta of delta?.tool_calls ?? []) {
					const existing = toolCallBuffer.get(toolDelta.index) ?? { id: '', name: '', arguments: '' };
					if (toolDelta.id) existing.id = toolDelta.id;
					if (toolDelta.function?.name) existing.name = toolDelta.function.name;
					if (toolDelta.function?.arguments) existing.arguments += toolDelta.function.arguments;
					toolCallBuffer.set(toolDelta.index, existing);
				}

				if (reason) finishReason = toFinishReason(reason);
				if (part.usage) tokenUsage = { prompt: part.usage.prompt_tokens, completion: part.usage.completion_tokens };
			}

			onChunk({ delta: '', done: true });

			const toolCalls: ToolCall[] = Array.from(toolCallBuffer.values())
				.filter((call) => call.name)
				.map((call) => ({ id: call.id, name: call.name, arguments: safeParseJson(call.arguments) }));

			return { content, toolCalls: toolCalls.length ? toolCalls : undefined, finishReason, tokenUsage };
		} catch (err) {
			this.logger.error(`OpenAI streaming completion failed: ${(err as Error).message}`);
			throw err;
		}
	}

	private assertConfigured(): void {
		if (!process.env.OPENAI_API_KEY) {
			throw new Error('OPENAI_API_KEY is not configured.');
		}
	}
}

const ROLE_TO_OPENAI: Record<MessageRole, ChatCompletionMessageParam['role']> = {
	[MessageRole.SYSTEM]: 'system',
	[MessageRole.USER]: 'user',
	[MessageRole.ASSISTANT]: 'assistant',
	[MessageRole.TOOL]: 'tool',
};

function toOpenAiMessage(message: ChatMessage): ChatCompletionMessageParam {
	if (message.role === MessageRole.TOOL) {
		return { role: 'tool', content: message.content, tool_call_id: message.toolCallId ?? '' };
	}
	return { role: ROLE_TO_OPENAI[message.role], content: message.content } as ChatCompletionMessageParam;
}

/** Only overrides what the caller set — an empty request leaves the SDK's default timeout/retries untouched. */
function toRequestOptions(request: ChatCompletionRequest): { timeout?: number; maxRetries?: number } | undefined {
	if (request.timeoutMs === undefined && request.maxRetries === undefined) return undefined;
	return {
		...(request.timeoutMs !== undefined ? { timeout: request.timeoutMs } : {}),
		...(request.maxRetries !== undefined ? { maxRetries: request.maxRetries } : {}),
	};
}

function toOpenAiTools(tools?: ToolDefinition[]): ChatCompletionTool[] | undefined {
	if (!tools?.length) return undefined;
	return tools.map((tool) => ({
		type: 'function',
		function: {
			name: tool.name,
			description: tool.description,
			parameters: {
				type: 'object',
				properties: Object.fromEntries(
					Object.entries(tool.parameters).map(([key, schema]) => [
						key,
						{ type: schema.type, description: schema.description, ...(schema.enum ? { enum: schema.enum } : {}) },
					]),
				),
				required: Object.entries(tool.parameters)
					.filter(([, schema]) => schema.required)
					.map(([key]) => key),
			},
		},
	}));
}

function toGoTripToolCalls(
	toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] | undefined,
): ToolCall[] | undefined {
	if (!toolCalls?.length) return undefined;
	// GoTrip only ever defines 'function' tools (see tools/tool.interface.ts) — the SDK's
	// 'custom' tool-call variant (freeform, non-JSON-schema tools) is never produced here.
	const functionCalls = toolCalls.filter(
		(call): call is OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall => call.type === 'function',
	);
	if (!functionCalls.length) return undefined;
	return functionCalls.map((call) => ({
		id: call.id,
		name: call.function.name,
		arguments: safeParseJson(call.function.arguments),
	}));
}

function toFinishReason(reason: string | null | undefined): ChatCompletionResult['finishReason'] {
	switch (reason) {
		case 'tool_calls':
			return 'tool_call';
		case 'length':
			return 'length';
		case 'stop':
			return 'stop';
		default:
			return reason ? 'error' : undefined;
	}
}

function safeParseJson(raw: string): Record<string, unknown> {
	try {
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}
