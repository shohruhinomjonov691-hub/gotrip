# Completed Tasks

## Session Summary

Completed the breaking backend migration from the old real-estate `Property` catalog domain to the GoTrip travel `Tour` domain. `MemberType.USER`, `MemberType.AGENT`, and `MemberType.ADMIN` remain unchanged, and `MemberType.AGENT` remains the tour owner/operator role.

## Completed Refactors

| Area | Completed Change |
| --- | --- |
| Catalog module | Replaced `property` module with `tour` module |
| GraphQL API | Replaced public property operations/types with tour operations/types |
| Tour model | Added ERD tour fields and removed real-estate-only fields |
| Enums | Added `TourCategory`, updated `TourStatus`, and added `BookingStatus` |
| Member counters | Renamed `memberProperties` to `memberTours` |
| Social modules | Likes, views, comments, and notifications now use tour naming |
| Comments | Added optional `rating` field for tour reviews |
| ERD collections | Added schemas/modules for destinations, tour schedules, bookings, wishlists, and payments |
| Batch app | Updated ranking jobs for tours, agents, and destinations using bookings, wishlists, and engagement counters |
| Agent approval flow | Added `AgentRequestStatus`, request metadata, `isVerifiedAgent`, USER-only signup, admin request queue, and admin approve/reject mutation |
| Social review groups | Added group-aware likes/views, comment likes, reply support, and review-rating validation |
| Destination module | Added destination GraphQL CRUD/list/detail, active public access, admin management, and destination social counters |
| Tour schedule module | Added schedule GraphQL APIs, ownership validation, tour-detail schedule exposure, and reusable seat helpers |
| Booking module | Added booking GraphQL APIs, seat reservation/release, lifecycle transitions, expiry helper, and payment-prep service methods |
| Payment module | Added payment GraphQL APIs, payment lifecycle transitions, booking confirmation/refund integration, and retry-ready failed/cancelled payment states |
| Wishlist module | Added authenticated wishlist APIs for saving tours and destinations with hydrated saved-item results |
| Notification module | Added notification GraphQL APIs, reusable helper methods, and safe wiring into agent, booking, payment, and comment flows |
| Ranking batch | Added batch recalculation for tour/member/destination ranks and destination tour counts |
| Notice module | Added public notice reads and admin notice CRUD with soft delete |

## Previous Phase: Agent Request Approval Flow

| Area | Completed Change |
| --- | --- |
| Affected modules | `member` resolver/service/module patterns preserved |
| Affected DTOs | Added signup agent request fields, member output fields, admin review input, and admin request filtering |
| Affected schemas | Added agent request status/message/experience/timestamps and verified-agent flag to `members` |
| Affected enums | Added `AgentRequestStatus.NONE/PENDING/APPROVED/REJECTED`; kept `MemberType.USER/AGENT/ADMIN` unchanged |
| GraphQL changes | Signup always stores `USER`; admin can query agent requests and approve/reject pending requests |
| Migration changes | Existing members default through schema to no request and unverified agent state; no data collection rename in this phase |
| Validation results | API and batch TypeScript validations passed |

## Previous Phase: Social Groups And Comment Reviews

| Area | Completed Change |
| --- | --- |
| Affected modules | `like`, `view`, and `comment` resolver/service/module patterns preserved; existing tour/member/article call sites updated |
| Affected DTOs | Added `commentLikes`, optional `parentCommentId`, group-aware comment inquiry fields, and 1..5 rating validation |
| Affected schemas | `likes` and `views` now use group-aware unique indexes; `comments` now stores likes and optional parent comment references |
| Affected enums | Added `COMMENT` and `DESTINATION` social groups where required while preserving existing `MEMBER`, `TOUR`, and `ARTICLE` groups |
| GraphQL changes | Added `likeTargetComment(commentId): Comment`; `getComments` filters by `commentGroup` and `commentRefId` with optional `parentCommentId` |
| Migration changes | Existing like/view indexes may need manual cleanup/rebuild before applying group-aware unique indexes to production data |
| Validation results | API and batch TypeScript validations passed |

## Previous Phase: Destination Module

| Area | Completed Change |
| --- | --- |
| Affected modules | `destination` resolver/service/module completed; `comment` now increments destination comment counters; `tour` inquiry supports `destinationId` filtering |
| Affected DTOs | Added destination create/update/output/public inquiry/admin inquiry DTOs |
| Affected schemas | Added `destinationLikes`, `destinationComments`, `destinationRating`, `destinationTours`, and status/country/city index to `destinations` |
| Affected enums | Verified existing `DestinationStatus.ACTIVE/PAUSED/DELETED`; reused `LikeGroup.DESTINATION`, `ViewGroup.DESTINATION`, and `CommentGroup.DESTINATION` |
| GraphQL changes | Added public `getDestination`, `getDestinations`, authenticated `likeTargetDestination`, and admin create/update/delete/list operations |
| Migration changes | Existing destination documents should backfill missing counter/rating/tour-count fields before production index/release |
| Validation results | API and batch TypeScript validations passed |

## Previous Phase: Tour Schedule Management

| Area | Completed Change |
| --- | --- |
| Affected modules | `tour-schedule` resolver/service/module completed; `tour` detail now exposes active schedules |
| Affected DTOs | Added schedule output, create, update, public inquiry, and admin inquiry DTOs |
| Affected schemas | Added schedule seat/price minimums and indexes for tour/status/date filtering |
| Affected enums | Updated `TourScheduleStatus` to `ACTIVE/FULL/PAUSED/DELETED`; legacy `SOLD_OUT/CANCELLED` require data cleanup outside this phase |
| GraphQL changes | Added public schedule queries, agent schedule mutations, and admin schedule list/create/update/delete operations |
| Migration changes | Existing schedule rows using old statuses must be mapped before production rollout |
| Validation results | API and batch TypeScript validations passed |

## Previous Phase: Booking Management

