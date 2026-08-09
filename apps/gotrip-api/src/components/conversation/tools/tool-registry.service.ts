import { Injectable, Logger } from '@nestjs/common';
import { Tool, ToolDefinition, ToolExecutionContext, ToolResult } from './tool.interface';

/**
 * Holds whatever tools exist — none yet. A future `SearchToursTool` etc.
 * (see tool.interface.ts's PLANNED_TOOL_NAMES) calls `register()` from its
 * own module's constructor; GoTripAIService calls `getDefinitions()` to hand
 * the provider a tool list and `execute()` to run whichever one it picks.
 * Deliberately a plain in-memory Map, not a database table — tool
 * availability is a deploy-time/code concern, not user data.
 */
@Injectable()
export class ToolRegistryService {
	private readonly logger = new Logger(ToolRegistryService.name);
	private readonly tools = new Map<string, Tool>();

	register(tool: Tool): void {
		if (this.tools.has(tool.definition.name)) {
			throw new Error(`Tool "${tool.definition.name}" is already registered.`);
		}
		this.tools.set(tool.definition.name, tool);
	}

	getDefinitions(): ToolDefinition[] {
		return Array.from(this.tools.values()).map((tool) => tool.definition);
	}

	async execute(name: string, args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolResult> {
		const tool = this.tools.get(name);
		if (!tool) {
			this.logger.error(`Requested unknown tool "${name}".`);
			return { toolCallId: '', content: `Tool "${name}" is not available.`, isError: true };
		}
		try {
			return await tool.execute(args, ctx);
		} catch (err) {
			this.logger.error(`Tool "${name}" failed: ${(err as Error).message}`);
			return { toolCallId: '', content: `Tool "${name}" failed.`, isError: true };
		}
	}
}
