# Story: DP-2 — Profile Hero Card (Left Column)

**Sprint:** sprint_069
**Priority:** P0
**Status:** DONE

## User Story

As a CDL driver,
I want to see a rich profile hero card with my avatar, verified status, stats, and section navigation,
So that I have a quick overview of my account and can jump to any section.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/profile/profile.component.html`
- `frontend/src/app/features/driver/profile/profile.component.scss`
- `frontend/src/app/features/driver/profile/profile.component.ts` (minor — add scrollToSection method)

### Database Changes
- None

## Acceptance Criteria

- [x] 2-column layout: left hero card (sticky, ~340px) + right content column
- [x] Hero card structure:
  - Teal gradient banner at top (`linear-gradient(135deg, #1dad8c, #17a07f)`)
  - Avatar circle (88px) overlapping banner, with camera edit badge on hover
  - File input hidden, triggered by clicking avatar (existing upload logic)
  - CSS-only spinner when `uploadingAvatar()` is true
  - Fallback: initials circle when no avatar URL
- [x] Below avatar:
  - Full name (20px, font-weight 700)
  - Email with ✅ verified badge (or ⚠️ unverified)
  - 🗓️ Member since chip (light teal background, rounded)
- [x] Stats strip: 3 items in a row
  - 📋 Cases: `{{ driverStats().totalCases }}` (from analytics API)
  - 🏆 Win Rate: `{{ driverStats().successRate }}%`
  - ⏱️ Avg Days: `{{ driverStats().avgDays || '—' }}`
- [x] Section navigation: vertical list of clickable links
  - 👤 Profile Information
  - 🔒 Password & Security
  - 🔔 Notifications
  - 🔗 Linked Accounts
  - ⚠️ Danger Zone
- [x] Clicking a nav link calls `scrollToSection(sectionId)` using `document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })`
- [x] Active section highlighted with teal left border
- [x] All emoji icons wrapped in `<span aria-hidden="true">`
- [x] At 968px breakpoint: hero card moves to full-width top, content below

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `profile.component.ts` | `profile.component.spec.ts` | DP-9 |

## Dependencies

- Depends on: DP-1
- Blocked by: none

## Notes

- Avatar upload reuses existing `onAvatarSelected()` logic from current component
- Stats fallback: show "—" if analytics API fails or returns no data
- `initials` computed signal: first letter of first name + first letter of last name, uppercase
- Sticky positioning: `position: sticky; top: 24px` on desktop only
