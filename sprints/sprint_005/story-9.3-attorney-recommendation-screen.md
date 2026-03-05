# Story 9.3 — Attorney Recommendation Screen

**Epic:** Complete Driver End-to-End Journey
**Priority:** CRITICAL
**Status:** DONE (component pre-exists, needs tests)

## User Story
As Miguel (driver),
I want to see up to 3 recommended attorneys for my case — with ratings, win rates, and
a "RECOMMENDED" badge on the best match — so that I choose quickly without stress.

## Context
`AttorneyRecommendationComponent` exists at
`features/driver/attorney-recommendation/attorney-recommendation.component.ts`.
Route: `/driver/cases/:caseId/attorneys` registered in `driver-routing.module.ts`.

## Component Behaviour (what exists)
- `ngOnInit`: reads `caseId` from route params, calls `getCaseById()` for case number,
  calls `getRecommendedAttorneys()` to populate the attorney list
- Shows spinner while loading, empty state when list is empty
- Each attorney card shows: name, star rating, win rate, specializations (max 3), recommended badge
- `selectAttorney(id)`: calls `caseService.selectAttorney()`, shows success snackbar,
  navigates to `/driver/cases/:caseId`
- On selection error: clears `selecting` signal, shows error snackbar
- `goBack()`: navigates to `/driver/dashboard`

## Acceptance Criteria
- [ ] Recommended attorneys list displayed with all metadata
- [ ] "RECOMMENDED" badge visible on the `isRecommended` attorney
- [ ] Select button disabled for all cards while any selection is in progress
- [ ] Success path: snackbar + navigate to case detail
- [ ] Error path: snackbar + `selecting` cleared (button re-enabled)
- [ ] Empty state shown when no attorneys available
- [ ] Unit tests cover all paths (see Story 9.5)
