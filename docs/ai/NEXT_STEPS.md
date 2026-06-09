# Next Steps

## Priority Order

1. Prepare a controlled data migration from `properties` to `tours`.
2. Update frontend GraphQL documents to the current GoTrip tour-based operations.
3. Add focused backend behavior tests for agent approval, tour, social, booking, payment, wishlist, notification, and ranking workflows.
4. Revisit ranking weights after production engagement data is available.
5. Implement batch expiry jobs and final cleanup in later phases.

## Data Migration

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Back up MongoDB data | Required before changing collection data |
| P0 | Migrate `properties` to `tours` | Map compatible fields and set explicit travel defaults |
| P0 | Migrate `memberProperties` to `memberTours` | Preserve existing counts before removing old field usage |
| P1 | Update likes/views/comments groups | Convert old `PROPERTY` group rows to `TOUR` if preserving engagement data |
| P1 | Backfill destination counters | Ensure existing destination rows have views, likes, comments, rating, tour count, and rank defaults |
| P1 | Backfill tour schedule statuses | Map old `SOLD_OUT` and `CANCELLED` values before production rollout |
| P1 | Backfill booking lifecycle fields | Ensure existing booking rows have traveler fields, `expiresAt`, and valid schedule references |
| P1 | Review payment rows | Ensure existing payment rows use supported payment statuses and methods |
| P1 | Review wishlist rows | Ensure existing wishlist rows use `TOUR` or `DESTINATION` groups |
| P1 | Backfill notification compatibility fields | Mirror `receiverId` into `memberId` and review optional payment/comment context ids |
| P1 | Verify ranking source counters | Confirm tour/member/destination engagement counters and wishlist rows are consistent before relying on batch ranks |

## Backend Follow-Up

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Rebuild social indexes during migration | Clean duplicate historical like/view rows before applying group-aware unique indexes in production |
| P1 | Decide favorite compatibility | Existing `getFavorites` still uses likes; frontend should migrate saved-item UX to wishlist |
| P2 | Add pending booking expiry job | Call `expirePendingBookings()` from a later batch/cron phase |
| P2 | Tune ranking weights | Adjust batch formulas after real GoTrip engagement and booking data is available |
| P2 | Expand notification coverage | Add refund/cancel, like/follow, admin notice, and notification preference workflows in later phases |

## Frontend Follow-Up

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Replace property GraphQL documents | Use `createTour`, `getTour`, `getTours`, `updateTour`, `likeTargetTour` |
| P0 | Replace field names | Use `tourCategory`, `tourStatus`, `tourLocation`, `tourDuration`, capacity, itinerary fields |
| P1 | Remove real-estate UI fields | Remove beds, rooms, square, rent, barter |
| P1 | Connect destination screens | Use `getDestinations`, `getDestination`, destination comments, and `getTours` with `destinationId` |
| P1 | Connect schedule screens | Use `Tour.schedules`, `getTourSchedules`, and agent/admin schedule mutations |
| P1 | Add booking UI | Use `createBooking`, `cancelBooking`, `getMyBookings`, and agent/admin booking views |
| P1 | Add payment UI | Use `createPayment`, user payment history, and admin payment lifecycle operations |
| P1 | Add wishlist UI | Use `toggleWishlist`, `getMyWishlist`, and `checkWishlist` instead of likes for saved items |
| P1 | Add notification UI | Use `getMyNotifications`, `markNotificationRead`, `markAllNotificationsRead`, and `deleteNotification` |
| P1 | Add notice UI | Use `getNotices` and `getNotice` for public notices/help content |

## Testing

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Keep API and batch typechecks passing | Required after every backend change |
| P0 | Keep `npm run build` passing | Required before handoff |
| P1 | Add agent approval tests | Cover USER-only signup, pending request creation, admin approve, and admin reject |
| P1 | Add social/review tests | Cover group-aware likes/views, top-level tour review rating, replies, and comment likes |
| P1 | Add destination tests | Cover active public listing/detail, admin status changes, likes, views, comments, and tour filtering by destination |
| P1 | Add schedule tests | Cover active public reads, agent ownership checks, admin mutations, and seat helper status changes |
| P1 | Add booking lifecycle tests | Cover creation seat reservation, cancellation release, agent/admin permissions, expiry, and payment-prep methods |
| P1 | Add payment tests | Cover payment creation, duplicate active payment prevention, retry after failed/cancelled attempts, admin success/failure/refund/cancel, and agent read access |
| P1 | Add wishlist tests | Cover target validation, toggle add/remove, own-list isolation, hydrated tour/destination results, and duplicate prevention |
| P1 | Add notification tests | Cover own-list isolation, read/delete behavior, admin filters, and helper notifications for agent, booking, payment, and comment flows |
| P1 | Add notice tests | Cover active public reads, admin create/update/delete, and soft-delete filtering |
| P1 | Add ranking batch tests | Cover tour/member/destination formulas, destination tour counts, successful booking counts, and wishlist counts |
| P1 | Add tour resolver/service tests | Cover create, update, list, detail, like, visited, comments |

## 2026-06-09 - Frontend Next Steps

Next frontend migration work:
- Replace remaining inactive legacy property components and imports after confirming no active route depends on them.
- Implement full tour image upload flow using `imagesUploader` target `tour`.
- Expand tour create/update UI to include itinerary, included/excluded items, language, difficulty, destination assignment, and schedule management.
- Add booking creation on tour detail from selected `scheduleId`, then connect My Bookings and My Payments screens.
- Connect notification bell to `getMyNotifications`, read/delete mutations, and unread state.
- Add admin Destination Management and connect admin Notice Management to Notice CRUD mutations.
- Add admin Booking/Payment/Notification dashboards using existing backend operations.
- Continue replacing visible legacy Nestar/property copy in older inactive components before deleting property scaffolding.
- Only remove legacy property files after all imports are migrated and both `yarn tsc --noEmit` and `yarn build` pass.

Validation required after each phase:
- `yarn tsc --noEmit`
- `yarn build`
