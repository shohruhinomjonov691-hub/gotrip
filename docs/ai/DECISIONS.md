# Architectural Decisions

## Decision Log

| Decision | Why It Was Made | Risk | Alternative Considered |
| --- | --- | --- | --- |
| Use a safe rename layer only | The first migration step needed to change project identity without destabilizing behavior. | The backend still exposes real-estate terms while the product brand says GoTrip. | Full domain conversion from property/agent to tour/guide in one step. |
| Rename app/project identity to GoTrip | The confirmed target brand for this repo is GoTrip. | Any external scripts still referencing `nestar-*` must be updated. | Keep old folder names and change only display strings. |
| Rename app folders | Folder names are visible project identifiers and part of the Nest monorepo graph. | Git shows large delete/add movement unless rename detection is enabled. | Keep `apps/nestar-api` and `apps/nestar-batch` internally. |
| Keep business/domain logic unchanged | The user explicitly requested no business logic change for the safe rename phase. | Product/domain mismatch remains until a later migration phase. | Rename `Property` to `Tour` and `Agent` to `Guide` immediately. |
| Keep GraphQL API unchanged | Preserves compatibility with current frontend clients and generated GraphQL types. | Frontend UI must temporarily map travel terms onto property-based API fields. | Break API names now and require a frontend migration at the same time. |
| Keep MongoDB model, schema, and collection names unchanged | Avoids data migration risk and preserves existing Mongoose behavior. | Database internals still contain real-estate naming. | Create new `tours`, `bookings`, and `guides` collections immediately. |
| Treat `.env` database name as project/environment label | The database name is a deployment label, not a MongoDB collection or schema contract. | Switching database name can point the app at a different database if data is not present. | Keep the old `/Nestar` database name until an explicit data migration. |
| Leave lint dependency issue unresolved | Lint failed before analyzing code because `eslint.config.mjs` imports missing `typescript-eslint`. | CI lint may fail until dependency/config is fixed. | Install `typescript-eslint` or rewrite ESLint config during the rename, which would exceed the requested scope. |
| Document Petoria as a name mismatch only | The user confirmed GoTrip is correct after a screenshot example used Petoria. | Future agents may still confuse the screenshot example with repo intent. | Use Petoria in docs, which would contradict current repo state. |

## Compatibility Principles

| Principle | Effect |
| --- | --- |
| Public APIs change last | Frontend and external clients remain stable while backend internals are assessed. |
| Data contracts change only with migration plans | MongoDB collections and schema fields stay stable until a real data migration is designed. |
| Brand identity can move ahead of domain model | GoTrip naming is now visible at project/app level while domain migration remains future work. |
| Validation is required after each migration layer | Typecheck and build results are recorded before moving to frontend or domain conversion. |

## Open Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Lint cannot run | Style or static-analysis issues may be hidden. | Fix `typescript-eslint` dependency/config before future code changes. |
| UI/domain mismatch | Users may see GoTrip branding while frontend/backend fields still imply real estate. | Use frontend adapters and terminology mapping during Next.js migration. |
| Database name change | Runtime may connect to an empty `GoTrip` database unless data exists there. | Verify database contents or create a controlled migration/copy before production use. |
| Future API rename blast radius | Renaming GraphQL operations will affect frontend queries and generated types. | Introduce compatibility phase or versioned API before removing old names. |

