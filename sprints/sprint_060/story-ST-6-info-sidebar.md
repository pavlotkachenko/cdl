# Story ST-6: Frontend — Info Sidebar Cards

## Status: DONE

## Description
Add the right-side info panel with 3 cards: Submission Progress (dynamic), Tips for Accuracy (static), and What Happens Next (static).

## Cards

### 1. Submission Progress
- Header: activity icon + "Submission Progress"
- Progress bar: `(currentStep / totalSteps) * 100`%
- Step checklist:
  - Done: teal check icon + teal text
  - Current: dark circle with number + bold text
  - Todo: gray circle + muted text
- Updates dynamically as user moves through stepper

### 2. Tips for Accuracy
- Header: warning icon (amber) + "Tips for Accuracy"
- 4 static tips with teal bullet dots:
  1. Use exact date from citation
  2. Include highway number and mile marker
  3. Court date is critical if hearing within 30 days
  4. Describe incident honestly and in detail

### 3. What Happens Next
- Header: arrow icon (green) + "What Happens Next"
- 3 items with colored bullet dots:
  1. Blue: Attorney reviews within hours
  2. Amber: Case strategy call
  3. Teal: No payment until resolved

## Responsive Behavior
- Desktop (>768px): Fixed 300px right column
- Mobile (<=768px): Cards stack below form, full width

## Acceptance Criteria
- [ ] 3 info cards rendered in right column
- [ ] Progress card updates with current stepper step
- [ ] Progress bar fills proportionally
- [ ] Step checklist reflects done/current/todo states
- [ ] Tips and What Happens Next are static content
- [ ] Cards match template styling (white bg, border, shadow, rounded)
- [ ] Mobile: cards stack below form

## Files to Modify
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.ts`
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.scss`
