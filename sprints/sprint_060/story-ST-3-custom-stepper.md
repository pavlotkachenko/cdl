# Story ST-3: Frontend — Custom Stepper Component

## Status: DONE

## Description
Replace Material `mat-stepper` with a custom horizontal stepper component matching the template design: numbered circles with connectors, color-coded states (done/current/todo), and checkmark icons for completed steps.

## Design Spec (from template)
- Horizontal layout with flex
- Each step: circle (38px) + label + connector line
- States:
  - **Done**: teal background, white checkmark, teal label, teal connector
  - **Current**: dark background (#0f2137), white number, dark label
  - **Todo**: light gray background, muted text, gray connector
- Steps: Scan → Type → Details → Submit
- Keyboard: arrow keys to navigate visible steps (non-interactive, display only)

## Implementation
- Create as a reusable shared component: `shared/components/wizard-stepper/`
- Input: `steps: { label: string }[]`, `currentStep: number`
- No Material dependency — pure HTML/CSS
- Inline SVG checkmark for done state

## Acceptance Criteria
- [ ] Stepper renders 4 steps with correct labels
- [ ] Steps before `currentStep` show as "done" with checkmark
- [ ] Current step shows with dark circle and number
- [ ] Future steps show as "todo" with gray styling
- [ ] Connector lines between steps with correct colors
- [ ] Responsive: labels hide on small screens, circles remain
- [ ] WCAG: `role="progressbar"` or `aria-current="step"` for screen readers

## Files to Create
- `frontend/src/app/shared/components/wizard-stepper/wizard-stepper.component.ts`
- `frontend/src/app/shared/components/wizard-stepper/wizard-stepper.component.spec.ts`
