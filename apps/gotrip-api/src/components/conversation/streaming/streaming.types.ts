/**
 * Streaming architecture — types and documented flow only; no streaming
 * transport (GraphQL subscription, SSE, WebSocket) is wired up yet, and
 * GoTripAIService does not yet call a provider's streamComplete(). This file
 * is the seam a future phase implements against.
 *
 * ChatProvider.streamComplete() (providers/chat-provider.interface.ts)
 * already returns ChatStreamChunk pieces — this file defines the ONE more
 * layer up: how those chunks reach a client. Mirrors the frontend's
 * GoTripAIStreamChunk (GoTrip-next/libs/components/gotripAI/types.ts) on
 * purpose, so the eventual wire format needs no translation between them.
 */
import { ToolCall } from '../tools/tool.interface';

export interface GoTripAIStreamEvent {
	conversationId: string;
	messageId: string;
	delta: string;
	done: boolean;
	toolCall?: ToolCall;
}

/**
 * Future flow once implemented:
 *  1. GoTripAIService.streamMessage() persists the user Message (as
 *     sendMessage() does today), then creates an assistant Message with
 *     status: STREAMING and empty content.
 *  2. It calls ChatProvider.streamComplete(), forwarding each ChatStreamChunk
 *     as a GoTripAIStreamEvent — most naturally via a GraphQL @Subscription
 *     (this codebase's socket gateway, socket/socket.gateway.ts, is already
 *     the precedent for a second real-time transport alongside GraphQL, so
 *     either fits without new infrastructure).
 *  3. On the final chunk, the assistant Message is updated to status:
 *     COMPLETE with the fully assembled content — the same row streamed
 *     events, not a new one, so REST/GraphQL history reads never see a
 *     "streaming" message that doesn't match what was actually streamed.
 */
export type GoTripAIStreamPublisher = (event: GoTripAIStreamEvent) => void;
