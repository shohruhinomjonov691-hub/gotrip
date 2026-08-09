# Architectural Decisions

## Decision Log

| Decision | Why It Was Made | Risk | Alternative Considered |
| --- | --- | --- | --- |
| Use a breaking Tour API | The user approved replacing the real-estate property API with the GoTrip tour domain now. | Existing frontend clients using property operations must be updated. | Add compatibility wrappers for both property and tour operations. |
| Keep `MemberType` unchanged | The project explicitly requires `USER`, `AGENT`, and `ADMIN` to stay stable. | `AGENT` is still the backend owner/operator role even if UI calls it guide/operator. | Introduce a new `GUIDE` role, rejected for this phase. |
| Use `tourCategory` over ERD `tourType` | The user provided the exact category enum values and field name. | ERD labels and code use slightly different naming. | Keep `tourType`, which would conflict with user terminology. |
| Replace `properties` collection with `tours` | The ERD defines `tours` as the primary catalog collection. | Existing documents require migration before the new API can serve them. | Alias old `properties`, rejected for the breaking migration. |
| ~~Add ERD collection schemas now~~ **SUPERSEDED 2026-07-19** | The backend should reflect destinations, schedules, bookings, wishlists, and payments. | Initial modules are schema/DI foundations, not full business workflows yet. | Delay new collections until booking API work. |
| ~~Use Wishlist for saved tours~~ **SUPERSEDED 2026-07-19** | Saved-tour UX must use `toggleWishlist`, `getMyWishlist`, and `checkWishlist` while likes remain social/ranking engagement. | Existing legacy favorites components may still exist until the removal pass. | Continue using likes for saved tours, rejected for GoTrip frontend migration. |

## Compatibility Principles

| Principle | Effect |
| --- | --- |
| Property APIs are removed | Frontend and generated GraphQL clients must migrate to tour operations. |
| Member roles stay stable | Auth guards and role checks continue to use `MemberType.AGENT` for tour creation. |
| Data migration is explicit | Old `properties` documents are not automatically read through tour APIs. |
| Booking workflow is out of scope | Booking, payment, and schedule modules were removed on 2026-07-19. There is no reservation lifecycle in the API. |

## Open Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Existing data still lives in `properties` | New tour APIs will not return old catalog documents. | Run a controlled `properties` -> `tours` data migration with curated defaults. |
| Frontend still uses old GraphQL documents | App calls will fail after backend deployment. | Update frontend queries/mutations to `getTours`, `getTour`, `createTour`, etc. |
| Unused MongoDB collections remain | `bookings`, `payments`, `wishlists`, `destinations`, and `tourSchedules` still hold data with no code behind them. | Back up, then drop them. Tracked in `NEXT_STEPS.md`. |
| Lint dependency issue may remain | ESLint may still fail before source analysis. | Fix `typescript-eslint` package/config separately before relying on lint. |

## 2026-06-09 - Frontend Compatibility Decisions

- Keep `/property` and `/property/detail` as temporary compatibility entrypoints that redirect to `/tour` and `/tour/detail` during the first migration wave.
- Keep `_admin/properties` as a temporary compatibility URL, but use it for Tour Management data and UI.
- Use backend `MemberType.AGENT` unchanged while labeling the role as Guide/Operator in frontend copy.
- Use signup-time fields `wantsToBecomeAgent`, `agentRequestMessage`, and `agentExperience` for initial Guide/Operator requests until a separate verified self-service request mutation exists.
- Use Wishlist for saved tours and reserve Likes for social engagement/ranking.
- Preserve legacy property files until all imports are migrated and TypeScript/build validation passes.

## 2026-06-14 - Backend Audit Decisions

- Keep payment internal/demo-only: admin failed payments cancel the pending booking and release seats; users create a new booking if they still want the tour.
- Keep `getFavorites` as a legacy like-based query; saved/favorite UX must use `toggleWishlist`, `getMyWishlist`, and `checkWishlist`.
- ~~Do not auto-create `ADMIN_NOTICE` notifications yet~~ **SUPERSEDED 2026-07-22**: creating a notice now fans out one `ADMIN_NOTICE` notification per active member (`notifyAdminNoticeCreated`), since each notification still needs a concrete `receiverId`. This is a simple insert-per-member broadcast; a true recipient-selection/broadcast model is still future work and does not scale to very large member counts.

## 2026-07-19 - Scope Reduction

GoTrip is now a tour catalog and community platform. The booking, payment, wishlist, destination, and tour-schedule modules were removed from both backend and frontend.

