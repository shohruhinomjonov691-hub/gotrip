# Frontend Migration Plan: Nestar -> GoTrip

## Goal

Migrate the Next.js frontend from the old real-estate Nestar experience to the current GoTrip travel booking experience. The backend now exposes tour-based GoTrip GraphQL APIs.

The frontend should consume the current tour, destination, schedule, booking, payment, wishlist, notification, notice, and article APIs directly.

## Step-By-Step Plan

| Step | Task | Output |
| --- | --- | --- |
| 1 | Inventory current Next.js routes, layouts, GraphQL operations, generated types, and shared components. | Route/component map with Nestar terminology. |
| 2 | Rename brand-level UI from Nestar to GoTrip. | Header, footer, metadata, auth screens, error pages, and dashboard labels use GoTrip. |
| 3 | Update frontend GraphQL documents. | UI uses current tour/travel GraphQL operations and fields. |
| 4 | Migrate listing pages. | Property listing UI becomes tour listing UI. |
| 5 | Migrate detail pages. | Property detail UI becomes tour detail UI. |
| 6 | Migrate profile and marketplace language. | Agent profiles become guide/operator profiles in UI. |
| 7 | Migrate saved and activity views. | Favorites/visited properties become saved/visited tours. |
| 8 | Migrate community pages. | Board articles become travel community/articles. |
| 9 | Update tests and visual snapshots. | Existing flows pass with GoTrip terminology. |
| 10 | Complete current backend integration. | Frontend code uses current GoTrip GraphQL documents and generated types. |

## Page And Component Mapping

| Old Nestar Frontend Area | GoTrip Frontend Area | Current Backend API |
| --- | --- | --- |
| Property listing page | Tour listing page | `getTours` |
| Property detail page | Tour detail page | `getTour` |
| Create property page/form | Create tour page/form for operators | `createTour` |
| Update property page/form | Update tour page/form for operators | `updateTour` |
| Agent listing/profile | Guide/operator listing/profile | `getAgents`, `getMember` |
| Favorite properties | Saved tours | `toggleWishlist`, `getMyWishlist`, `checkWishlist` |
| Visited properties | Recently viewed tours | `getVisited` |
| Board articles | Travel community/articles | `getBoardArticles`, `getBoardArticle` |
| Notices | Notices/help content | `getNotices`, `getNotice` |
| Member profile | Traveler account/profile | `getMember`, `updateMember` |
| Member signup/login | Traveler signup/login | `signup`, `login` |

## GraphQL Query And Mutation Rename Plan

### Phase 1: Current GoTrip API Consumption

Use current backend operations directly.

| Frontend Name | Current GraphQL Operation |
| --- | --- |
| `useTours` | `getTours` |
| `useTour` | `getTour` |
| `createTour` | `createTour` |
| `updateTour` | `updateTour` |
| `saveTour` | `toggleWishlist` / `checkWishlist` |
| `useSavedTours` | `getMyWishlist` |
| `useVisitedTours` | `getVisited` |
| `useGuides` | `getAgents` |
| `useNotices` | `getNotices` |

### Phase 2: Frontend Data Layer

Create a frontend data layer around current GoTrip fields and UI concepts.

| Backend Field | Frontend Adapter Field |
| --- | --- |
| `tourTitle` | `tourTitle` |
| `tourDesc` | `tourDescription` |
| `tourPrice` | `tourPrice` |
| `tourLocation` | `tourLocation` |
| `tourImages` | `tourImages` |
| `tourViews` | `tourViews` |
| `tourLikes` | `tourLikes` |
| `tourComments` | `tourComments` |
| `memberData` | `operatorData` or `guideData` |
| `MemberType.AGENT` | guide/operator role in UI only |

### Phase 3: Remaining Integration Areas

Connect destination, schedule, booking, payment, wishlist, notification, notice, and admin approval screens to the current backend operations.

## UI Terminology Changes

| Real-Estate Term | GoTrip UI Term |
| --- | --- |
| Property | Tour |
| Properties | Tours |
| Agent | Guide or Operator |
| Property type | Tour type |
| Property location | Destination |
| Property address | Meeting point or destination address |
| Property price | Tour price |
| Beds/rooms/square | Duration, group size, itinerary, included services |
| Rent/barter | Availability, booking option, promotion |
| Sold | Booked out or unavailable |
| Favorites | Saved tours |
| Visited | Recently viewed |

## Frontend Compatibility Notes

- Backend GraphQL now exposes GoTrip operations; update frontend documents and generated types to match.
- Prefer adapter functions over scattering raw backend field access across UI components.
- Add tests for key user flows before broad UI rewrites.

## 2026-06-09 - Frontend Migration Progress

A first implementation pass has migrated active frontend surfaces from Nestar/property concepts toward GoTrip tour concepts. The frontend now has primary `/tour` and `/tour/detail` public routes, tour-based homepage discovery, Wishlist-backed saved tours, guide/operator request intake during signup, mypage request status display, admin tour management, admin guide/operator request review, destination-backed home search, and public notice API integration.

GraphQL additions include public/admin documents for tours, destinations, tour schedules, bookings, payments, wishlists, notifications, notices, and agent approval. Community BoardArticle functionality was preserved, with article comments explicitly using `CommentGroup.ARTICLE` and tour reviews using `CommentGroup.TOUR`.

Compatibility state:
- `/property` and `/property/detail` still exist as compatibility wrappers and redirect into tour routes.
- `_admin/properties` remains the admin compatibility URL, but its screen now manages tours.
- Legacy property component/type files remain in the repository and must not be removed until all imports are migrated and validation passes.

Validation status:
- `yarn tsc --noEmit`: passed.
- `yarn build`: passed.

## 2026-06-09 - Frontend Branding Refresh

Visible Nestar branding has been replaced with GoTrip branding across the active frontend shell and shared visible surfaces. The existing logo asset paths were preserved while the SVG contents were replaced with a GoTrip travel-mark logo system, so current component references continue to work.

Updated surfaces:
- Layout title/meta and document SEO copy now use GoTrip travel-tour language.
- Header/footer/admin/auth/community logo references now render the GoTrip logo through existing asset paths.
- Footer, community labels, guide/operator labels, mobile placeholders, and locale labels no longer expose visible Nestar branding.

Compatibility state:
- No Apollo documents, GraphQL operations, backend roles, or route compatibility wrappers were changed.
- `MemberType.AGENT` remains the backend role while guide/operator wording is UI-only.

Validation status:
- `yarn tsc --noEmit`: passed.
- `yarn build`: passed.
