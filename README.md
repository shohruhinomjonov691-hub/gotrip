# GoTrip · Travel Discovery & Community API

The backend for GoTrip, my largest full-stack project. GoTrip brings together a tour catalog, destination content, guide profiles, community articles, and member communication. This repository contains the NestJS GraphQL API and a separate application for scheduled ranking jobs.

[Live application](https://gotrips.cloud/) · [Next.js frontend](https://github.com/shohruhinomjonov691-hub/gotrip-next)

## Core capabilities

- **Tour catalog:** tour creation and editing, search/filtering, details, images, itineraries, group-size fields, and catalog status management.
- **Guide workflow:** user accounts, guide/operator requests, and administrator approval. The backend roles are `USER`, `AGENT`, and `ADMIN`.
- **Destination content:** curated galleries and destination information, with one guide owner per destination and ownership checks when assigning tours.
- **Community:** articles, comments/reviews, replies, likes, follows, saved tours, and recently viewed tours.
- **Communication:** conversations, messages, notifications, and public notices.
- **Content administration:** categories, tour/member moderation, guide requests, destinations, and testimonial approval.
- **Localization:** stored translated content and asynchronous AI-assisted translation of tour, article, and notice fields.
- **Rankings:** scheduled recalculation of tour, guide, and destination ranks from catalog and engagement data.

Saved tours use the like-based API (`likeTargetTour`, `getFavoriteTours`). Booking, payment processing, tour departure schedules, and a separate wishlist module are outside the current scope. Destination content is part of the current catalog; it does not implement a reservation lifecycle.

## Technology

TypeScript, NestJS 10, GraphQL/Apollo Server, MongoDB/Mongoose, JWT, class-validator, native WebSockets, NestJS Schedule, Helmet, and NestJS Throttler. The translation layer uses a provider interface with an OpenAI-backed implementation.

## Architecture

```text
Next.js / Apollo client
    ├── GraphQL → gotrip-api → resolvers → services → MongoDB
    └── WebSocket → authenticated communication gateway

gotrip-batch → scheduled ranking services → MongoDB
```

| Location | Responsibility |
| --- | --- |
| [`apps/gotrip-api/src/components`](apps/gotrip-api/src/components) | Domain modules, resolvers, and services |
| [`apps/gotrip-api/src/libs`](apps/gotrip-api/src/libs) | DTOs, enums, guards, validation, and shared utilities |
| [`apps/gotrip-api/src/schemas`](apps/gotrip-api/src/schemas) | MongoDB document definitions |
| [`apps/gotrip-api/src/socket`](apps/gotrip-api/src/socket) | WebSocket integration |
| [`apps/gotrip-batch/src`](apps/gotrip-batch/src) | Scheduled ranking jobs |
| [`docs/ai`](docs/ai) | Migration history and architectural decision records |

Authorization checks account status and roles against database state. Request validation rejects unknown fields; production configuration requires an explicit CORS origin list and disables GraphQL Playground/introspection. Image uploads are served under `/uploads`.

## Run locally

Prerequisites: Node.js 20, npm, and a reachable MongoDB database. The included Docker configuration also uses Node.js 20.

```bash
git clone --branch modification https://github.com/shohruhinomjonov691-hub/gotrip.git
cd gotrip
npm install
```

Create a root `.env` using your own values:

```dotenv
PORT_API=3007
PORT_BATCH=3008
MONGO_DEV=mongodb://127.0.0.1:27017/gotrip_dev
SECRET_TOKEN=replace-with-a-long-random-secret
ALLOWED_ORIGINS=http://localhost:3000
```

The API requires `MONGO_DEV` and `SECRET_TOKEN` in development. Keep the secret private and use a local development database. For AI-assisted translation, configure `OPENAI_API_KEY` on the server; never place it in frontend environment variables. Core catalog data can be managed without claiming AI translation is available in an unconfigured environment.

```bash
npm run start:dev
```

The API runs at `http://localhost:3007`, with GraphQL at `http://localhost:3007/graphql`. Development mode exposes GraphQL Playground. In a separate terminal, optionally start the ranking application:

```bash
npm run start:dev:batch
```

Connect the [frontend](https://github.com/shohruhinomjonov691-hub/gotrip-next) to this API. A fresh MongoDB database needs catalog content and appropriately provisioned administrator/guide accounts; cloning the repository does not copy the deployed site's data.

## GraphQL entry points

Representative operations include `signup`, `login`, `getTours`, `getTour`, `createTour`, `updateTour`, `getAgents`, `getFavoriteTours`, `getBoardArticles`, `getComments`, `getDestinations`, `getCategories`, and `getMyNotifications`.

The schema is generated from NestJS decorators (`autoSchemaFile: true`). Refer to the domain resolvers for input types, role requirements, and the complete operation set rather than using older property/booking-era API names.

## Build & verification commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Compile both API and batch applications |
| `npx tsc -p apps/gotrip-api/tsconfig.app.json --noEmit` | API type checking |
| `npx tsc -p apps/gotrip-batch/tsconfig.app.json --noEmit` | Batch type checking |
| `npm test` | Run configured Jest tests |
| `npm run test:e2e` | Run the API's configured end-to-end test setup |
| `npm run lint` | ESLint with automatic file fixes |

These are available project commands, not a claim that they were executed for this documentation update or that every workflow has test coverage.

## Production configuration

Production selects `MONGO_PROD` instead of `MONGO_DEV`. Supply `SECRET_TOKEN`, a comma-separated `ALLOWED_ORIGINS` allowlist, and the relevant port values through the root `.env` or the deployment environment before starting the applications.

```bash
npm run build
npm run start:prod
# Separate process, if ranking jobs are required:
npm run start:prod:batch
```

[`docker-compose.yml`](docker-compose.yml) provides an alternative deployment configuration, mapping API host port `4001` to container port `3007` and batch host port `4002` to `3008`. Set `PORT_API=3007` and `PORT_BATCH=3008` to match those mappings. MongoDB is external to that Compose file. Persist uploads and translation logs independently of build output.

## Project context

GoTrip evolved from a full-stack coursework foundation into a separate travel product. Historical migration notes retain earlier feature plans and validation records; the capabilities above describe the current `modification` branch. No application behavior was changed as part of this README update.

## Author

[Shokhrukhbek Inomjonov](https://github.com/shohruhinomjonov691-hub)
