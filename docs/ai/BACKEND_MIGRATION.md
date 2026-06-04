# Backend Migration: Property -> Tour

## Project Summary

The backend has moved from the staged GoTrip identity rename into a breaking travel-tour domain migration. The API app remains `gotrip-api` and the batch app remains `gotrip-batch`, but the primary catalog domain is now `Tour` instead of `Property`.

## Current Backend State

| Area | Current GoTrip State |
| --- | --- |
| Primary catalog | `Tour` module, DTOs, resolver, service, schema, and GraphQL operations |
| Ownership role | `MemberType.AGENT` remains the tour creator/operator role |
| Member role enum | `USER`, `AGENT`, `ADMIN` unchanged |
| Main collection | `tours` |
| New ERD collections | `destinations`, `tourSchedules`, `bookings`, `payments`, `wishlists`, `notifications`, and `notices` |
| Shared social modules | Likes, views, comments, and notifications use `TOUR` group naming |
| Batch ranking | Calculates tour, agent, and destination ranks from engagement, bookings, wishlists, and destination tour counts |

## GraphQL Changes

This is a breaking API migration. Old public property operations were not retained.

| Old Surface | New Surface |
| --- | --- |
| `Property`, `Properties` | `Tour`, `Tours` |
| `PropertyInput`, `PropertyUpdate` | `TourInput`, `TourUpdate` |
| `PropertiesInquiry` | `ToursInquiry` |
| `AgentPropertiesInquiry` | `AgentToursInquiry` |
| `AllPropertiesInquiry` | `AllToursInquiry` |
| `createProperty` | `createTour` |
| `getProperty`, `getProperties` | `getTour`, `getTours` |
| `getAgentProperties` | `getAgentTours` |
| `likeTargetProperty` | `likeTargetTour` |
| `getAllPropertiesByAdmin` | `getAllToursByAdmin` |

## Domain Field Changes

| Old Real-Estate Field | New Tour Field |
| --- | --- |
| `propertyType` | `tourCategory` |
| `propertyStatus` | `tourStatus` |
| `propertyLocation` | `tourLocation` |
| `propertyTitle` | `tourTitle` |
| `propertyPrice` | `tourPrice` |
| `propertyImages` | `tourImages` |
| `propertyDesc` | `tourDesc` |
| `propertyViews/Likes/Comments/Rank` | `tourViews/Likes/Comments/Rank` |
| `memberProperties` | `memberTours` |

Removed real-estate-only fields: square, beds, rooms, barter, rent, constructedAt, and soldAt.

Added tour fields: duration, min/max people, available seats, itinerary, included/excluded items, meeting point, language, difficulty, and destinationId.

## Enums

| Enum | Values |
| --- | --- |
| `TourCategory` | `ADVENTURE`, `CULTURAL`, `HISTORICAL`, `BEACH`, `MOUNTAIN`, `CITY`, `CRUISE` |
| `TourStatus` | `ACTIVE`, `SOLD_OUT`, `PAUSED`, `DELETED` |
| `BookingStatus` | `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` |

## Data Migration Boundary

Existing `properties` documents are not read through compatibility aliases. They must be migrated into `tours` before using the new API.

Minimum mapping:

| Old Field | New Field |
| --- | --- |
| `propertyStatus: ACTIVE` | `tourStatus: ACTIVE` |
| `propertyStatus: SOLD` | `tourStatus: SOLD_OUT` |
| `propertyStatus: DELETE` | `tourStatus: DELETED` |
| `propertyLocation` | `tourLocation` |
| `propertyTitle` | `tourTitle` |
| `propertyPrice` | `tourPrice` |
| `propertyImages` | `tourImages` |
| `propertyDesc` | `tourDesc` |
| `memberId` | `memberId` |

Travel-specific fields such as `tourCategory`, `tourDuration`, `tourMaxPeople`, `tourMinPeople`, `tourAvailableSeats`, and destination/schedule data need explicit seed defaults or manual data curation.
