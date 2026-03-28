# Story: VT-5 — Submit Ticket: Type Chips & Categories

**Sprint:** sprint_074
**Priority:** P1
**Status:** TODO

## User Story

As a CDL driver,
I want to see all relevant violation types organized by category when submitting a ticket,
So that I can quickly find and select the correct violation type for my situation.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.ts`
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.html`
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.scss`

### Database Changes
- None

## Acceptance Criteria

### Type Chips Update

- [ ] Replace hardcoded `VIOLATION_CHIPS` array with data derived from `VIOLATION_TYPE_REGISTRY` and `VIOLATION_CATEGORIES` (from VT-2)
- [ ] 14 active violation type chips displayed (excludes `parking`, `traffic_signal`)
- [ ] Each chip shows: emoji icon + label
- [ ] Selected chip has teal border/background highlight (`#1dad8c`)

### Category Grouping

- [ ] Chips grouped under 4 category headings:
  1. **Moving Violations** — 🚗 Speeding, 🚨 DUI, 💨 Reckless Driving, 📱 Seatbelt / Cell Phone
  2. **CDL-Specific** — 📋 HOS / Logbook, 🔍 DOT Inspection, ⚖️ DQF, 🚫 Suspension, 📊 CSA Score
  3. **Vehicle & Cargo** — 🔧 Equipment Defect, 🏋️ Overweight / Oversize, ☢️ Hazmat, 🚂 Railroad Crossing
  4. **Other** — ••• Other
- [ ] Category headings styled: 13px, font-weight 600, uppercase, muted color, 8px margin-bottom
- [ ] Each category section has 12px bottom margin between groups

### Responsive Layout

- [ ] Mobile (<768px): 2-column chip grid within each category
- [ ] Tablet (768–1024px): 3-column chip grid
- [ ] Desktop (>1024px): 4-column chip grid
- [ ] Chips have minimum width 140px, padding 12px 16px
- [ ] Chip text: 14px, icon: 18px, gap: 8px between icon and text

### Chip Interaction

- [ ] Click selects chip (only one active at a time)
- [ ] `tabindex="0"` on each chip for keyboard navigation
- [ ] Enter/Space key selects chip (existing `onChipKeydown` handler)
- [ ] `role="radio"` on each chip, `role="radiogroup"` on container
- [ ] `aria-checked="true"` on selected chip
- [ ] Focus-visible outline: 2px solid teal
- [ ] Selected chip: teal background with white text, subtle shadow

### Severity Indicator

- [ ] Small colored dot on each chip indicating severity:
  - Critical (red dot): DUI, Suspension, Hazmat, Railroad
  - Serious (orange dot): Speeding, Reckless, HOS, DQF
  - Standard (blue dot): DOT Inspection, Equipment, Overweight, CSA Score
  - Minor (green dot): Seatbelt/Cell Phone
- [ ] Dot is 6px circle, positioned top-right of chip
- [ ] `aria-label` on chip includes severity: e.g., "Speeding — Serious violation"

### Integration

- [ ] `ticketTypeForm.type` still holds the selected `violation_type` string value
- [ ] Selecting a chip still auto-advances wizard consideration (user clicks Next)
- [ ] `selectedTypeName` computed signal still works with new structure
- [ ] `isSpeedingType` computed signal still works (used by VT-6 for conditional fields)

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `submit-ticket.component.ts` | `submit-ticket.component.spec.ts` | VT-8 |

## Dependencies

- Depends on: VT-2 (violation type registry for chip data)
- Blocked by: None
- Blocks: VT-6 (conditional fields build on chip selection)

## Notes

- The `VIOLATION_CHIPS` array is replaced by deriving chips from `VIOLATION_CATEGORIES` in the registry — this ensures chips stay in sync with the registry
- Legacy types (`parking`, `traffic_signal`) are never rendered but still accepted if received from old API data
- The severity dot provides visual context about ticket seriousness before the user even selects a type
- Category grouping is especially important on mobile where 14 flat chips would require excessive scrolling
- The `ViolationChip` interface can be removed or kept as a display DTO — the source of truth is now the registry
