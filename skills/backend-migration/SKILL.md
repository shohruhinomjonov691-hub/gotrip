---
name: backend-migration
description: Continue the GoTrip backend migration from Nestar real-estate concepts to GoTrip travel tour booking concepts while preserving the existing NestJS architecture.
---

# GoTrip Backend Migration

Use this skill when changing backend code for the GoTrip travel tour booking migration.

## Workflow

1. Search for affected property/tour references before editing.
2. Preserve the resolver/service/module structure already used by `gotrip-api`.
3. Keep DTOs, enums, and schemas in their existing folders.
4. Keep `MemberType.USER | AGENT | ADMIN` unchanged.
5. Use tour terminology for catalog behavior and database lookups.
6. Update social modules consistently when tour counters, likes, views, comments, follows, board articles, or notifications are involved.
7. Update batch logic when tour ranking or `memberTours` affects rank calculations.
8. Update `docs/ai/COMPLETED_TASKS.md` after major completed work.
