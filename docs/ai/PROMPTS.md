# Reusable Prompts For Future Codex Sessions

## Important Naming Note

This repo uses **GoTrip** as the confirmed target brand. Do not use Petoria for this repo. Petoria appeared only in a screenshot example from another project and should not be copied into GoTrip documentation or code.

## Safe Identity Rename Prompt

```text
Implement a safe identity rename from Nestar to GoTrip.

Rename visible project/app identifiers only. Do not change business logic.
Keep GraphQL APIs, DTOs, schemas, Mongoose model names, MongoDB collections, Property/Agent domain fields, likes, views, comments, auth, uploads, and batch ranking formulas unchanged.

Update app folder names, Nest project keys, package metadata, build/dist paths, absolute imports caused by folder movement, runtime welcome labels, and environment/project labels.

After changes, run:
- rg -n "Nestar|nestar|NESTAR" -g '!node_modules' -g '!dist' -g '!build'
- npx tsc -p apps/gotrip-api/tsconfig.app.json --noEmit
- npx tsc -p apps/gotrip-batch/tsconfig.app.json --noEmit
- npm run build
- npx nest build gotrip-batch
- npx eslint "{src,apps,libs,test}/**/*.ts"
```

## Migration Documentation Prompt

```text
Create or update root docs for the Nestar -> GoTrip migration.

Document the current backend state precisely:
- GoTrip project identity is applied.
- The backend still uses Property/Agent business concepts.
- GraphQL public API names are unchanged.
- MongoDB model names, schemas, and collections are unchanged.
- Lint is blocked by missing/configured `typescript-eslint`.

Do not change source code. Only write Markdown docs.
Use tables for naming changes, compatibility notes, decisions, validation status, and next steps.
```

## Backend Travel-Domain Planning Prompt

```text
Analyze the current GoTrip backend and produce a decision-complete plan to migrate from the existing Property/Agent real-estate domain to a travel tour booking domain.

Explore the repo first. Do not edit files.
Plan how to introduce Tour, Guide/Operator, Destination, Availability, Booking, and Review concepts.
Specify whether GraphQL compatibility should be preserved, whether MongoDB collections should be migrated or duplicated, and how existing likes/views/comments should attach to tours.

Include risks, alternatives, API changes, schema changes, migration strategy, and test plan.
```

## Frontend Migration Planning Prompt

```text
Analyze the Next.js frontend and plan the Nestar -> GoTrip UI/domain migration.

Do not change files until the plan is approved.
Map current real-estate pages/components to GoTrip travel pages/components.
Keep backend GraphQL operations unchanged in phase 1.
Create a frontend adapter plan that maps property fields to tour UI concepts.
Include route changes, component rename plan, query/mutation usage, UI terminology table, tests, and rollout order.
```

## Compatibility Review Prompt

```text
Review the GoTrip backend for accidental breaking changes after the safe rename.

Check that:
- GraphQL operation names are unchanged.
- DTO, enum, schema, and Mongoose model names are unchanged.
- MongoDB collection names are unchanged.
- Property/Agent service logic is unchanged.
- Batch ranking formulas are unchanged.
- App/project identity is GoTrip.

Return findings first with file/line references, then list validation commands and any residual risks.
```

## Validation Runbook Prompt

```text
Run the GoTrip backend validation runbook.

Commands:
- rg -n "Nestar|nestar|NESTAR" -g '!node_modules' -g '!dist' -g '!build'
- npx tsc -p apps/gotrip-api/tsconfig.app.json --noEmit
- npx tsc -p apps/gotrip-batch/tsconfig.app.json --noEmit
- npm run build
- npx nest build gotrip-batch
- npx eslint "{src,apps,libs,test}/**/*.ts"

Summarize pass/fail status and explain any failures. Do not make source-code changes unless explicitly requested.
```

## Docs-Only Safety Prompt

```text
Create documentation only.

Do not modify application source code, package metadata, config files, environment files, generated files, or tests.
Only add or edit files under `docs/`.
After writing docs, verify with `git status --short` that only docs files changed.
```

