import { ObjectId } from 'mongoose';
import { Locale } from '../../enums/locale.enum';
import { Tour } from '../tour/tour';
import { Destination } from '../destination/destination';
import { BoardArticle } from '../board-article/board-article';
import { Notice } from '../notice/notice';
import { Member } from '../member/member';

/**
 * The 10 context sources ConversationContextService.buildContext() assembles
 * (see components/conversation/conversation-context.service.ts). Every field
 * is optional and un-populated by default in this phase — retrieval is not
 * implemented yet, only the shape a future PromptBuilderService call can
 * already type-check against.
 */
export interface GoTripAIContextSources {
	tours?: Tour[];
	destinations?: Destination[];
	articles?: BoardArticle[];
	notices?: Notice[];
	faq?: Notice[];
	userProfile?: Member;
	/** Guides are Member documents with memberType AGENT — no separate Guide collection exists (see docs/ai/DECISIONS.md). */
	guides?: Member[];
	/**
	 * No Booking domain exists in this codebase (removed by an earlier,
	 * documented scope decision — see docs/ai/DECISIONS.md). Kept as a typed
	 * placeholder so the context shape doesn't need to change if/when Booking
	 * returns; always empty until then.
	 */
	bookingHistory?: unknown[];
	wishlist?: Tour[];
	recentlyViewed?: Tour[];
	language?: Locale;
	currentPage?: string;
}

/** Which sources to collect, and with what the requester already knows. */
export interface BuildContextRequest {
	memberId: ObjectId | null;
	locale: Locale;
	currentPage?: string;
	/** Defaults to every source in GoTripAIContextSources when omitted. */
	sources?: GoTripAIContextSourceKey[];
}

export type GoTripAIContextSourceKey =
	| 'tours'
	| 'destinations'
	| 'articles'
	| 'notices'
	| 'faq'
	| 'userProfile'
	| 'guides'
	| 'bookingHistory'
	| 'wishlist'
	| 'recentlyViewed';
