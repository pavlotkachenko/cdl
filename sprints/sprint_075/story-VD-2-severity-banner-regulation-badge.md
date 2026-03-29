# Story: VD-2 — Severity Banner & Regulation Badge

**Sprint:** sprint_075
**Priority:** P0
**Status:** DONE

## User Story

As a CDL driver,
I want to see the severity of my violation and the specific regulation I'm charged under displayed prominently,
So that I immediately understand how serious my situation is and what law applies.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/case-detail/case-detail.component.html`
- `frontend/src/app/features/driver/case-detail/case-detail.component.ts`
- `frontend/src/app/features/driver/case-detail/case-detail.component.scss`

### Database Changes
- None

## Acceptance Criteria

### Severity Banner

- [x] Thin color-coded banner strip displayed in the case hero section, below the status badge
- [x] 4 severity levels with distinct colors:
  - **Critical** — red background (`#dc2626`), white text, icon: `⛔`
    - Text: "Critical Violation — CDL at risk"
    - Applied to: DUI, Suspension, Hazmat, Railroad Crossing
  - **Serious** — orange background (`#ea580c`), white text, icon: `⚠️`
    - Text: "Serious Violation — May affect CDL status"
    - Applied to: Speeding, Reckless Driving, HOS/Logbook, DQF
  - **Standard** — blue background (`#2563eb`), white text, icon: `ℹ️`
    - Text: "Standard Violation"
    - Applied to: DOT Inspection, Equipment Defect, Overweight, CSA Score
  - **Minor** — teal background (`#1dad8c`), white text, icon: `✓`
    - Text: "Minor Violation"
    - Applied to: Seatbelt/Cell Phone
- [x] Severity derived from `caseData().violation_severity` if present, otherwise from `VIOLATION_TYPE_REGISTRY[type].severity`
- [x] Banner has `role="status"` and `aria-label` with full severity text
- [x] Banner pill shape with 8px border-radius, padding 6px 16px
- [x] Banner only shows when violation_type is set

### Regulation Reference Badge

- [x] Pill-shaped badge displayed next to the violation type label in the hero section
- [x] Shows the CFR regulation section: e.g., `"49 CFR 395.3"` or `"49 CFR 383.51"`
- [x] Source: `caseData().violation_regulation_code` (if set) OR `VIOLATION_TYPE_REGISTRY[type].regulationRef` (fallback)
- [x] Badge styling: outlined pill, 12px text, muted border, monospace font for regulation code
- [x] Clickable: opens eCFR.gov URL in new tab: `https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-{part}`
  - Parse part number from regulation code (e.g., "49 CFR 395.3" → part 395)
  - `target="_blank"` with `rel="noopener noreferrer"`
- [x] Tooltip on hover: "View full regulation text on eCFR.gov"
- [x] `aria-label`: "Regulation reference: 49 CFR 395.3 — opens in new tab"
- [x] If no regulation code available (neither from case data nor registry), badge is hidden

### Regulation Reference per Type (from Registry)

- [x] `speeding` → "49 CFR 392.2"
- [x] `dui` → "49 CFR 383.51"
- [x] `reckless_driving` → "49 CFR 383.51"
- [x] `seatbelt_cell_phone` → "49 CFR 392.16"
- [x] `hos_logbook` → "49 CFR 395"
- [x] `dot_inspection` → "49 CFR 396"
- [x] `dqf` → "49 CFR 391"
- [x] `suspension` → "49 CFR 383.51"
- [x] `csa_score` → "49 CFR 385"
- [x] `equipment_defect` → "49 CFR 393"
- [x] `overweight_oversize` → "49 CFR 392.2" (state-specific)
- [x] `hazmat` → "49 CFR 171-180"
- [x] `railroad_crossing` → "49 CFR 392.10"
- [x] `other` → no badge shown

### Visual Integration

- [x] Severity banner and regulation badge together in hero, not crowding existing status badge
- [x] On mobile: severity banner wraps to next line below status badge; regulation badge wraps below violation type label
- [x] On desktop: all badges in a single horizontal row with 8px gaps
- [x] Consistent with teal design system (severity banner colors are the exception, by design)

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `case-detail.component.ts` | `case-detail.component.spec.ts` | VD-8 |

## Dependencies

- Depends on: Sprint 074 (VT-2 registry with regulationRef, VT-1 DB columns)
- Blocked by: Sprint 074 completion
- Blocks: None

## Notes

- The severity banner intentionally uses non-teal colors (red/orange/blue) to create urgency and visual differentiation from the normal teal design system
- eCFR.gov links are stable — the URL pattern `/current/title-49/subtitle-B/chapter-III/subchapter-B/part-{N}` has been consistent
- If `violation_regulation_code` is set on the case (operator/attorney entered a specific section), it takes precedence over the registry's generic `regulationRef`
- The banner provides immediate "at a glance" severity understanding — it's the first thing the driver sees about their violation's seriousness
- Critical violations (red banner) should create urgency — these are CDL-threatening situations
