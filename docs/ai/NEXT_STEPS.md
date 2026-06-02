# Next Steps

## Priority Order For Tomorrow

1. Fix the ESLint dependency/config blocker.
2. Review all moved app paths in local scripts, deployment config, and developer notes.
3. Start the frontend GoTrip terminology adapter layer.
4. Add documentation for compatibility boundaries before deeper domain conversion.
5. Plan the future `Property` -> `Tour` backend migration as a separate breaking or compatibility-managed phase.

## Backend Cleanup

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Resolve lint failure | Either add the `typescript-eslint` package or update `eslint.config.mjs` to use installed `@typescript-eslint/*` packages. |
| P0 | Re-run lint after fix | Run non-mutating check first, then decide whether `npm run lint -- --fix` or script changes are appropriate. |
| P1 | Review moved app paths | Check deployment scripts, process managers, Docker files, CI config, and local docs for old `nestar-*` paths. |
| P1 | Confirm database target | Verify the `GoTrip` MongoDB database contains expected data or prepare a controlled copy/migration from old database name. |
| P2 | Add backend migration notes to README | Link the new `docs/` files from the root README after docs are reviewed. |

## Frontend Migration

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Inventory Next.js frontend routes/components | Identify real-estate terminology and GraphQL operations. |
| P0 | Add frontend data adapters | Map `property*` backend fields to `tour*` UI fields without changing GraphQL calls. |
| P1 | Rename visible UI terminology | Property -> Tour, Agent -> Guide/Operator, Favorites -> Saved tours. |
| P1 | Update page metadata and navigation | Ensure GoTrip appears consistently in browser titles, SEO metadata, menus, and auth pages. |
| P2 | Prepare GraphQL document rename plan | Keep existing backend operations until compatibility strategy is approved. |

## Testing

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Restore lint verification | Required before broad source edits. |
| P0 | Re-run typechecks | API and batch typechecks should pass after any config cleanup. |
| P1 | Add smoke tests for renamed app paths | Verify `gotrip-api` and `gotrip-batch` project keys build in CI/local scripts. |
| P1 | Add frontend visual or e2e checks | Cover home/listing/detail/auth flows after UI terminology changes. |
| P2 | Document database verification | Confirm collections remain unchanged and available under the active DB target. |

## Documentation

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Review these migration docs | Confirm GoTrip naming and compatibility boundaries. |
| P1 | Add frontend-specific route inventory | Fill in exact Next.js paths once the frontend repo/app is inspected. |
| P1 | Add backend API inventory | Generate a GraphQL operation list from the current code-first schema or resolver files. |
| P2 | Draft future tour-domain RFC | Plan `Property` -> `Tour`, `Agent` -> `Guide`, and booking workflow as a separate domain migration. |

## Later Domain Migration

Travel-domain conversion is not completed yet. It should be planned after the safe rename and frontend compatibility layer are stable.

Likely future backend domains:

| Future Domain | Current Source Concept |
| --- | --- |
| Tour | Property |
| Guide/Operator | Agent |
| Destination | Property location |
| Booking | New domain, not present yet |
| Availability | New domain, not present yet |
| Review | Could extend comments/likes or become separate domain |

