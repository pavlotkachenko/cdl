# Story CD-7: Frontend — Share Case Feature

## Meta

- **Sprint:** 065
- **Priority:** P2
- **Status:** DONE
- **Batch:** 3 (depends on CD-4)

## User Story

**As** Miguel (Driver),
**I want** to share my case details with my fleet carrier or a family member,
**So that** they can see the status of my case without needing to log in.

## Scope

### Files to modify

| File | Action |
|------|--------|
| `frontend/src/app/features/driver/case-detail/case-detail.component.ts` | Add share functionality |
| `frontend/src/app/features/driver/case-detail/case-detail.component.spec.ts` | Add tests |

### Implementation

Phase 1 (this story): **Copy case summary to clipboard** — no backend required.

1. "Share Case" quick action button (link emoji icon)
2. On click: generate a text summary of the case and copy to clipboard
3. Summary format:
   ```
   Case #CASE-2026-000847
   Status: Attorney Assigned
   Violation: Speeding — I-35 North, Texas
   Court Date: April 15, 2026
   Attorney: Sarah Johnson

   View at: [app URL]/driver/cases/[caseId]
   ```
4. Show "Copied!" feedback for 2 seconds (same pattern as payment success copy)
5. If `navigator.clipboard` is unavailable, show "Copy not supported" message

### Future Phase (not this story)
- Backend shareable link with token-based access (no login required)
- Expiring share links with configurable access level

### Signals
- `shareCopyFeedback = signal(false)`

## Acceptance Criteria

- [ ] "Share Case" button in quick actions grid with link/share emoji
- [ ] Clicking generates a text summary and copies to clipboard
- [ ] Summary includes: case number, status, violation type + location, court date, attorney name
- [ ] "Copied!" feedback shown for 2 seconds
- [ ] Graceful fallback if clipboard API unavailable
- [ ] `aria-label="Share case details"` on button
- [ ] `aria-live="polite"` on copy feedback region
- [ ] All tests pass: `cd frontend && npx ng test --no-watch`

## Test Coverage Matrix

| Source File | Test File | Action |
|------------|-----------|--------|
| `frontend/src/app/features/driver/case-detail/case-detail.component.ts` | `case-detail.component.spec.ts` | Update |

## Test Cases Required

1. Share button exists in quick actions grid
2. Clicking share copies case summary text to clipboard
3. Summary includes case number, status, violation type, court date, attorney name
4. "Copied!" feedback shown after successful copy
5. Clipboard API failure shows fallback message
