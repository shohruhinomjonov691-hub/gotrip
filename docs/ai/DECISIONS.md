# Architectural Decisions

## Decision Log

| Decision | Why It Was Made | Risk | Alternative Considered |
| --- | --- | --- | --- |
| Use a breaking Tour API | The user approved replacing the real-estate property API with the GoTrip tour domain now. | Existing frontend clients using property operations must be updated. | Add compatibility wrappers for both property and tour operations. |
| Keep `MemberType` unchanged | The project explicitly requires `USER`, `AGENT`, and `ADMIN` to stay stable. | `AGENT` is still the backend owner/operator role even if UI calls it guide/operator. | Introduce a new `GUIDE` role, rejected for this phase. |
| Use `tourCategory` over ERD `tourType` | The user provided the exact category enum values and field name. | ERD labels and code use slightly different naming. | Keep `tourType`, which would conflict with user terminology. |
| Replace `properties` collection with `tours` | The ERD defines `tours` as the primary catalog collection. | Existing documents require migration before the new API can serve them. | Alias old `properties`, rejected for the breaking migration. |
| Add ERD collection schemas now | The backend should reflect destinations, schedules, bookings, wishlists, and payments. | Initial modules are schema/DI foundations, not full business workflows yet. | Delay new collections until booking API work. |
| Keep saved tours on likes for now | Existing favorites logic is implemented through the like module and remained reusable. | `wishlists` exists but is not yet the active saved-tour API. | Replace favorites with wishlist behavior in the same pass. |

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
| Booking modules are foundational only | Booking lifecycle is not fully user-operable yet. | Add booking/schedule/payment resolvers and tests next. |
| Lint dependency issue may remain | ESLint may still fail before source analysis. | Fix `typescript-eslint` package/config separately before relying on lint. |
