import { Injectable, Logger } from '@nestjs/common';
import {
	BuildContextRequest,
	GoTripAIContextSourceKey,
	GoTripAIContextSources,
} from '../../libs/dto/conversation/context.types';
import { Direction } from '../../libs/enums/common.enum';
import { NoticeCategory } from '../../libs/enums/notice.enum';
import { TourService } from '../tour/tour.service';
import { DestinationService } from '../destination/destination.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { NoticeService } from '../notice/notice.service';
import { MemberService } from '../member/member.service';
import { LikeService } from '../like/like.service';
import { ViewService } from '../view/view.service';
import type { Member } from '../../libs/dto/member/member';

/**
 * memberPassword is already excluded at the schema level (`select: false`)
 * so it never reaches here — but every context source that can surface
 * OTHER members' data (guides) crosses a real boundary regardless: it's
 * sent to a third-party provider (OpenAI) on every turn, whether or not the
 * traveller asked about guides. Project down to only what a recommendation
 * needs, never the full document (phone number, moderation flags, etc. stay
 * on the server).
 */
function toSafeGuide(member: Member): Record<string, unknown> {
	return {
		_id: member._id,
		memberNick: member.memberNick,
		memberFullName: member.memberFullName,
		memberDesc: member.memberDesc,
		memberAddress: member.memberAddress,
		memberLanguages: member.memberLanguages,
		memberSpecialties: member.memberSpecialties,
		agentExperience: member.agentExperience,
		memberTours: member.memberTours,
		memberRank: member.memberRank,
		memberLikes: member.memberLikes,
	};
}

/** Same minimization as toSafeGuide, applied to the asking traveller's own profile. */
function toSafeProfile(member: Member): Record<string, unknown> {
	return {
		memberNick: member.memberNick,
		memberFullName: member.memberFullName,
		memberType: member.memberType,
		memberAddress: member.memberAddress,
	};
}

/** Bounded top-N per source — this is grounding context for the model to reason over, not a filtered search result; intent-based filtering (by country/budget/etc.) belongs to a future Tool Calling source, not the context builder. */
const CONTEXT_LIST_LIMIT = 6;
const CONTEXT_FAQ_LIMIT = 10;

const ALL_SOURCES: GoTripAIContextSourceKey[] = [
	'tours',
	'destinations',
	'articles',
	'notices',
	'faq',
	'userProfile',
	'guides',
	'bookingHistory',
	'wishlist',
	'recentlyViewed',
];

/**
 * The Context Builder. Every real domain service it will eventually read
 * from is already injected and ready — nothing here is a placeholder for
 * "which service do I call", only for "what do I actually query for and how
 * do I rank/trim it", which is deliberately NOT decided yet (Phase 4.2 is
 * architecture-only; see the per-source collectors below).
 *
 * GoTripAIService calls `buildContext()` once per turn; PromptBuilderService
 * consumes the result. Neither of those two needs to change when a collector
 * below goes from "stub" to "real query" — same seam-isolation as
 * AiTranslationService's provider swap.
 */
@Injectable()
export class ConversationContextService {
	private readonly logger = new Logger(ConversationContextService.name);

	constructor(
		private readonly tourService: TourService,
		private readonly destinationService: DestinationService,
		private readonly boardArticleService: BoardArticleService,
		private readonly noticeService: NoticeService,
		private readonly memberService: MemberService,
		private readonly likeService: LikeService,
		private readonly viewService: ViewService,
	) {}

	public async buildContext(request: BuildContextRequest): Promise<GoTripAIContextSources> {
		const sources = request.sources ?? ALL_SOURCES;
		const context: GoTripAIContextSources = {
			language: request.locale,
			currentPage: request.currentPage,
		};

		// Collected independently (not Promise.all) on purpose for now: once real
		// queries land, a single slow source (e.g. an external Weather-adjacent
		// call some tool ends up needing) must never block the others — worth
		// paying the sequential-await cost here in the stub so the real
		// implementation's error handling is added per-source, not all at once.
		for (const source of sources) {
			try {
				context[source] = (await this.collect(source, request)) as never;
			} catch (err) {
				this.logger.error(`Context source "${source}" failed to collect: ${(err as Error).message}`);
			}
		}

		return context;
	}

