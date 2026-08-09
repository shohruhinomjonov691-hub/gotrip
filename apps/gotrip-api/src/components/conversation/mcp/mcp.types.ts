/**
 * Model Context Protocol compatibility — types only, no MCP SDK dependency
 * added and no server/client stood up. These exist so that when GoTrip
 * either exposes its own tools to an external MCP client, or consumes tools
 * from an external MCP server, the translation is a mapping function between
 * these shapes and the ones in tools/tool.interface.ts — not a redesign of
 * the tool layer.
 *
 * Field names deliberately mirror the MCP spec's own vocabulary
 * (tools/resources/capabilities) so the future mapping is close to 1:1:
 *   McpToolDescriptor.inputSchema  <-> ToolDefinition.parameters
 *   McpToolDescriptor.name/description <-> ToolDefinition.name/description
 */

export interface McpToolDescriptor {
	name: string;
	description: string;
	inputSchema: Record<string, unknown>; // JSON Schema, per the MCP spec
}

export interface McpResourceDescriptor {
	uri: string;
	name: string;
	description?: string;
	mimeType?: string;
}

export interface McpServerCapabilities {
	tools?: McpToolDescriptor[];
	resources?: McpResourceDescriptor[];
}

/**
 * The seam a future McpAdapterService would implement: expose GoTrip's own
 * ToolRegistryService as an MCP server (so an external MCP-speaking AI client
 * can call GoTrip's tools), and/or consume a remote MCP server's tools into
 * ToolRegistryService (so GoTrip AI can call THEM). Neither direction exists
 * yet — this interface is the contract a later implementation satisfies.
 */
export interface McpAdapter {
	getServerCapabilities(): McpServerCapabilities;
}
