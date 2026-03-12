# Story OP-5: Operator Routing

## Status: DONE

## Description
Add routes for all operator sidebar navigation links so they resolve without 404.

## Changes
- **`operator-routing.module.ts`**: Added routes for `/cases`, `/queue`, `/notifications`, `/profile`
  (all currently point to the dashboard component as placeholder — dedicated pages in future sprints)

## Acceptance Criteria
- [x] All sidebar links resolve to a valid route
- [x] No 404 when navigating between operator pages
