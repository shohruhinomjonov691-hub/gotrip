/**
 * Memory architecture — types only, no new persistence beyond what
 * AIConversation/AIMessage (schemas/AIConversation.model.ts, AIMessage.model.ts)
 * already store. No dedicated memory collection is created this phase.
 *
 *  - Short-term memory  = the active conversation's own message history.
 *    Already fully served by ConversationService.getMessages() with a
 *    limit/window — no separate type needed, it's just Message[].
 *  - Long-term memory    = facts that should persist ACROSS conversations
 *    (e.g. "prefers budget travel", "has visited Bali"). No storage exists
 *    yet; UserMemoryFact below is the shape a future collection/field would
 *    take. ConversationContextService.collectUserProfile() is the natural
 *    place a future implementation reads it from, since it's already the
 *    "who is asking" context source.
 *  - User preferences     = explicit settings (preferred locale, currency,
 *    interests) — partially already real (Member.memberSocial etc.); this
 *    type is the superset a future GoTripAI-specific preference set would
 *    extend to.
 */

export interface UserMemoryFact {
	memberId: string;
	/** Free-text fact, e.g. "prefers adventure tours over beach tours". Deliberately unstructured — a provider can read prose directly; structure can be layered on later without a schema change here. */
	fact: string;
	source: 'explicit' | 'inferred';
	createdAt: Date;
}

export interface GoTripAIUserPreferences {
	locale?: string;
	currency?: string;
	interests?: string[];
}

/**
 * The seam a future ConversationContextService extension (or a dedicated
 * memory service, if the fact volume ever justifies one) implements.
 * Deliberately NOT a NestJS-injectable service yet — there is nothing to
 * inject until a real store exists; adding one now would be DI plumbing
 * around an empty implementation.
 */
export interface MemoryStore {
	getLongTermMemory(memberId: string): Promise<UserMemoryFact[]>;
	getUserPreferences(memberId: string): Promise<GoTripAIUserPreferences>;
}
