# Next Steps

## Priority Order

1. Prepare a controlled data migration from `properties` to `tours`.
2. Update frontend GraphQL documents to the current GoTrip tour-based operations.
3. Add focused backend behavior tests for agent approval, tour, social, notification, and ranking workflows.
4. Revisit ranking weights after production engagement data is available.
5. Drop the now-unused `bookings`, `payments`, `wishlists`, `destinations`, and `tourSchedules` collections after backup.

## Data Migration

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Back up MongoDB data | Required before changing collection data |
| P0 | Migrate `properties` to `tours` | Map compatible fields and set explicit travel defaults |
| P0 | Migrate `memberProperties` to `memberTours` | Preserve existing counts before removing old field usage |
| P1 | Update likes/views/comments groups | Convert old `PROPERTY` group rows to `TOUR` if preserving engagement data |
| P1 | Backfill notification compatibility fields | Mirror `receiverId` into `memberId` and review optional comment context ids |
| P1 | Verify ranking source counters | Confirm tour and member engagement counters are consistent before relying on batch ranks |
| P2 | Drop out-of-scope collections | Back up, then drop `bookings`, `payments`, `wishlists`, `destinations`, and `tourSchedules` |

## Backend Follow-Up

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Rebuild social indexes during migration | Clean duplicate historical like/view rows before applying group-aware unique indexes in production |
| P2 | Tune ranking weights | Adjust batch formulas after real GoTrip engagement and booking data is available |
| P2 | Expand notification coverage | Add admin notice broadcast/recipient selection and notification preference workflows in later phases |

## Frontend Follow-Up

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Replace property GraphQL documents | Use `createTour`, `getTour`, `getTours`, `updateTour`, `likeTargetTour` |
| P0 | Replace field names | Use `tourCategory`, `tourStatus`, `tourLocation`, `tourDuration`, capacity, itinerary fields |
| P1 | Remove real-estate UI fields | Remove beds, rooms, square, rent, barter |
| P1 | Keep saved tours on likes | Use `likeTargetTour` and `getFavoriteTours`; wishlist operations no longer exist |
| P1 | Add notification UI | Use `getMyNotifications`, `markNotificationRead`, `markAllNotificationsRead`, and `deleteNotification` |
| P1 | Add notice UI | Use `getNotices` and `getNotice` for public notices/help content |

## Testing

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Keep API and batch typechecks passing | Required after every backend change |
| P0 | Keep `npm run build` passing | Required before handoff |
| P1 | Add agent approval tests | Cover USER-only signup, pending request creation, admin approve, and admin reject |
| P1 | Add social/review tests | Cover group-aware likes/views, top-level tour review rating, replies, and comment likes |
| P1 | Add notification tests | Cover own-list isolation, read/delete behavior, admin filters, and helper notifications for like, follow, and comment flows |
| P1 | Add notice tests | Cover active public reads, admin create/update/delete, and soft-delete filtering |
| P1 | Add ranking batch tests | Cover tour and member rank formulas against engagement counters |
| P1 | Add tour resolver/service tests | Cover create, update, list, detail, like, visited, comments |

## 2026-06-09 - Frontend Next Steps

Next frontend migration work:
- Replace remaining inactive legacy property components and imports after confirming no active route depends on them.
- Implement full tour image upload flow using `imagesUploader` target `tour`.
- Expand tour create/update UI to include itinerary, included/excluded items, language, and difficulty.
- Connect notification bell to `getMyNotifications`, read/delete mutations, and unread state.
- Connect admin Notice Management to Notice CRUD mutations.
- Add the admin Notification dashboard using existing backend operations.
- Continue replacing inactive legacy property copy in older inactive components before deleting property scaffolding.
- Only remove legacy property files after all imports are migrated and both `yarn tsc --noEmit` and `yarn build` pass.

Completed frontend follow-up:
- Visible Nestar branding/logo cleanup in active GoTrip frontend surfaces.

Validation required after each phase:
- `yarn tsc --noEmit`
- `yarn build`
