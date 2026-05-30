# Frontend Migration Plan: Nestar -> GoTrip

## Goal

Migrate the Next.js frontend from a real-estate Nestar experience to a GoTrip travel booking experience while the backend GraphQL API remains property-based for compatibility.

The frontend should hide legacy real-estate terms from users before the backend domain model is renamed.

## Step-By-Step Plan

| Step | Task | Output |
| --- | --- | --- |
| 1 | Inventory current Next.js routes, layouts, GraphQL operations, generated types, and shared components. | Route/component map with Nestar terminology. |
| 2 | Rename brand-level UI from Nestar to GoTrip. | Header, footer, metadata, auth screens, error pages, and dashboard labels use GoTrip. |
| 3 | Add frontend terminology adapters. | UI uses tour/travel names while GraphQL still calls property/member/agent fields. |
| 4 | Migrate listing pages. | Property listing UI becomes tour listing UI. |
| 5 | Migrate detail pages. | Property detail UI becomes tour detail UI. |
| 6 | Migrate profile and marketplace language. | Agent profiles become guide/operator profiles in UI. |
| 7 | Migrate saved and activity views. | Favorites/visited properties become saved/visited tours. |
| 8 | Migrate community pages. | Board articles become travel community/articles. |
| 9 | Update tests and visual snapshots. | Existing flows pass with GoTrip terminology. |
| 10 | Prepare for future backend GraphQL rename. | Frontend code isolates legacy GraphQL names behind adapters/hooks. |

## Page And Component Mapping

| Old Nestar Frontend Area | GoTrip Frontend Area | Backend API During Compatibility Phase |
| --- | --- | --- |
| Property listing page | Tour listing page | `getProperties` |
| Property detail page | Tour detail page | `getProperty` |
| Create property page/form | Create tour page/form for operators | `createProperty` |
| Update property page/form | Update tour page/form for operators | `updateProperty` |
| Agent listing/profile | Guide/operator listing/profile | `getAgents`, `getMember` |
| Favorite properties | Saved tours | `getFavorites` |
| Visited properties | Recently viewed tours | `getVisited` |
| Board articles | Travel community/articles | `getBoardArticles`, `getBoardArticle` |
| Member profile | Traveler account/profile | `getMember`, `updateMember` |
| Member signup/login | Traveler signup/login | `signup`, `login` |

## GraphQL Query And Mutation Rename Plan

### Phase 1: Compatibility Consumption

Use existing backend operations unchanged. Rename only frontend functions, hooks, files, and UI labels.

| Frontend Name | Existing GraphQL Operation |
| --- | --- |
| `useTours` | `getProperties` |
| `useTour` | `getProperty` |
| `createTour` | `createProperty` |
| `updateTour` | `updateProperty` |
| `saveTour` | `likeTargetProperty` |
| `useSavedTours` | `getFavorites` |
| `useVisitedTours` | `getVisited` |
| `useGuides` | `getAgents` |

### Phase 2: Frontend Adapter Layer

Create a frontend data mapping layer that converts backend fields to UI concepts.

| Backend Field | Frontend Adapter Field |
| --- | --- |
| `propertyTitle` | `tourTitle` |
| `propertyDesc` | `tourDescription` |
| `propertyPrice` | `tourPrice` |
| `propertyLocation` | `tourLocation` |
| `propertyImages` | `tourImages` |
| `propertyViews` | `tourViews` |
| `propertyLikes` | `tourLikes` |
| `propertyComments` | `tourComments` |
| `memberData` | `operatorData` or `guideData` |
| `MemberType.AGENT` | guide/operator role in UI only |

### Phase 3: Backend Rename Preparation

Only after compatibility policy is chosen, plan backend GraphQL renames such as:

| Existing API Name | Future API Name |
| --- | --- |
| `Property` | `Tour` |
| `Properties` | `Tours` |
| `PropertyInput` | `TourInput` |
| `PropertiesInquiry` | `ToursInquiry` |
| `getProperty` | `getTour` |
| `getProperties` | `getTours` |
| `createProperty` | `createTour` |
| `updateProperty` | `updateTour` |
| `likeTargetProperty` | `likeTargetTour` |
| `getAgentProperties` | `getGuideTours` or `getOperatorTours` |

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

- Do not rename backend GraphQL documents until the backend exposes compatible GoTrip operations.
- Prefer adapter functions over scattering `property*` field references across UI components.
- Keep generated GraphQL types stable during phase 1.
- Add tests for key user flows before making backend GraphQL changes.

