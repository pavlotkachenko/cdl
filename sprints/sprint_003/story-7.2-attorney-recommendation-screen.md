# Story 7.2 — Attorney Recommendation Screen

**Epic:** Core Flow Integration
**Priority:** CRITICAL
**Status:** TODO

## User Story
As Miguel (driver),
I want to see exactly 3 attorney recommendations after submitting my ticket,
so that I can choose quickly without being overwhelmed.

## Context
`assignment.service.js` → `rankAttorneys` already runs on the backend and returns a scored list.
The driver sees no attorney options in the current UI — the flow dead-ends after ticket submission.
The roadmap requires: max 3 options, one labeled "RECOMMENDED", with star rating and win-rate visible.

## Scope

### Backend
- Add `GET /api/cases/:caseId/attorneys` endpoint returning top 3 ranked attorneys for a case
- Calls `rankAttorneys` from `assignment.service.js` with the case's violation type and state
- Returns for each attorney: `id`, `fullName`, `avatarUrl`, `rating`, `successRate`, `specializations`, `casesWon`, `totalCases`, `isRecommended` (top scorer = true)

### Frontend (new route: `/driver/cases/:caseId/attorneys`)
- Display 3 attorney cards in vertical list (mobile-first, single column)
- Each card: photo avatar, name, star rating (⭐⭐⭐⭐⭐), "Won X% of cases like yours", specialization tags
- Top card gets "RECOMMENDED" badge (green chip)
- "Select" button on each card — selecting one calls `POST /api/cases/:caseId/assign-attorney`
- Show loading skeleton while fetching
- After selection: navigate to `/driver/cases/:caseId` (case status page — Story 7.3)

### Step integration
- After ticket form submit success → redirect to this attorney screen automatically
- Show case number in header ("Case #CDL-2025-001")

## Acceptance Criteria
- [ ] Exactly 3 attorneys displayed (or fewer if fewer qualify, with "Finding attorneys…" state)
- [ ] Top-scored attorney card shows "RECOMMENDED" badge
- [ ] Each card shows star rating, win percentage, and at least one specialization
- [ ] Selecting an attorney calls the assign endpoint and navigates to case status
- [ ] Driver cannot proceed without selecting an attorney (button is the only CTA)
- [ ] If no attorneys available: shows "We're finding the right attorney — you'll be notified within 24 hours" with back navigation
- [ ] WCAG 2.1 AA: all cards keyboard-navigable, "RECOMMENDED" not conveyed by color alone
