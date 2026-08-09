/**
 * Tool Calling architecture — the shapes a future assistant turn uses to ask
 * GoTrip to run one of its own services and hand back a result, before
 * producing its final reply. No tool is implemented yet (Phase 4.2 is
 * architecture-only); see tool-registry.service.ts for the (currently empty)
 * registry future tools plug into, and mcp/mcp.types.ts for how this same
 * shape maps onto the Model Context Protocol wire format later.
 */

export interface ToolParameterSchema {
	type: 'string' | 'number' | 'boolean' | 'array' | 'object';
	description: string;
	required?: boolean;
	enum?: string[];
}

/** What a provider is told a tool does and how to call it — analogous to OpenAI/Anthropic's "function" schema, but provider-neutral. */
export interface ToolDefinition {
	name: string;
	description: string;
	parameters: Record<string, ToolParameterSchema>;
}

/** A provider's request to invoke one tool, extracted from ChatCompletionResult.toolCalls. */
export interface ToolCall {
	id: string;
	name: string;
	arguments: Record<string, unknown>;
}

export interface ToolResult {
	toolCallId: string;
	content: string;
	isError?: boolean;
}

/** Threaded into Tool.execute() so a tool can scope its work to the requesting member and active conversation — mirrors the memberId-first convention every existing service already follows. */
export interface ToolExecutionContext {
	memberId: import('mongoose').ObjectId | null;
	conversationId: string;
	locale: import('../../../libs/enums/locale.enum').Locale;
}

export interface Tool {
	readonly definition: ToolDefinition;
	execute(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolResult>;
}

/**
 * Tools planned for a future phase, and the existing service each will wrap
 * — listed here (not built) so the registry's eventual population is a
 * lookup, not a design exercise:
 *   - SearchToursTool          -> TourService.getTours
 *   - SearchDestinationsTool   -> DestinationService.getDestinations
 *   - SearchArticlesTool       -> BoardArticleService.getBoardArticles
 *   - SearchFaqTool            -> NoticeService.getNotices({noticeCategory: FAQ})
 *   - BookingInformationTool   -> no Booking domain exists yet (see context.types.ts) — deferred until one does
 *   - WeatherTool              -> external API, not part of this codebase yet
 *   - CurrencyTool             -> external API, not part of this codebase yet
 *   - MapsTool                 -> external API, not part of this codebase yet
 */
export const PLANNED_TOOL_NAMES = [
	'searchTours',
	'searchDestinations',
	'searchArticles',
	'searchFaq',
	'bookingInformation',
	'weather',
	'currency',
	'maps',
] as const;
