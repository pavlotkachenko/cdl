# Story PY-9 — Frontend: Empty State + Loading State

## Status: DONE

## Description
Implement the empty state (no transactions) and loading state matching the template design.

## Empty State
Shown when `payments.length === 0` (after loading completes):

```
┌──────────────────────────────────────────────────┐
│ Date ▼ │ Description │ Amount ▼ │ Method │ Status │ (table headers visible)
│                                                  │
│              ┌──────────┐                        │
│              │   💳     │                        │
│              └──────────┘                        │
│         No payment history yet                   │
│   Transactions will appear here once you         │
│   make your first payment to an attorney.        │
└──────────────────────────────────────────────────┘
```

### Specs
- **Icon container**: 72×72px, `border-radius: 18px`, `background: $teal-bg2`, centered, with 💳 emoji at `font-size: 30px`
- **Title**: "No payment history yet" — `font-size: 17px; font-weight: 800; color: $text-primary`
- **Subtitle**: "Transactions will appear here once you make your first payment to an attorney." — `font-size: 13px; color: $text-muted; max-width: 300px`
- **Padding**: 60px top/bottom
- **Table headers**: Still visible above the empty state (renders inside the table card, below the header row)

## Loading State
Shown while API call is in progress:

### Specs
- Full table card area shows centered `<mat-spinner diameter="40">` with "Loading payments..." text below
- KPI cards show skeleton loaders (gray pulsing rectangles matching card dimensions)
- Filter card rendered but inputs disabled during loading

## Hidden Requirements
1. **Empty state is per-filter**: If the user applies filters that return 0 results, show "No transactions match your filters" instead of the generic empty message. Include a "Clear Filters" button.
2. **KPI cards during empty**: When no payments exist at all, KPI cards show $0.00 / 0 values (not hidden)
3. **Table headers always visible**: Even in empty state, the `<thead>` row is rendered so the user sees the column structure
4. **Loading prevents interaction**: While loading, the Apply Filters button shows a spinner and is disabled
5. **Error state**: If the API call fails, show an error card with retry button. Use the same card styling but with `$red-bg` background and ⚠️ emoji.
6. **Skeleton animation**: Use `@keyframes pulse` with alternating opacity for skeleton loaders (not mat-spinner for KPI cards)

## Acceptance Criteria
- [x] Empty state rendered with emoji icon, title, subtitle when 0 payments
- [x] Table headers visible above empty state
- [x] Filter-aware empty state with "Clear Filters" button
- [x] Loading state with spinner for table area
- [x] Skeleton loaders for KPI cards during load
- [x] Error state with retry button on API failure
- [x] Emoji icon with `aria-hidden="true"`
