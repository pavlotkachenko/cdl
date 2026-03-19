# Story PY-7 — Frontend: Custom Table with Enriched Rows

## Status: DONE

## Description
Replace the Material `mat-table` with a custom HTML `<table>` matching the template design. Each row displays: date + time, description with emoji icon and case details, color-coded amount, payment method with card brand icon, status badge with dot indicator, and hover-revealed action buttons.

## Template Reference (Single Row)
```
│ Mar 14, 2026  │ ⚖️ Attorney Fee — CASE-2026-000058  │ -$450.00 │ VISA •••• 4242 │ ● Paid    │ [Receipt] │
│ 9:42 AM       │    Speeding Defense · I-35 Texas      │          │                │           │           │
```

## Column Specifications

### Date Column (sortable)
- **Primary**: `Mar 14, 2026` — `font-size: 13px; font-weight: 700; color: $text-primary`
- **Secondary**: `9:42 AM` — `font-size: 11px; color: $text-muted; margin-top: 2px`
- Sort indicator: SVG arrow icon in header

### Description Column
- **Icon**: 36×36px rounded square with colored background + emoji
  - Attorney Fee → ⚖️ on `$teal-bg2`
  - Case Filing Fee → 📋 on `$amber-bg`
  - Refund → 🔁 on `$blue-bg`
  - Failed → ❌ on `$red-bg`
- **Name**: `font-size: 13px; font-weight: 800; color: $text-primary` — e.g., "Attorney Fee — CASE-2026-000058"
- **Sub**: `font-size: 11px; color: $text-muted` — e.g., "Speeding Defense · I-35 Texas"

### Amount Column (sortable)
- `font-size: 15px; font-weight: 800`
- Color coding by transaction type:
  - Paid (succeeded): `-$450.00` in `$green` (negative = money out)
  - Pending: `-$120.00` in `$amber`
  - Refunded: `+$200.00` in `$green` (positive = money back)
  - Failed: `-$375.00` in `$red`
- Sign: payments are negative (-), refunds are positive (+)

### Payment Method Column
- **Card icon**: 32×22px rounded rect with card brand abbreviation (`VISA`, `MC`, `AMEX`, `DISC`)
  - `border: 1px solid $border-light; border-radius: 4px; font-size: 11px; font-weight: 800`
- **Brand name**: `font-size: 13px; font-weight: 600; color: $text-secondary` — "Visa"
- **Last 4**: `font-size: 11px; color: $text-muted` — "•••• 4242"
- **Fallback**: When `card_brand` is null, show "Card" with generic credit card text

### Status Column
- Pill badge with dot indicator: `border-radius: 20px; padding: 5px 11px; font-size: 12px; font-weight: 700`
- **Paid** (succeeded): `color: $green; background: $green-bg; border: 1px solid $green-border`
- **Pending**: `color: $amber; background: $amber-bg; border: 1px solid $amber-border`
- **Failed**: `color: $red; background: $red-bg; border: 1px solid $red-border`
- **Refunded**: `color: $blue; background: $blue-bg; border: 1px solid $blue-border`
- Dot: 5×5px circle with `background: currentColor` before the label text

### Actions Column
- See PY-10 for details

## Table Toolbar
- Left: `🟢 Showing **X** of **Y** transactions` info text
- Right: Refresh button (SVG reload icon) + Column settings button (SVG list icon)
- Both are 32×32px bordered icon buttons with hover state

## Hidden Requirements
1. **No mat-table**: Completely remove `MatTableDataSource`, `MatSort`, `MatTableModule`. Use plain `<table>` with `@for` loop.
2. **Custom sort**: Implement sort state as a signal `sortState = signal<{ column: string; direction: 'asc' | 'desc' }>({ column: 'created_at', direction: 'desc' })`. Clicking a sortable header toggles direction. Sort is applied server-side via API params.
3. **Transaction type detection**: Derive the description icon/color from a combination of `description` text and `status`:
   - Description contains "Refund" → type = 'refund'
   - Status = 'failed' → type = 'failed'
   - Description contains "Filing Fee" → type = 'filing'
   - Default → type = 'attorney_fee'
4. **Status label mapping**: Stripe uses "succeeded" but template shows "Paid". Map: `succeeded → Paid`, `pending → Pending`, `failed → Failed`, `refunded → Refunded`.
5. **Card brand display mapping**: `visa → VISA`, `mastercard → MC`, `amex → AMEX`, `discover → DISC`, `null/unknown → CARD`
6. **Row hover**: Entire row gets `background: $teal-bg` on hover. Actions column buttons transition from `opacity: 0` to `opacity: 1`.
7. **Row click**: Clicking a row (not action buttons) could navigate to payment detail — for now, no-op but add `cursor: pointer`.
8. **Table header**: `font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; background: #fafbfc; border-bottom: 1px solid $border-light`
9. **Table cell padding**: `14px 16px`, first cell `padding-left: 22px`, last cell `padding-right: 22px`
10. **Refresh button**: Re-fetches current page with current filters
11. **Amount formatting**: Use `Intl.NumberFormat` with sign display

## Acceptance Criteria
- [x] Custom HTML table renders all 6 columns
- [x] Date column shows date + time on separate lines
- [x] Description column shows emoji icon + name + sub-description
- [x] Amount column shows color-coded signed values
- [x] Payment method shows card brand icon + name + last 4
- [x] Status badges match template colors per status
- [x] Sortable columns (date, amount) work with server-side sort
- [x] Table toolbar shows transaction count + action buttons
- [x] Row hover effect applied
- [x] No mat-table or MatTableModule in imports
