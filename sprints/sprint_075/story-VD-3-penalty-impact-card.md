# Story: VD-3 — Penalty Impact Card

**Sprint:** sprint_075
**Priority:** P1
**Status:** DONE

## User Story

As a CDL driver,
I want to see the potential penalties and consequences of my violation clearly summarized,
So that I understand what's at stake and why hiring an attorney matters.

## Scope

### Files to Create
- `frontend/src/app/shared/components/penalty-impact-card/penalty-impact-card.component.ts` (inline template/styles)

### Files to Modify
- `frontend/src/app/features/driver/case-detail/case-detail.component.html`
- `frontend/src/app/features/driver/case-detail/case-detail.component.ts`

### Database Changes
- None

## Acceptance Criteria

### Component: `PenaltyImpactCardComponent`

- [ ] Standalone component with inline template and styles
- [ ] Inputs: `violationType` (required string input), `typeSpecificData` (optional Record), `fineAmount` (optional number)
- [ ] Reads penalty data from `VIOLATION_TYPE_REGISTRY[violationType]`
- [ ] OnPush change detection

### Card Structure

- [ ] Card header: `<span aria-hidden="true">⚡</span> Potential Penalties`
- [ ] Placed in right column of case-detail, below Attorney card (or below Status Timeline if no attorney)

### Penalty Sections

**Fine Range:**
- [ ] If `fineAmount` is set: show actual fine prominently `"$1,250.00"` with "Fine Assessed" label
- [ ] Below: show typical range from registry `"Typical range: $150 – $2,500"` in muted text
- [ ] If no fine set: show only range with "Estimated Range" label

**Disqualification Risk:**
- [ ] If `disqualificationRisk: true` in registry:
  - Red warning section with icon `⛔`
  - "CDL Disqualification Risk"
  - Duration specifics based on type:
    - DUI: "1-year minimum (3-year if Hazmat)" — show 3-year if `type_specific_data.hazmat_at_time === true`
    - Railroad: "60-day immediate" — show "120-day" if `prior_rr_offenses >= 1`, "1-year" if >= 2
    - Suspension: show `disqualification_duration` from type_specific_data if available
  - Text: "Your CDL may be suspended or revoked"
- [ ] If `disqualificationRisk: false`: section hidden

**License Points:**
- [ ] Estimated points impact based on violation type:
  - Speeding: "4-6 points (varies by state and mph over)"
  - DUI: "6-8 points"
  - Reckless: "4-6 points"
  - Others: "2-4 points" or "Varies by state"
- [ ] Note: "Point values vary by state. Check your state DMV."

**FMCSA Consequences:**
- [ ] For CDL-specific violations, show FMCSA-specific consequences:
  - "Two serious traffic violations within 3 years → 60-day CDL disqualification"
  - "Three serious traffic violations within 3 years → 120-day CDL disqualification"
- [ ] Only shown for types where FMCSA consequences apply (moving violations + HOS + DQF)

**Attorney Value Proposition:**
- [ ] Bottom section with teal background:
  - Icon: `🛡️`
  - "An attorney may help reduce or dismiss these penalties"
  - CTA button: "Message Your Attorney" (if attorney assigned) or "Learn More" (if not)

### Responsive Design

- [ ] Desktop: card width matches right column (sidebar)
- [ ] Mobile: card spans full width, positioned after main content cards
- [ ] Penalty sections stacked vertically with 12px gaps
- [ ] Fine amount: 24px font-weight 700
- [ ] Section headers: 14px font-weight 600

### Accessibility

- [ ] Warning sections have `role="alert"` for disqualification risk
- [ ] Color-coded sections have accompanying text (not color-only)
- [ ] Fine amounts have `aria-label` with full text (e.g., "Fine assessed: one thousand two hundred fifty dollars")
- [ ] CTA button has descriptive `aria-label`

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `penalty-impact-card.component.ts` | `penalty-impact-card.component.spec.ts` | VD-8 |

## Dependencies

- Depends on: Sprint 074 (VT-2 registry with fineRange, disqualificationRisk)
- Depends on: VD-1 (violation detail card establishes pattern)
- Blocked by: Sprint 074 completion
- Blocks: None

## Notes

- This card is intentionally designed to reinforce the value of attorney representation — it's a key conversion driver
- Fine ranges are national averages from the registry; actual fines are state-specific and may differ significantly
- The "attorney value proposition" section at bottom is a soft CTA, not a hard sell — the penalties speak for themselves
- Disqualification duration logic for DUI/railroad comes from type_specific_data fields set during submission
- Points are estimates — the platform doesn't track state-specific point systems (deferred to V2)
- Component is shared (`/shared/components/`) so it can be reused in operator and attorney views