	private collect(source: GoTripAIContextSourceKey, request: BuildContextRequest): Promise<unknown> {
		switch (source) {
			case 'tours':
				return this.collectTours(request);
			case 'destinations':
				return this.collectDestinations(request);
			case 'articles':
				return this.collectArticles(request);
			case 'notices':
				return this.collectNotices(request);
			case 'faq':
				return this.collectFaq(request);
			case 'userProfile':
				return this.collectUserProfile(request);
			case 'guides':
				return this.collectGuides(request);
			case 'bookingHistory':
				return this.collectBookingHistory(request);
			case 'wishlist':
				return this.collectWishlist(request);
			case 'recentlyViewed':
				return this.collectRecentlyViewed(request);
		}
	}

	// --- Per-source collectors ------------------------------------------
	// Each is a bounded top-N (by rank/recency) query against the
	// already-injected service — grounding material for the model to reason
	// over, not an intent-filtered search. Filtering by what the traveller
	// actually asked for (country/budget/category/duration) belongs to a
	// future Tool Calling source, which can afford to be precise because it's
	// invoked deliberately by the model; the context builder runs on every
	// turn regardless of intent, so it stays generic and cheap.

	private async collectTours(request: BuildContextRequest): Promise<unknown[]> {
		const result = await this.tourService.getTours(request.memberId as never, {
			page: 1,
			limit: CONTEXT_LIST_LIMIT,
			sort: 'tourRank',
			direction: Direction.DESC,
			search: {},
		});
		return result.list;
	}

	private async collectDestinations(request: BuildContextRequest): Promise<unknown[]> {
		const result = await this.destinationService.getDestinations(request.memberId as never, {
			page: 1,
			limit: CONTEXT_LIST_LIMIT,
			sort: 'destinationRank',
			direction: Direction.DESC,
			search: {},
		});
		return result.list;
	}

	private async collectArticles(request: BuildContextRequest): Promise<unknown[]> {
		const result = await this.boardArticleService.getBoardArticles(request.memberId as never, {
			page: 1,
			limit: CONTEXT_LIST_LIMIT,
			sort: 'articleLikes',
			direction: Direction.DESC,
			search: {},
		});
		return result.list;
	}

	/** Everything except FAQ (see collectFaq) — TERMS/INQUIRY-style notices. */
	private async collectNotices(_request: BuildContextRequest): Promise<unknown[]> {
		const result = await this.noticeService.getNotices({ page: 1, limit: CONTEXT_FAQ_LIMIT, search: {} });
		return result.list.filter((notice) => notice.noticeCategory !== NoticeCategory.FAQ);
	}

	private async collectFaq(_request: BuildContextRequest): Promise<unknown[]> {
		const result = await this.noticeService.getNotices({
			page: 1,
			limit: CONTEXT_FAQ_LIMIT,
			search: { noticeCategory: NoticeCategory.FAQ },
		});
		return result.list;
	}

	private async collectUserProfile(request: BuildContextRequest): Promise<unknown> {
		if (!request.memberId) return undefined;
		const member = await this.memberService.getMember(request.memberId, request.memberId);
		return toSafeProfile(member);
	}

	/** Guides = Member documents with memberType AGENT (see docs/ai/DECISIONS.md — no separate Guide collection). */
	private async collectGuides(request: BuildContextRequest): Promise<unknown[]> {
		const result = await this.memberService.getAgents(request.memberId as never, {
			page: 1,
			limit: CONTEXT_LIST_LIMIT,
			sort: 'memberRank',
			direction: Direction.DESC,
			search: {},
		});
		return result.list.map(toSafeGuide);
	}

	/** No Booking domain exists yet — see context.types.ts. Always empty until one does. */
	private async collectBookingHistory(_request: BuildContextRequest): Promise<unknown[]> {
		return [];
	}

	private async collectWishlist(request: BuildContextRequest): Promise<unknown[]> {
		if (!request.memberId) return [];
		const result = await this.likeService.getFavoriteTours(request.memberId, { page: 1, limit: CONTEXT_LIST_LIMIT });
		return result.list;
	}

	private async collectRecentlyViewed(request: BuildContextRequest): Promise<unknown[]> {
		if (!request.memberId) return [];
		const result = await this.viewService.getVisitedTours(request.memberId, { page: 1, limit: CONTEXT_LIST_LIMIT });
		return result.list;
	}
}