| Area | Completed Change |
| --- | --- |
| Affected modules | `booking` resolver/service/module completed; `tour-schedule` seat helpers tightened for booking reservations |
| Affected DTOs | Added booking output/list, create input, admin update input, and user/agent/admin inquiry DTOs |
| Affected schemas | Added traveler fields, `expiresAt`, booking lifecycle fields, and indexes for booking filters |
| Affected enums | Verified `BookingStatus.PENDING/CONFIRMED/CANCELLED/COMPLETED` unchanged |
| GraphQL changes | Added user create/cancel/view, agent booking view/status update, and admin list/view/update/cancel operations |
| Booking lifecycle | `PENDING` reserves seats; cancellation/payment failure/expiry release seats; confirmation/completion update status only |
| Migration changes | Existing booking rows should backfill traveler fields and `expiresAt` before production rollout |
| Validation results | API and batch TypeScript validations passed |

## Previous Phase: Payment Management

| Area | Completed Change |
| --- | --- |
| Affected modules | `payment` resolver/service/module completed; booking confirmation and refund cancellation hooks reused |
| Affected DTOs | Added payment output/list, create input, and user/agent/admin inquiry DTOs |
| Affected schemas | Added payment indexes for booking/member/tour/status/method/date filters |
| Affected enums | Updated `PaymentStatus` to include `CANCELLED`; updated `PaymentMethod` with `KAKAO_PAY` and `NAVER_PAY` |
| GraphQL changes | Added user create/view, agent read-only, and admin payment lifecycle operations |
| Payment lifecycle | Admin success confirms booking; failed/cancelled payment attempts keep booking pending for retry; refund cancels confirmed booking and releases seats |
| Migration changes | Existing payment rows should be checked for legacy payment methods/statuses before production rollout |
| Validation results | API and batch TypeScript validations passed |

## Previous Phase: Wishlist Management

| Area | Completed Change |
| --- | --- |
| Affected modules | `wishlist` resolver/service/module completed with direct tour and destination target validation |
| Affected DTOs | Added wishlist output/list, toggle/check input, and paginated inquiry DTOs |
| Affected schemas | Existing wishlist schema and unique `wishlistGroup/wishlistRefId/memberId` index preserved |
| Affected enums | Updated `WishlistGroup` to `TOUR/DESTINATION` |
| GraphQL changes | Added authenticated `toggleWishlist`, `getMyWishlist`, and `checkWishlist` operations |
| Wishlist behavior | Wishlist is separate from likes; saved rows hydrate optional `tourData` or `destinationData`; no counters added |
| Migration changes | Existing wishlist rows should be reviewed for unsupported groups before production rollout |
| Validation results | API and batch TypeScript validations passed |

## Previous Phase: Notifications

