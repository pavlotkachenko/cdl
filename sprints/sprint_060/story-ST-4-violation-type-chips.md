# Story ST-4: Frontend — Violation Type Chip Selector

## Status: DONE

## Description
Replace the Material `mat-select` dropdown for violation type with a chip-based selector matching the template. Single-select, keyboard accessible, integrated with reactive forms.

## Design Spec (from template)
- Flex-wrap grid of chips
- Each chip: icon + label, 8px gap, 1.5px border, rounded 8px
- States:
  - **Default**: gray border, light bg, secondary text
  - **Hover**: teal border, teal-bg, teal text
  - **Selected**: teal border, teal-bg2, teal text, teal shadow ring
- Single select (clicking one deselects others)

## Violation Types (mapping to DB enum)
| Chip Label | Icon | DB Value |
|------------|------|----------|
| Speeding | 🚗 | `speeding` |
| HOS / Logbook | 📋 | `hos_logbook` |
| DOT Inspection | 🔍 | `dot_inspection` |
| Suspension | 🚫 | `suspension` |
| CSA Score | 📊 | `csa_score` |
| DQF | ⚖️ | `dqf` |
| Other | ••• | `other` |

## Implementation
- Inline in submit-ticket component (not a separate shared component — too specific)
- Bind to `ticketTypeForm.controls.type` via `(click)` + `setValue()`
- Highlight selected chip via `[class.selected]="ticketTypeForm.value.type === chip.value"`
- Keyboard: `tabindex="0"` on each chip, Enter/Space to select, role="radiogroup" + role="radio"

## Acceptance Criteria
- [ ] 7 chips rendered matching template
- [ ] Single-select: clicking one deselects others
- [ ] Selected chip visually highlighted (teal border, shadow)
- [ ] Integrates with reactive form (`ticketTypeForm.controls.type`)
- [ ] Keyboard: Tab to chip group, arrow keys between chips, Enter/Space to select
- [ ] ARIA: `role="radiogroup"`, `role="radio"`, `aria-checked`
- [ ] Form invalid until a chip is selected (Validators.required still works)

## Files to Modify
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.ts`
