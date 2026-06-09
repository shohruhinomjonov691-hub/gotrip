# Architectural Decisions

## Decision Log

| Decision | Why It Was Made | Risk | Alternative Considered |
| --- | --- | --- | --- |
| Use a breaking Tour API | The user approved replacing the real-estate property API with the GoTrip tour domain now. | Existing frontend clients using property operations must be updated. | Add compatibility wrappers for both property and tour operations. |
| Keep `MemberType` unchanged | The project explicitly requires `USER`, `AGENT`, and `ADMIN` to stay stable. | `AGENT` is still the backend owner/operator role even if UI calls it guide/operator. | Introduce a new `GUIDE` role, rejected for this phase. |
| Use `tourCategory` over ERD `tourType` | The user provided the exact category enum values and field name. | ERD labels and code use slightly different naming. | Keep `tourType`, which would conflict with user terminology. |
| Replace `properties` collection with `tours` | The ERD defines `tours` as the primary catalog collection. | Existing documents require migration before the new API can serve them. | Alias old `properties`, rejected for the breaking migration. |
| Add ERD collection schemas now | The backend should reflect destinations, schedules, bookings, wishlists, and payments. | Initial modules are schema/DI foundations, not full business workflows yet. | Delay new collections until booking API work. |
| Use Wishlist for saved tours | Saved-tour UX must use `toggleWishlist`, `getMyWishlist`, and `checkWishlist` while likes remain social/ranking engagement. | Existing legacy favorites components may still exist until the removal pass. | Continue using likes for saved tours, rejected for GoTrip frontend migration. |

## Compatibility Principles

| Principle | Effect |
| --- | --- |
| Property APIs are removed | Frontend and generated GraphQL clients must migrate to tour operations. |
| Member roles stay stable | Auth guards and role checks continue to use `MemberType.AGENT` for tour creation. |
| Data migration is explicit | Old `properties` documents are not automatically read through tour APIs. |
| Booking workflow is staged | Booking/payment/schedule schemas exist; full resolver/service behavior is next work. |

## Open Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Existing data still lives in `properties` | New tour APIs will not return old catalog documents. | Run a controlled `properties` -> `tours` data migration with curated defaults. |
| Frontend still uses old GraphQL documents | App calls will fail after backend deployment. | Update frontend queries/mutations to `getTours`, `getTour`, `createTour`, etc. |
| Booking/payment UI remains staged | Backend booking/payment modules exist, but full frontend user workflows are not complete yet. | Add tour detail booking creation, My Bookings, My Payments, and admin payment dashboards in later frontend phases. |
| Lint dependency issue may remain | ESLint may still fail before source analysis. | Fix `typescript-eslint` package/config separately before relying on lint. |

## 2026-06-09 - Frontend Compatibility Decisions

- Keep `/property` and `/property/detail` as temporary compatibility entrypoints that redirect to `/tour` and `/tour/detail` during the first migration wave.
- Keep `_admin/properties` as a temporary compatibility URL, but use it for Tour Management data and UI.
- Use backend `MemberType.AGENT` unchanged while labeling the role as Guide/Operator in frontend copy.
- Use signup-time fields `wantsToBecomeAgent`, `agentRequestMessage`, and `agentExperience` for initial Guide/Operator requests until a separate verified self-service request mutation exists.
- Use Wishlist for saved tours and reserve Likes for social engagement/ranking.
- Preserve legacy property files until all imports are migrated and TypeScript/build validation passes.