| Area | Completed Change |
| --- | --- |
| Affected modules | Added `notification` resolver/service/module and registered it in `ComponentsModule`; wired helpers into `member`, `booking`, `payment`, and `comment` modules |
| Affected DTOs | Added notification output/list DTOs plus helper/admin/user inquiry inputs with status/type/group/context/date filters |
| Affected schemas | Completed `notifications` with receiver/member mirroring, optional author/context refs, payment/comment refs, and recipient/status/context indexes |
| Affected enums | Updated notification type/status/group enums to `AGENT_APPROVED`, `AGENT_REJECTED`, `BOOKING_CREATED`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `COMMENT_CREATED`, `LIKE_CREATED`, `FOLLOW_CREATED`, `ADMIN_NOTICE`; `WAIT/READ/DELETED`; and `MEMBER/TOUR/BOOKING/PAYMENT/ARTICLE/COMMENT/NOTICE` |
| GraphQL changes | Added `getMyNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `deleteNotification`, and admin `getAllNotificationsByAdmin` |
| Helper wiring | Agent approval/rejection notifies members; booking creation notifies agents; payment success/failure notifies paying members; comment creation notifies resolvable target owners while skipping self/destination notifications |
| Migration changes | Existing notification rows should backfill `memberId`, `paymentId`, and `commentId` compatibility fields where needed before production rollout |
| Validation results | API and batch TypeScript validations passed |

## Previous Phase: Rankings and Batch Updates

| Area | Completed Change |
| --- | --- |
| Affected app | Updated `gotrip-batch` only; no GraphQL/API behavior changed |
| Affected modules | Extended batch module model registration for `Booking`, `Wishlist`, and `Destination` alongside existing `Tour` and `Member` |
| Batch tasks | Updated rollback, tour rank, and agent rank jobs; added destination tour-count and destination rank jobs |
| Ranking formulas | `tourRank = views + likes*2 + comments*3 + successfulBookings*5 + wishlistCount*4`; `memberRank = views + likes*2 + comments*3 + followers*4 + tours*5 + successfulAgentBookings*5`; `destinationRank = views + likes*2 + comments*3 + round(rating*10) + destinationTours*5` |
| Counting rules | Successful bookings are `CONFIRMED` or `COMPLETED`; tour wishlists use `WishlistGroup.TOUR`; destination tour counts include only `ACTIVE` tours with a destination |
| Expiry decision | Pending booking expiry was not implemented because reusing API `BookingService` would pull unrelated service dependencies into batch |
| Migration changes | No data migration was performed; production data cleanup remains separate |
| Validation results | API and batch TypeScript validations passed |

## Latest Phase: Final Fixes

| Area | Completed Change |
| --- | --- |
| Affected modules | Added `notice` resolver/service/module and registered it in `ComponentsModule` |
| Affected DTOs | Added notice output/list, create input, update input, public inquiry, and admin inquiry DTOs |
| Affected schemas | Reused existing `notices` schema fields and `NoticeStatus.DELETE` for soft delete |
| GraphQL changes | Added public `getNotices` and `getNotice`; added admin `getAllNoticesByAdmin`, `createNoticeByAdmin`, `updateNoticeByAdmin`, and `deleteNoticeByAdmin` |
| Docs cleanup | Updated stale frontend/backend migration notes so they reference current tour-based GraphQL APIs |
| Validation results | API and batch TypeScript validations passed |

## Latest Phase: createTour Authorization Fix

| Area | Completed Change |
| --- | --- |
| Affected modules | Tightened GraphQL auth guards/decorator and `tour` resolver/service create flow |
| Authorization | `RolesGuard` now uses `GqlExecutionContext`/`context.getType()` and enforces `@Roles(MemberType.AGENT)` for GraphQL requests |
| Service safety | `TourService.createTour` reloads the current member, rejects non-`AGENT` members with `Message.ONLY_SPECIFIC_ROLES_ALLOWED`, and sets ownership from the authenticated member id |
| Tests | Added focused `createTour` service tests and `RolesGuard` role tests for `USER`, `ADMIN`, and `AGENT` behavior |
| Validation results | API TypeScript validation and focused Jest specs passed |

## Latest Phase: Backend Audit Fixes

| Area | Completed Change |
| --- | --- |
| Booking expiry | Added batch cron wiring that cancels expired `PENDING` bookings and releases reserved schedule seats |
| Payment failure | Admin failed payments now cancel the pending booking and release reserved seats through booking lifecycle helpers |
| Destination ratings | Rated top-level destination comments recalculate `destinationRating`; destination ratings remain optional |
| Notifications | Added safe automatic `FOLLOW_CREATED` and owner-backed `LIKE_CREATED` notifications; destination likes are skipped |
| Admin notices | Left `ADMIN_NOTICE` auto-broadcast unimplemented because notifications require a concrete `receiverId` |
| Favorites guidance | Kept legacy like-based `getFavorites`; documented Wishlist APIs as the saved/favorite UX source |
| Validation results | API and batch TypeScript validations plus build passed |

## Latest Phase: Backend Hardening Pass

| Area | Completed Change |
| --- | --- |
| Member security | Regular member updates now strip self-submitted `memberType` and `memberStatus`; regular/admin password updates hash `memberPassword` through the shared auth hashing helper |
| Comment hierarchy | `getComments` now returns top-level comments by default and only replies when `parentCommentId` is supplied, preserving existing pagination |
| Social likes | Tour, member, and board-article like mutations now reject self-likes with clear `BadRequestException` messages while preserving valid like notifications |
| Demo payments | `createPayment` now creates the internal demo payment and immediately reuses the payment-success workflow to mark it paid, confirm the booking, set `paidAt`/`transactionId`, and notify the member |
| Admin notices | `createNoticeByAdmin` now broadcasts `ADMIN_NOTICE` notifications to all active members using batched notification insertion and existing notification fields |
| Lifecycle consistency | Existing booking and payment lifecycle methods were preserved while centralizing payment success behavior |
| Tests | Added focused service specs for password hashing, comment hierarchy, self-like prevention, demo payment success, admin payment lifecycle methods, and admin notice broadcast |
| Validation results | Focused hardening Jest specs, API and batch TypeScript validations, and full build passed |

## Validation Status

| Check | Command | Status |
| --- | --- | --- |
| API typecheck | `npx tsc -p apps/gotrip-api/tsconfig.app.json --noEmit` | Passed |
| Batch typecheck | `npx tsc -p apps/gotrip-batch/tsconfig.app.json --noEmit` | Passed |
| Full build | `npm run build` | Passed |
| Default Jest suite | `npm test -- --runInBand` | No tests found by current Jest regex |
| Focused auth/tour specs | `npx jest apps/gotrip-api/src/components/tour/tour.service.spec.ts apps/gotrip-api/src/components/auth/guards/roles.guard.spec.ts --runInBand` | Passed |
| API e2e smoke | `npm run test:e2e` | Blocked by MongoDB SRV DNS/network `ECONNREFUSED` |

## Remaining Work

| Area | Next Step |
| --- | --- |
| Data | Migrate existing `properties` documents into `tours` with curated tour defaults |
| Frontend | Update GraphQL documents and UI adapters to call current GoTrip operations directly |
| Tests | Add behavior tests around tour CRUD, saved/visited tours, comments/ratings, bookings, payments, wishlists, notifications, notices, and batch ranking |

## 2026-06-09 - Frontend Tour Migration Pass

Completed an incremental GoTrip frontend migration pass in `GoTrip-next` while preserving the existing Next.js/Apollo architecture and keeping legacy property files as compatibility scaffolding.

Implemented:
- Added GoTrip tour, destination, schedule, booking, payment, wishlist, notification, notice, and shared counter/liked frontend types.
- Added schema-verified Tour, Destination, Wishlist, TourSchedule, Booking, Payment, Notification, Notice, and admin Agent Request GraphQL documents.
- Added primary public `/tour` and `/tour/detail` routes.
- Converted `/property` and `/property/detail` into compatibility wrappers that redirect users to tour routes.
- Migrated homepage tour discovery sections to `getTours` and added a destination-backed tour header filter.
- Migrated guide detail listings from property APIs to tour APIs.
- Added mypage tour surfaces: Add Tour, My Tours, Saved Tours through Wishlist, and Recently Viewed Tours.
- Added signup-time Guide/Operator request fields and mypage display of `agentRequestStatus`, request message, experience, and verification state.
- Replaced admin property management screen content with Tour Management while keeping `_admin/properties` as a compatibility URL.
- Added admin Guide/Operator request management using `getAgentRequestsByAdmin` and `reviewAgentRequestByAdmin`.
- Connected public CS notices to `getNotices`.
- Preserved BoardArticle/community routes and explicitly set article comments to `CommentGroup.ARTICLE`.

Validation:
- `yarn tsc --noEmit` passed.
- `yarn build` passed.

Notes:
- Legacy property files were not removed. They remain until all imports are migrated and the removal pass can be validated separately.
- Booking, payment, and notification GraphQL documents/types are present for staged UI integration, but full booking/payment/notification UX is deferred.

## 2026-06-09 - Frontend Branding Refresh

Completed a visible GoTrip branding cleanup in `GoTrip-next` without changing Apollo documents, GraphQL operations, route compatibility wrappers, or backend integration.

Implemented:
- Replaced the existing Nestar SVG logo assets at the current logo paths with GoTrip travel-mark SVGs.
- Updated active layout metadata, document SEO text, footer branding, community branding, and visible mobile placeholders from Nestar/property language to GoTrip travel-tour language.
- Updated user-facing locale labels so active translated navigation and search copy refer to tours, guides, destinations, and travelers.
- Updated visible guide/operator labels while preserving backend `MemberType.AGENT` and existing GraphQL operation names.

Validation:
- `yarn tsc --noEmit` passed.
- `yarn build` passed.

## 2026-06-09 - Frontend Homepage Premium Travel UX Refresh

Completed a premium GoTrip homepage UX pass in GoTrip-next while preserving the existing Next.js Pages Router, Apollo/GraphQL documents, backend integration, route structure, compatibility routes, and booking/payment business logic.

Implemented:
- Added framer-motion for homepage entrance animations, scroll reveals, card hover lift, and tap micro-interactions.
- Redesigned the homepage hero with travel-focused copy, primary tour/guide CTAs, compact trip stats, and a responsive search-first mobile hero.
- Upgraded the tour search panel with restrained glassmorphism, keyword/category/location/destination filters, Enter-to-search support, and the existing tour query-param navigation behavior.
- Added a destination discovery strip using existing getDestinations data and links to filtered tour results.
- Refined the header navigation with a sticky glass treatment, active route states, improved login/profile affordances, notification styling, and cleaned scroll listener lifecycle.
- Upgraded featured tour sections and tour cards with premium image treatment, travel metadata, clearer wishlist/like controls, and stronger Check availability CTAs.
- Scoped TypeScript validation away from local agent skill example folders by excluding skills and .agents from the frontend tsconfig source set.

Validation:
- yarn tsc --noEmit passed.
- yarn build passed.

Notes:
- GraphQL documents, Apollo integration, backend URLs, route names, MemberType roles, compatibility routes, booking logic, and payment logic were not changed.

## 2026-06-12 - Frontend Premium GoTrip UI Completion Pass

Completed a broader GoTrip frontend UI/UX implementation pass in `GoTrip-next` using Stitch, ZIP design references, and the GoTrip navbar screenshot as visual direction while preserving the existing Next.js Pages Router, Apollo/GraphQL integration, backend operations, and compatibility routes.

Implemented:
- Added a shared GoTrip theme layer with light/dark CSS variables, premium travel surfaces, glass utilities, responsive card/button/empty states, and reduced-motion handling.
- Rebuilt the shared desktop navbar as a premium dark glass navigation surface and added notification dropdown, language switcher, theme support, and mobile bottom navigation.
- Added dedicated destination routes for listing and detail, using existing destination GraphQL operations and destination-based tour discovery links.
- Added homepage destination highlights backed by `getDestinations` and lazy-loaded destination imagery.
- Upgraded tour detail booking flow so schedule selection prepares a draft first, then review creates a pending booking with the verified `createBooking` payload, and payment uses the verified `createPayment` payload.
- Added mypage booking, payment, and notification center panels using existing GraphQL operations only.
- Added an admin dashboard using existing admin totals only and TODO notes for unavailable aggregate metrics.
- Improved community/mobile/member/about visible UI copy and removed visible real-estate terminology from active GoTrip surfaces while preserving internal compatibility keys.
- Added Uzbek locale readiness and kept English, Korean, Russian, and Uzbek in the i18n config.

Validation:
- `yarn tsc --noEmit` passed.
- `yarn build` passed.
- `yarn lint` could not run because `next lint` prompted for first-time ESLint configuration.
- Local HTTP smoke checks returned `200 OK` for `/`, `/destination`, `/destination/detail`, `/tour`, `/tour/detail`, `/community`, `/mypage`, and `/_admin`.

Notes:
- No new GraphQL operations were created.
- Backend limitations remain for member email hydration and admin aggregate analytics such as revenue totals, conversion rates, cancellation ratios, and time-series charts.

## 2026-06-19 - Frontend Admin Route And Theme Cleanup

Completed a small `GoTrip-next` cleanup pass without changing backend contracts, business logic, or page designs.

Implemented:
- Normalized the tour-backed admin inventory route from `/_admin/properties` to `/_admin/tours` while keeping `/_admin/properties` as a compatibility redirect.
- Updated admin menu/dashboard links so Tours, Bookings, and Payments route to the tour management screen.
- Removed unused legacy admin property GraphQL documents while preserving public legacy property documents that are still imported by compatibility components.
- Aligned the MUI primary color with GoTrip blue and added missing GoTrip theme token aliases for primary, deep-ocean, on-background, slate text, and glass surface.

Validation:
- `yarn tsc --noEmit` passed.

## 2026-06-20 - Frontend Auth Cinematic Redesign

Completed a focused `/account/join` redesign in `GoTrip-next` using the Stitch login and signup cinematic luxury screens as the primary visual reference.

Implemented:
- Replaced the mobile `LOGIN MOBILE` placeholder with the same responsive login/signup UI used across mobile, tablet, and desktop.
- Added a premium travel background, deep-ocean brand panel, glassmorphic auth card, blue/gold tabs and focus states, and accessible labeled form controls.
- Added Framer Motion entrance, tab, guide-request reveal, submit press, and subtle background motion with reduced-motion support.
- Preserved auth helper calls, GraphQL operation names, signup payload names, `MemberType.USER` signup behavior, access token handling, and referrer redirects.
- Added a minimal `PRODUCT.md` for local design-skill context.

Validation:
- `yarn tsc --noEmit` passed.

## 2026-06-20 - Frontend Mypage Profile And Wishlist Redesign

Completed a focused `myProfile` and `savedTours` redesign in `GoTrip-next` using the Stitch profile and wishlist screens as visual references while preserving backend contracts and existing mypage routing.

Implemented:
- Replaced the `MY PROFILE PAGE MOBILE` placeholder with a responsive premium traveler profile UI across mobile, tablet, and desktop.
- Added a refined avatar/upload area, profile stats, guide request status display, accessible form labels, inline error messaging, submit loading state, and reduced-motion-aware Framer Motion entrances.
- Rebuilt Saved Tours as a wishlist-backed premium tour card surface using `getMyWishlist` and `toggleWishlist` only, with loading skeletons, empty/error states, image-led cards, remove-from-wishlist controls, and mobile horizontal card motion.
- Added scoped responsive mypage styling using GoTrip theme tokens without touching bookings, payments, notifications, admin, community, or tour detail logic.

Validation:
- `yarn tsc --noEmit` passed.
- Placeholder/search checks passed for mypage profile and saved-tour wishlist contracts.
- Local HTTP smoke checks returned `200 OK` for `/mypage?category=myProfile` and `/mypage?category=savedTours`.

## 2026-06-20 - Community Journal And Notices Redesign

Completed a focused public Community and CS/Notices redesign in `GoTrip-next` using the Stitch Luxury Journal and Platform Notices references while preserving existing routes and backend contracts.

Implemented:
- Rebuilt `/community` as a responsive GoTrip Journal with an editorial hero, category filtering for `FREE`, `RECOMMEND`, `NEWS`, and `HUMOR`, featured-first article cards, loading/error/empty states, and reduced-motion-aware Framer Motion.
- Rebuilt `/community/detail` as a responsive journal article view with preserved BoardArticle likes, `CommentGroup.ARTICLE`, comment creation, and owner-only comment update/delete actions.
- Reworked `/cs` into a category-based help and notices center for `FAQ`, `TERMS`, and `INQUIRY`, retaining `tab=notice` compatibility and adding in-route notice detail via `noticeId` with the existing `getNotice` query.
- Added premium responsive Community/CS styling using GoTrip theme tokens, accessible focus states, card hover/image motion, and a local FAQ fallback module.

Validation:
- `yarn tsc --noEmit` passed.
- Local HTTP smoke checks returned `200 OK` for Community detail and all planned CS tab/detail URLs.
- No GraphQL operation, enum, DTO, auth, route, booking/payment, admin, agent, or notification contract changes were made.

## 2026-06-20 - Agent Hub Dashboard Refresh

Implemented a focused agent-only mypage dashboard pass using the Stitch Agent Hub reference.

- Rebuilt `myTours` into an operator hub with tour KPIs, status filters, inventory cards, schedule-health signals, loading/empty/error states, and an `UPDATE_TOUR` edit dialog.
- Rebuilt `addTour` into a responsive portfolio-intake form while preserving the `CREATE_TOUR` payload and current tour enums.
- Added an explicit managed-booking unavailable panel because no verified `GET_AGENT_BOOKINGS` contract exists in the frontend or migration docs.

Validation: `yarn tsc --noEmit` passed.


## 2026-06-20 - Final Public Tour Polish

Completed a scoped `/tour` and `/tour/detail` refinement using the Stitch Tour Inventory and Tour Details references.

- Reworked the public inventory into a desktop filter-sidebar layout with a compact mobile filter control, while keeping existing inquiry filters, URL hydration, search, sort, and pagination behavior.
- Improved tour-card availability and operator context while keeping social likes and Wishlist saves as separate actions.
- Wired existing `checkWishlist` state into tour detail, refetching it after `toggleWishlist`; added confirmed comment `rating` selection and read-only review ratings.
- Kept schedule selection, booking creation, payment-request flow, `CommentGroup.TOUR`, and `WishlistGroup.TOUR` unchanged; added concise review/schedule retry states and reduced-motion-aware visual polish.

Validation:
- `yarn tsc --noEmit` passed.
- `git diff --check` passed.

## 2026-06-20 - Admin Platform Control Redesign

Implemented the focused admin control-center redesign using the Stitch Platform Control reference.

- Reworked admin navigation, user administration, agent-request review, tour inventory, community moderation, and notice management into responsive operational surfaces with desktop tables and mobile cards.
- Replaced static notice mock rows with live `getAllNoticesByAdmin` data and the existing notice update/delete mutations.
- Added status badges plus loading, empty, error, and retry states while retaining existing admin filters, pagination, permissions, and action handlers.
- Used reduced-motion-aware Framer Motion entrances and GoTrip control-center styling without introducing analytics or new GraphQL documents.

Validation: `yarn tsc --noEmit` passed.

## 2026-06-20 - Final Homepage Polish

Completed a homepage-only refinement using the Stitch GoTrip Premium Travel Home reference.

- Strengthened the cinematic deep-ocean hero and destination-backed discovery controls while preserving existing search URLs and routes.
- Added explicit loading, empty, and retryable error states across featured tours, destinations, guides, Journal, and the new live Notices preview; fallback media remains image resilience only.
- Kept existing tour social-like and Wishlist actions independent, and preserved `GET_TOURS`, `GET_DESTINATIONS`, `GET_AGENTS`, `GET_BOARD_ARTICLES`, and `GET_NOTICES`.
- Applied responsive homepage-only visual polish, visible focus states, restrained motion, and reduced-motion support without changing public-page architecture or backend contracts.

Validation:
- `yarn tsc --noEmit` passed.
- `git diff --check` passed.

## 2026-06-20 - P0 Mobile Placeholder Removal

Completed a focused responsive repair for active guide, mypage, and member surfaces in GoTrip-next.

- Replaced mobile placeholder branches with the existing functional guide list/detail, guide cards, reviews, article, editor, follower, and following UI trees.
- Added narrowly scoped mobile reflow rules for guide controls, cards, reviews, mypage/member content, follow cards, and the existing article editor.
- Preserved existing Apollo operations, routes, roles, comments, follows, likes, and article creation behavior; inactive property compatibility placeholders remain outside this pass.

Validation:
- yarn tsc --noEmit passed.
- git diff --check passed.
- Local route shells returned 200 OK for the affected guide, mypage, and member URLs.

## 2026-06-21 - P1 Admin Route Honesty

Completed a focused admin safety pass in GoTrip-next.

- Kept dashboard totals backend-backed while limiting navigation to real admin routes; destination, booking, and payment cards now clearly show unavailable states instead of misleading links.
- Replaced mock FAQ and inquiry administration with protected unavailable pages that direct administrators to live Notice management and its FAQ, TERMS, and INQUIRY categories.
- Removed the inactive FAQ entry from Help Center navigation while preserving direct FAQ and inquiry routes for compatibility.

Validation:
- yarn tsc --noEmit passed.
- git diff --check passed.
- /_admin, /_admin/cs/faq, and /_admin/cs/inquiry returned 200 OK in the local smoke check.

## 2026-06-21 - Active Surface Accessibility Pass

Completed a targeted accessibility pass in GoTrip-next.

- Added names and native button semantics to active header, chat, guide, community, and mypage icon controls.
- Labelled active review, chat, and comment-edit fields; existing admin search and tour controls were retained.
- Made configured footer destinations real links and marked unavailable footer/newsletter capabilities as disabled or decorative without adding backend subscriptions.
- Added GoTrip blue focus-visible treatment across active desktop, mobile, and admin shells.

Validation:
- yarn tsc --noEmit passed.
- git diff --check passed.
- Public, mypage, and admin route shells returned 200 OK in the local smoke check.

## 2026-06-21 - Frontend Phase 1 Legacy Property Cleanup

Completed the safe deletion phase for unreachable Property-era frontend scaffolding.

- Removed unused Property components, types, enums, styles, configuration exports, and their obsolete GraphQL documents.
- Preserved `/property`, `/property/detail`, and `/_admin/properties` compatibility routes; kept active MemberProperties and legacy mypage/member category aliases unchanged.
- Removed only dead homepage/mobile Property selectors; active tour, wishlist, and recently viewed tour flows remain on their tour-backed operations.

Validation:
- `git diff --check` passed.
- Legacy-document and import scans passed.
- Compatibility route smoke checks returned `200 OK`.
- `yarn tsc --noEmit` remains blocked by the pre-existing `TS2590` union-complexity error in `libs/components/admin/community/CommunityArticleList.tsx`.

## 2026-06-21 - P1 Guide, FAQ, and About Correctness Hardening

Completed a focused correctness pass without changing GraphQL documents, DTOs, enums, routes, or backend contracts.

- Corrected guide-profile review authentication so guests receive the existing login-required alert and signed-in non-owners can submit comments.
- Fixed guide-card detail links and added an accessible guide-search label.
- Replaced the local FAQ fallback with typed travel, booking, traveler, guide, account, community, and support guidance.
- Removed unsupported About-page metrics, partner claims, stock contact details, and nonfunctional actions; added factual mobile capability and Help Center support content.

Validation:
- `yarn tsc --noEmit` passed.
- `git diff --check` passed.
- `/agent`, `/agent/detail`, `/cs?tab=faq`, and `/about` returned `200 OK` in local smoke checks.

## 2026-06-22 - Frontend Phase 2 Property-to-Tour Naming Migration

Completed the active frontend naming migration while preserving legacy deep links and backend compatibility boundaries.

- Renamed the tour-backed member inventory surface and stylesheet from Property to Tour terminology, including its query-local names and DOM selectors.
- Made `/member` canonicalize missing or legacy `category=properties` URLs to `category=tours` without losing member query parameters.
- Canonicalized legacy mypage categories (`addProperty`, `myProperties`, `myFavorites`, and `recentlyVisited`) to their Tour equivalents while retaining direct-link compatibility.
- Removed only unreferenced Property-era UI helpers, selectors, and locale keys; retained redirect routes, enum aliases, JWT/data fallbacks, and static legacy assets.

Validation:
- `yarn tsc --noEmit` passed.
- `git diff --check` passed.

## 2026-06-22 - Agent Tour Schedule Management

Completed schedule management within the existing Agent Hub at `mypage?category=myTours`.

- Added an owned-tour schedule dialog with query loading, empty, error/retry, desktop table, and mobile card states.
- Added schedule creation, reservation-safe editing, and confirmed deletion using the existing agent schedule operations only.
- Kept reserved seats read-only, derives `FULL` from capacity, validates dates, prices, and capacity client-side, and refreshes both schedules and agent tour inventory after changes.
- Preserved existing agent role/ownership enforcement, tour editing, and booking/payment lifecycle behavior.

Validation:
- `yarn tsc --noEmit` passed.
- `git diff --check` passed.

## 2026-06-22 - Admin Notice Create/Edit Completion

Completed the live admin notice authoring workflow at `/_admin/cs/notice` using the existing notice operations only.

- Added create and full edit dialogs with category, optional create status, title, and content validation, loading states, and inline save errors.
- Added accessible edit controls to desktop and mobile notice rows while preserving status update, deletion, filtering, pagination, and admin permission behavior.
- Added scoped responsive control-center styling for the editor without changing public CS surfaces or GraphQL contracts.

Validation:
- `yarn tsc --noEmit` passed.
- `yarn build` passed.
- `git diff --check` passed.

## 2026-06-22 - Admin Destination CRUD

Completed the live destination administration surface at `/_admin/destinations` using the existing destination operations only.

- Added responsive destination inventory controls with status, country, city, and text filters; desktop tables and mobile cards show live destination data, image resilience, dates, and soft-delete state.
- Added validated create and edit dialogs for backend-confirmed destination fields, including newline-separated existing image paths or URLs; deleted records remain read-only because the backend rejects further updates.
- Linked the existing backend-backed Destinations dashboard total and admin navigation to the new route without changing public destination pages or backend contracts.

Validation:
- `yarn tsc --noEmit` passed.
- `yarn build` passed.
- `git diff --check` passed.

## 2026-06-22 - Admin Booking And Payment Management

Completed live booking and payment operations at `/_admin/bookings` and `/_admin/payments` using only the existing admin contracts.

- Added responsive table/mobile-card management surfaces with backend-supported filters, pagination, loading, empty, error, and retry states.
- Restricted booking controls to `PENDING → CONFIRMED`, `CONFIRMED → COMPLETED`, and confirmed cancellation with an administrator-entered reason.
- Restricted payment controls to pending success/failure/cancel actions and paid refund actions; payment success requires an internal transaction reference, and all terminal records are read-only.
- Linked the existing backend-backed dashboard totals and admin navigation to the new routes without changing checkout, mypage, auth, or backend lifecycle behavior.

Validation:
- `yarn tsc --noEmit` passed.
- `yarn build` passed.
- `git diff --check` passed.

## 2026-06-23 - Admin Notifications Audit And Comment Moderation

Completed two backend-faithful admin audit surfaces without changing notification generation or public comment flows.

- Added read-only `/_admin/notifications` with supported status, type, group, receiver, and member filters plus responsive audit rows and pagination.
- Added target-scoped `/_admin/comments`, requiring the existing comment group and target ID query shape; it shows live comments and supports confirmed permanent removal through the existing admin mutation.
- Added Audit navigation entries, kept comments target-scoped because no global admin comment inquiry exists, and retained all public/user comment behavior.

Validation:
- `yarn tsc --noEmit` passed.
- `yarn build` passed.
- `git diff --check` passed.

## 2026-06-25 - Final Migration-Seam Cleanup And Polish

Completed a strict final frontend cleanup pass for visible GoTrip migration seams.

- Deleted an unimported legacy mypage Article component and removed orphan real-estate room/filter selectors plus the unused `Home / For Rent` locale key.
- Replaced the `/property` compatibility banner with an existing travel destination asset while preserving `/property`, `/property/detail`, and `/_admin/properties` redirects.
- Reordered MyPage navigation around traveler tasks first, added missing mobile links, and kept Agent Hub links role-gated for approved agents.
- Clarified public CS notices with an All Notices control, support-oriented Inquiry copy, FAQ fallback only when backend FAQ notices are empty, and admin helper copy explaining notice categories.

Validation:
- `yarn tsc --noEmit` passed.
- `yarn build` passed.
- `git diff --check` passed.
- Targeted legacy seam scan returned no matches.
- Temporary dev-server smoke checks returned `200 OK` for the requested compatibility, MyPage, CS, and admin notice route shells.

## 2026-06-25 - Agent Booking And Payment Hub

Completed live agent booking and payment visibility inside the existing Agent Hub.

- Added agent booking list/detail and status mutation documents for the backend-confirmed agent contracts only.
- Replaced the previous unavailable booking panel with responsive booking management and read-only payment records inside `mypage?category=myTours`.
- Restricted booking actions to backend-supported `PENDING -> CANCELLED` and `CONFIRMED -> COMPLETED`; payment records remain read-only with no gateway behavior.
- Preserved public checkout, admin booking/payment pages, mypage traveler booking/payment pages, routes, DTOs, enums, and lifecycle behavior.

Validation:
- `yarn tsc --noEmit` passed.
- `yarn build` passed.
- `git diff --check` passed.
- Agent operation scan confirmed the new documents and Agent Hub usage.

## 2026-06-27 - Final Active Property Cleanup

Completed a narrow active-source cleanup for remaining GoTrip property migration seams.

- Replaced active real-estate/home/garden icon references with existing travel-friendly discovery/review icons.
- Renamed internal compatibility redirect component identifiers while preserving `/property`, `/property/detail`, and `/_admin/properties` routes.
- Removed unused mock admin CS list components and unreferenced property-era images/icons/static folders.
- Preserved `category=properties` alias handling, `memberProperties` JWT/data fallback, `CommentGroup.PROPERTY`, `ViewGroup.PROPERTY`, GraphQL documents, backend contracts, package metadata, and lock files.

Validation:
- `yarn tsc --noEmit` passed.
- `yarn build` passed.
- `git diff --check` passed.
- Targeted scans show no remaining property-named static assets or active real-estate image references; remaining source hits are compatibility/fallback/manual package-name items only.

## 2026-06-27 - Full Light/Dark Mode Support

Completed the GoTrip frontend light/dark mode foundation without changing GraphQL documents, routes, auth, or backend contracts.

- Added a persisted color-mode provider with system preference fallback, document data-theme syncing, and a pre-hydration theme script.
- Switched MUI to a mode-aware theme while preserving the existing light palette and adding dark paper, input, text, action, and divider colors.
- Added accessible theme toggles to the public desktop header, mobile bottom navigation, and admin toolbar.
- Expanded GoTrip theme tokens and added final desktop/mobile dark-mode cascade layers for active public, mypage/member/agent, tour, destination, community, CS, auth, footer, chat-adjacent shell, and admin surfaces.
- Simplified two admin MUI-heavy pages with typed render helpers after TypeScript/build exposed TS2590 union-complexity blockers; data operations and actions are unchanged.

Validation:
- `yarn tsc --noEmit` passed.
- `yarn build` passed with existing Yarn cache/global-folder warnings, a Browserslist data warning, and existing react-i18next prerender warnings.
- `git diff --check` passed before the completion-log append.
- Local route smoke checks returned `200 OK` for `/`, `/tour`, `/tour/detail?id=smoke`, `/destination`, `/community?articleCategory=FREE`, `/cs?tab=faq`, `/account/join`, `/mypage`, and `/_admin`; rendered HTML includes the pre-hydration theme script and desktop theme toggle markup.

## 2026-06-27 - Frontend Visual Convergence Pass

- Tightened active GoTrip frontend surfaces toward Stitch visual references with a cinematic home hero image composition, shared glass and deep-ocean surface treatment, refined guide, account, admin, and CS rhythm, and stronger desktop/mobile responsive card proportions.
- Replaced destination fallback-as-live-content behavior with backend-truthful empty/error states while keeping local travel imagery as media fallback only.
- Preserved all GraphQL documents, DTOs/enums, auth/role logic, booking/payment lifecycle, wishlist/likes behavior, routes, and compatibility redirects.
- Validation: yarn tsc --noEmit, yarn build, and git diff --check passed; representative dev routes returned 200 on localhost:3003.

## 2026-06-27 - MCP-First App-Wide Stitch Convergence

Completed an MCP-first visual convergence pass across active GoTrip frontend surfaces using Stitch project projects/12851649234565630887 as the source of truth.

- Reworked the shared home hero into the Stitch full-bleed cinematic composition with centered editorial copy, trending chips, and a floating glass discovery panel.
- Upgraded shared visual language for navigation, search panels, cards, destination grids, tour detail galleries, CS notices, wishlist cards, footer rhythm, light/dark contrast, and mobile responsiveness.
- Added a live featured-notice composition on public CS and image-led overlay cards for real wishlist data while preserving all existing Apollo operations, routes, auth, booking/payment lifecycle, wishlist/likes separation, comments, localization, and compatibility redirects.

Validation:
- yarn tsc --noEmit passed.
- yarn build passed with existing Yarn cache/global-folder, Browserslist, and react-i18next prerender warnings.
- git diff --check passed.

## 2026-06-27 - Stitch-Accurate Home Rebuild

Rebuilt the GoTrip Home composition against Stitch screen abd2c71a791341c6a086194cbe25c4a0 while preserving Home GraphQL operations and route behavior. The pass aligned the cinematic hero/search panel, Curated Destinations, Elite Tour Collection, Dedicated Concierge, Voices of Exploration, and Concierge Network/Luxury Journal sections; folded live Journal and Notices previews into the lower Home block; retained disabled newsletter honesty; and added responsive light/dark Home styling plus restrained Framer Motion behavior. Validation passed: yarn tsc --noEmit, yarn build, git diff --check, and local / smoke check.

## 2026-06-27 - Stitch Split-Hero Home Rebuild

Replaced the GoTrip Home hero with the user-confirmed Stitch split-hero contract while preserving existing Home operations and routing. The new hero uses a full-viewport cinematic background, dark overlay, soft bottom transition, left-side headline/chips/CTA/search flow, right-side collage with one large image, two stacked images, and a floating premium card, plus rebuilt native search-panel UI over the existing GET_DESTINATIONS and /tour query behavior. Added terminal desktop/mobile Home styles for the split hero, collage, search panel, and transition into Curated Destinations. Validation passed: yarn tsc --noEmit, yarn build, git diff --check, and local / route smoke check.

## 2026-06-27 - Navbar And Footer Stitch Alignment

Completed a focused global shell alignment pass for GoTrip navigation and footer.

- Rebuilt the desktop navbar around the Stitch-style glass surface, centered public navigation, authenticated-only My Page visibility, resilient GoTrip logo fallback, and preserved notification/profile/language/theme controls.
- Reworked the footer into a deep-ocean brand, company, support, and global column layout with honest unavailable links and no unsupported newsletter subscription form.
- Added terminal desktop/mobile shell styles for spacing, focus states, touch targets, light/dark readability, and responsive footer stacking without changing page content or backend contracts.

Validation:
- `yarn tsc --noEmit` passed.
- `yarn build` passed with existing Yarn cache/global-folder, Browserslist, and react-i18next prerender warnings.
- `git diff --check` passed.

## 2026-07-19 - Scope Reduction To Catalog And Community

Removed the booking, payment, wishlist, destination, and tour-schedule feature areas from both applications. GoTrip is now a tour catalog and community platform.

Backend removals:
- Modules, resolvers, and services: `booking`, `payment`, `destination`, `tour-schedule`, `wishlist`.
- DTOs under `libs/dto/`: `booking`, `payment`, `destination`, `tour-schedule`, `wishlist`.
- Schemas: `Booking.model.ts`, `Payment.model.ts`, `Destination.model.ts`, `TourSchedule.model.ts`, `Wishlist.model.ts`.
- The `BookingStatus` enum and the `destinationId` field on `Tour`.
- Batch destination ranking; `gotrip-batch` now runs `batchRollback`, `batchTopTours`, and `batchTopAgents` only.

Frontend removals:
- `mypage/MyBookings.tsx`, `mypage/MyPayments.tsx`.
- `admin/bookings/`, `admin/payments/`, `admin/destinations/`.
- `common/DestinationCard.tsx`, `homepage/DestinationHighlights.tsx`, and related Apollo documents.

Remaining backend modules: `auth`, `member`, `tour`, `comment`, `like`, `view`, `follow`, `board-article`, `notice`, `notification`.

Saved tours reverted to the like-based mechanism (`likeTargetTour`, `getFavoriteTours`), superseding the earlier wishlist-over-likes decision.

The `bookings`, `payments`, `wishlists`, `destinations`, and `tourSchedules` MongoDB collections still exist and are now unused. See `NEXT_STEPS.md` for the drop task.

## 2026-07-21 - Tour Schema And DTO Fixes

- Removed a duplicated `@Field(() => String)` decorator above `tourTitle` in `libs/dto/tour/tour.ts`.
- Added `memberId` to the compound unique index in `schemas/Tour.model.ts`. The index was `{ tourCategory, tourLocation, tourTitle, tourPrice }`, which blocked two different agents from listing comparable tours. It is now scoped per agent.
- Realigned `AGENTS.md`, `BACKEND_MIGRATION.md`, `DECISIONS.md`, `FRONTEND_MIGRATION.md`, and `NEXT_STEPS.md` with the reduced scope.

## 2026-07-22 - Backend Security And Business-Logic Hardening

Audited the backend and fixed the critical and medium findings.

Critical (security):
- Upload path traversal / stored XSS: `imageUploader`/`imagesUploader` now reject any `target` outside the `member|tour|article` allowlist and derive the file extension from the trusted mimetype instead of the client filename (`libs/config.ts`, `member.resolver.ts`).
- Stale-token authorization: added `AuthService.retrieveAuthMember`, which re-reads the member from the database and rejects blocked/deleted accounts. `AuthGuard`, `RolesGuard`, and `WithoutGuard` use it, so role/status changes take effect immediately instead of living inside the 30-day token. `AuthModule` now registers the Member model.
- WebSocket PII leak: `socket.gateway.ts` now emits only `_id`, `memberNick`, `memberImage` (via `toPublicMember`) instead of the full member payload (phone, address, role, warnings).

Medium (business logic and validation):
- Tour status is reversible again: `updateTour`/`updateTourByAdmin` edit any non-deleted tour and adjust `memberTours` by status transition (listed = ACTIVE/PAUSED), so SOLD_OUT/PAUSED tours can be re-activated without corrupting the counter.
- Comment target validation: `createComment` rejects comments whose tour/article/member target does not exist or is not active (no more orphan comments or 500s).
- Comment counter sync: `removeCommentByAdmin` decrements the target's comment counter.
- Regex hardening: `escapeRegex` applied to all user-supplied `$regex` searches (tour title, member nick, notice title/content) to prevent regex injection / ReDoS.
- Pagination cap: every `*Inquiry.limit` now has `@Max(100)`.
- Validation gaps: `tourPrice` gets `@Min(1)` (no free tours); `createTour` rejects `tourMinPeople > tourMaxPeople` and `tourAvailableSeats > tourMaxPeople`; password max length raised to 30 (min kept at 5 to avoid locking out existing users).
- Config: CORS restricts to `ALLOWED_ORIGINS` in production (dev unchanged); GraphQL playground and introspection disabled in production.
- Fixed the duplicate `@InputType()` on `PeriodsRange` and `tourTitle: String` -> `string`.
- Realigned the superseded `ADMIN_NOTICE` decision in `DECISIONS.md` (the broadcast now exists in code).

Validation: API and batch `tsc --noEmit`, `npm run build`, `jest` (15 tests), and a runtime bootstrap (Nest started, MongoDB connected) all passed.

## 2026-07-22 - Minor Backend Correctness Fixes

- Saved/visited tours no longer include deleted tours: `getFavoriteTours` and `getVisitedTours` now `$match` out `tourStatus: DELETED` after the tour `$lookup` (`like.service.ts`, `view.service.ts`).
- `contactAgent` now requires an ACTIVE tour (was `findById`, any status), consistent with the public `getTour`.
- `tourImages` gets `@ArrayNotEmpty()`, so a tour can no longer be created with an empty image list.

Validation: API and batch `tsc --noEmit`, `npm run build`, `jest` (15 tests), and a runtime bootstrap all passed.
