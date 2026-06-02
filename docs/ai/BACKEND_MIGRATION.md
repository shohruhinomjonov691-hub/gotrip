# Backend Migration: Nestar -> GoTrip

## Project Summary

| Area | Original Nestar State | Current GoTrip State |
| --- | --- | --- |
| Product identity | Real-estate platform named Nestar | Travel booking platform identity named GoTrip |
| Backend framework | NestJS monorepo with GraphQL and MongoDB | Same NestJS monorepo, renamed app/project identity |
| API app | `apps/nestar-api` | `apps/gotrip-api` |
| Batch app | `apps/nestar-batch` | `apps/gotrip-batch` |
| Core domain | `Property`, `Agent`, `Member` | Still `Property`, `Agent`, `Member` for compatibility |
| Social features | Likes, views, comments, follows, board articles | Unchanged |
| Persistence | Mongoose schemas and MongoDB collections | Schemas and collections unchanged |

## Backend Migration Goal

The backend migration is intentionally staged. The completed phase is a safe identity rename from Nestar to GoTrip without changing runtime behavior. The next backend phases can progressively introduce travel-tour concepts while preserving compatibility for existing GraphQL clients and MongoDB data.

The current backend still exposes the real-estate domain model. This is expected and intentional for this phase.

## Naming Changes

| Previous Name | Current Name | Notes |
| --- | --- | --- |
| `nestar` package name | `gotrip` | Updated in `package.json` and `package-lock.json`. |
| `apps/nestar-api` | `apps/gotrip-api` | API application folder renamed. |
| `apps/nestar-batch` | `apps/gotrip-batch` | Batch application folder renamed. |
| Nest project key `nestar-api` | `gotrip-api` | Updated in `nest-cli.json`. |
| Nest project key `nestar-batch` | `gotrip-batch` | Updated in `nest-cli.json`. |
| `dist/apps/nestar-api` | `dist/apps/gotrip-api` | TypeScript output path updated. |
| `dist/apps/nestar-batch` | `dist/apps/gotrip-batch` | TypeScript output path updated. |
| `Welcome to Nestar API Server!` | `Welcome to GoTrip API Server!` | Runtime label only. |
| `Welcome to Nestar BATCH Server!` | `Welcome to GoTrip BATCH Server!` | Runtime label only. |

## Module Changes

No business modules were redesigned in this phase.

| Module | Current Status | Migration Note |
| --- | --- | --- |
| `auth` | Unchanged | Guards, JWT, role checks, and decorators are preserved. |
| `member` | Unchanged | `Member`, `Agent`, and member stats remain as-is. |
| `property` | Unchanged | Still the primary listing domain. Not yet converted to tours. |
| `like` | Unchanged | Still supports property/member/article likes. |
| `view` | Unchanged | Still supports visited properties and viewed members/articles. |
| `comment` | Unchanged | Still references `CommentGroup.PROPERTY`, `ARTICLE`, and `MEMBER`. |
| `follow` | Unchanged | Member follow relationships remain unchanged. |
| `board-article` | Unchanged | Community/articles module remains usable for travel content later. |
| `socket` | Unchanged | WebSocket module was not modified. |
| `batch` | Identity renamed only | Ranking formulas for properties and agents remain unchanged. |

## GraphQL Changes

GraphQL compatibility was preserved. No GraphQL public API names were renamed.

| GraphQL Surface | Status | Compatibility Note |
| --- | --- | --- |
| Types and object names | Unchanged | `Property`, `Properties`, `Member`, `Members`, etc. remain unchanged. |
| Inputs and updates | Unchanged | `PropertyInput`, `PropertiesInquiry`, `PropertyUpdate`, etc. remain unchanged. |
| Queries | Unchanged | Examples: `getProperty`, `getProperties`, `getFavorites`, `getVisited`, `getAgents`. |
| Mutations | Unchanged | Examples: `createProperty`, `updateProperty`, `likeTargetProperty`. |
| Enums | Unchanged | Examples: `PropertyType`, `PropertyStatus`, `PropertyLocation`, `MemberType`. |
| Auth and roles | Unchanged | `MemberType.AGENT` remains the creator role for property listings. |

## MongoDB Collection And Schema Changes

MongoDB schemas and collections were not changed in this phase.

| Model | Collection | Current Status |
| --- | --- | --- |
| `Property` | `properties` | Unchanged |
| `Member` | `members` | Unchanged |
| `Like` | `likes` | Unchanged |
| `View` | `views` | Unchanged |
| `Comment` | `comments` | Unchanged |
| `Follow` | `follows` | Unchanged |
| `BoardArticle` | board article collection from existing schema | Unchanged |
| `Notification` | notification collection from existing schema | Unchanged |
| `Notice` | notice collection from existing schema | Unchanged |

The `.env` MongoDB database name was updated from the old project label to `GoTrip`. Collection names and schema fields remain unchanged.

## Compatibility Notes

| Area | Compatibility Position |
| --- | --- |
| Existing frontend clients | Should continue using the existing GraphQL operation and field names. |
| Existing database documents | Compatible if copied into the same unchanged collections and schemas. |
| Travel terminology | Not yet reflected in backend API names or database fields. |
| Future domain migration | Should be planned separately with compatibility wrappers or a breaking API version. |
| Batch jobs | Continue ranking `Property` and `Agent` concepts using existing formulas. |

