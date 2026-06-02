---
name: tour-logic
description: Review GoTrip tour API consistency across GraphQL operations, DTOs, schemas, enums, filters, and remaining legacy terminology.
---

# GoTrip Tour API Review

Use this skill for review-only passes or pre-edit analysis of the tour API.

## Review Checklist

- Confirm GraphQL operation names use tour terminology:
  - `createTour`
  - `getTour`
  - and where it is related
- Confirm shared operations such as `getFavorites` and `getVisited` return tour data.
- Confirm DTOs, schemas, and enums agree on tour fields and nullability.
- Confirm filters use tour type, destination, duration, status, price and etc.
- Report real findings with paths and behavior impact.
