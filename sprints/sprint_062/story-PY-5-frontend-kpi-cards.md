# Story PY-5 — Frontend: KPI Summary Cards

## Status: DONE

## Description
Replace the existing 2 summary cards with 4 KPI cards matching the HTML template design: Total Amount (teal), Paid (green), Pending (amber), Transactions (blue). Each card has a colored top border, emoji icon, large number, label, and subtitle.

## Template Reference
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 💳              │ │ ✅              │ │ ⏳              │ │ 🔢              │
│ $1,145.00       │ │ $650.00         │ │ $120.00         │ │ 4               │
│ TOTAL AMOUNT    │ │ PAID            │ │ PENDING         │ │ TRANSACTIONS    │
│ All-time billing│ │ Successfully... │ │ Awaiting...     │ │ Total records   │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Visual Specifications
| Card | Emoji | Top Border | Number Color | Background |
|------|-------|-----------|--------------|------------|
| Total Amount | 💳 | $teal | $teal | $teal-bg2 |
| Paid | ✅ | $green (#10b981) | $green | $green-bg (#ecfdf5) |
| Pending | ⏳ | $amber (#f59e0b) | $amber | $amber-bg (#fffbeb) |
| Transactions | 🔢 | $blue (#3b82f6) | $blue | $blue-bg (#eff6ff) |

## Data Source
- Fetched from `GET /api/payments/user/me/stats` (PY-3)
- `total_amount` → Total Amount card
- `paid_amount` → Paid card
- `pending_amount` → Pending card
- `transaction_count` → Transactions card

## Hidden Requirements
1. **Skeleton loading**: While stats are loading, show skeleton placeholder cards (same dimensions, gray pulsing background)
2. **Format currency**: Use `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` for dollar values
3. **Zero state**: When all values are $0.00 / 0, cards still render with zero values (not hidden)
4. **Hover effect**: Cards lift slightly on hover (`translateY(-2px)`, `box-shadow` increases) per template CSS
5. **Animation**: Cards fade in with slight upward motion on load (`@keyframes fadeIn`)
6. **Grid layout**: `grid-template-columns: repeat(4, 1fr)` on desktop; `repeat(2, 1fr)` on tablet; `1fr` on mobile
7. **Design tokens**: All colors must come from `_variables.scss` — add `$green`, `$green-bg`, `$amber`, `$amber-bg`, `$blue`, `$blue-bg` if not already present

## Acceptance Criteria
- [x] 4 KPI cards rendered in a grid row
- [x] Each card has colored top border, emoji icon, formatted value, label, subtitle
- [x] Data fetched from stats endpoint
- [x] Skeleton loading state
- [x] Hover animation
- [x] Responsive grid (4 → 2 → 1 columns)
- [x] Emoji icons with `aria-hidden="true"`