| Decision | Why It Was Made | Risk | Alternative Considered |
| --- | --- | --- | --- |
| Remove booking, payment, wishlist, destination, and tour-schedule modules | The product scope was reduced to tour discovery plus social/community features; the reservation and payment lifecycle is out of scope. | Any deployed client calling those operations breaks; documented ERD collections no longer have code behind them. | Keep the modules unused behind feature flags, rejected as dead weight. |
| Use likes for saved tours again | With the wishlist module removed, `getFavoriteTours` is the only saved-tour mechanism the backend exposes. | Reverses the earlier wishlist-over-likes decision; likes now serve both social ranking and saved-tour UX. | Keep wishlist only for saving, rejected with the module removal. |
| Rank tours and agents only | Destination ranking has no source collection after the destination module was removed. | Batch ranking no longer produces destination ranks. | Keep destination ranking against tour location strings, rejected as not equivalent. |

Superseded entries above:
- "Use Wishlist for saved tours" (Compatibility Principles / Decision Log) no longer applies.
- "Add ERD collection schemas now" no longer applies.
- "Booking workflow is staged" no longer applies; there is no booking workflow.

## 2026-07-24 - Destination Re-added as Content/Catalog Only (Booking/Payment/Schedule Still Out of Scope)

| Decision | Why It Was Made | Risk | Alternative Considered |
| --- | --- | --- | --- |
| Re-add `Destination` as an admin-managed catalog/content collection (title, gallery, stats) | The frontend's own design docs and the upcoming home-page/data-seeding task need real destination content; the 2026-07-19 removal was specifically about the booking/payment/schedule lifecycle, not destination content itself. | None to existing data/APIs — new collection, `Tour.destinationId` is optional/nullable. | Keep Destination purely as the `TourLocation` enum (status quo); rejected because it can't carry images/description/gallery/admin curation, which the seeding task needs. |
| Add `Category` and `Testimonial` as new admin-managed collections | Neither existed before in any form (not even as a removed ERD collection); both were hardcoded client-side with zero backend presence. Needed for admin-manageable homepage content. | None — fully additive, doesn't touch `TourCategory`/`BoardArticleCategory` enums or existing filtering. | — |
| Booking, Payment, and TourSchedule remain out of scope | This pass only restores destination *content*, not the reservation/payment lifecycle. Nothing in this pass reads or writes those collections. | None. | — |

This supersedes the "Unused MongoDB collections remain" open risk below **only for `destinations`** — that collection now has live application code again (a fresh, additively-designed schema, not a resurrection of the old removed one). `bookings`, `payments`, `tourSchedules`, and `wishlists` remain unused/out of scope.

## 2026-07-24 - Destination Ownership + Guide Request Workflow (Same-Day Follow-Up)

| Decision | Why It Was Made | Risk | Alternative Considered |
| --- | --- | --- | --- |
| ~~Destination is admin-managed content with no owner~~ **SUPERSEDED same day.** `Destination.memberId` is now required — exactly one owning Guide (`MemberType.AGENT`), validated server-side. | An explicit business rule requires "each Destination has exactly one Guide owner" and "a Guide can create Tours only inside Destinations they own." | A guide who is later demoted/blocked leaves their destinations "orphaned" (still valid documents, but the owner can no longer act as an agent) — no reassignment-on-demotion automation exists yet; an admin must manually reassign via `updateDestinationByAdmin`. | Auto-reassign or auto-hide a destination when its owner is demoted — rejected as unrequested scope; admin can already reassign `memberId` manually. |
| Destination CRUD (create/update/delete) stays admin-only; guides do not self-manage destinations | The business rule specifies ownership for *tour placement*, not a self-service destination-authoring flow. | If guides are later expected to create their own destinations, this will need a new self-service resolver path (not just a field). | Let guides create their own destinations directly — rejected as not requested; would also need its own moderation/approval story. |
| Add a formal `AgentRequestStatus` state machine (`NONE/PENDING/APPROVED/REJECTED`) instead of relying solely on `updateMemberByAdmin` | The business rule requires an explicit `USER → PENDING → ADMIN approval → AGENT` flow, not just "admin can set memberType." | `updateMemberByAdmin` still allows a direct admin override outside the request flow (unchanged, intentional — admins retain broad power). | Remove admin's direct override entirely, forcing all promotions through the request flow — rejected; admins commonly need to act without waiting on a member-initiated request (e.g., onboarding a partner agent). |
| Testimonial status renamed `ACTIVE/HOLD/DELETE` → `PENDING/APPROVED/REJECTED/DELETE`, with a new self-service `createTestimonial` | The business rule requires user-submitted testimonials to default PENDING and only show publicly once APPROVED — the first pass only had admin-curated, pre-approved testimonials. | None — Testimonial had no seeded data yet. | — |
