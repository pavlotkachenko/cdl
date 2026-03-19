# Story: SP-6 — FAQ Accordion

**Sprint:** sprint_068
**Priority:** P1
**Status:** DONE

## User Story

As a CDL driver,
I want to read answers to common subscription questions,
So that I can make informed decisions about my plan.

## Scope

### Files to Modify
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.ts`
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.html`
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.scss`

### Database Changes
- None

## Acceptance Criteria

- [ ] FAQ card with "Frequently Asked Questions" header (15px, font-weight 800)
- [ ] 4 FAQ items with question + chevron arrow:
  1. "Can I switch between plans at any time?" → "Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately and are prorated. Downgrades take effect at the end of your current billing cycle."
  2. "What happens to my cases if I cancel?" → "Your active cases remain open and your attorney continues working on them. You simply lose access to premium features like priority evaluation and consultation calls. Your data is retained for 12 months after cancellation."
  3. "Does the Unlimited plan cover court fees?" → "Yes. The Driver Unlimited plan includes lawyer and court fees for up to 2 tickets per year, and covers serious case costs up to $1,000. Additional cases beyond the 2-ticket allowance are handled at standard rates."
  4. "What is PSP/MVR examination?" → "PSP (Pre-Employment Screening Program) and MVR (Motor Vehicle Record) examinations are official record checks used to assess your driving history. Our attorneys use these to build stronger defense strategies for your cases."
- [ ] Clicking a question toggles `expandedFaqIndex` signal
- [ ] Only one FAQ expanded at a time (clicking another collapses the previous)
- [ ] Chevron SVG rotates 180° when expanded (CSS transition)
- [ ] FAQ answer area has smooth appearance (not `display:none` — use `@if` control flow)
- [ ] FAQ items have `cursor: pointer` and `hover:background: var(--teal-bg)` transition
- [ ] FAQ question has `role="button"`, `aria-expanded`, `tabindex="0"`, keyboard support (Enter/Space)

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `subscription-management.component.ts` | `subscription-management.component.spec.ts` | SP-8 |

## Dependencies

- Depends on: SP-1
- Blocked by: none

## Notes

- FAQ data is hardcoded as a readonly array in the component
- `expandedFaqIndex = signal<number | null>(null)`
- `toggleFaq(index: number)` method: sets to index if different, null if same
- `onFaqKeydown(event: KeyboardEvent, index: number)` for keyboard support
