# Next Steps

## Priority Order

1. Run full build validation after the backend tour migration.
2. Prepare a controlled data migration from `properties` to `tours`.
3. Update frontend GraphQL documents from property operations to tour operations.
4. Implement full booking/schedule/payment/wishlist/destination resolvers and services.
5. Add focused backend behavior tests for tour and booking workflows.

## Data Migration

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Back up MongoDB data | Required before changing collection data |
| P0 | Migrate `properties` to `tours` | Map compatible fields and set explicit travel defaults |
| P0 | Migrate `memberProperties` to `memberTours` | Preserve existing counts before removing old field usage |
| P1 | Update likes/views/comments groups | Convert old `PROPERTY` group rows to `TOUR` if preserving engagement data |
| P1 | Seed destinations and schedules | Required for richer tour booking flows |

## Backend Follow-Up

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Add booking mutations | Create, confirm, cancel, complete bookings |
| P0 | Add schedule capacity logic | Keep `tourAvailableSeats`, `availableSeats`, and `reservedSeats` consistent |
| P1 | Add destination CRUD/admin APIs | Support ERD destination collection |
| P1 | Add wishlist API or retire likes-as-favorites | Current saved tours still use likes for compatibility with existing module pattern |
| P2 | Add payment workflow | Wire payment statuses to booking status transitions |

## Frontend Follow-Up

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Replace property GraphQL documents | Use `createTour`, `getTour`, `getTours`, `updateTour`, `likeTargetTour` |
| P0 | Replace field names | Use `tourCategory`, `tourStatus`, `tourLocation`, `tourDuration`, capacity, itinerary fields |
| P1 | Remove real-estate UI fields | Remove beds, rooms, square, rent, barter |
| P1 | Add booking UI | Connect to backend booking APIs once implemented |

## Testing

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Keep API and batch typechecks passing | Required after every backend change |
| P0 | Keep `npm run build` passing | Required before handoff |
| P1 | Add tour resolver/service tests | Cover create, update, list, detail, like, visited, comments |
| P1 | Add booking lifecycle tests | Cover pending, confirmed, cancelled, completed |
