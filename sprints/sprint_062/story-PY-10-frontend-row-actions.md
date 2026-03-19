# Story PY-10 — Frontend: Row Actions (Receipt, Details, Retry)

## Status: DONE

## Description
Implement the row action buttons that appear on hover for each table row. Different actions available depending on payment status.

## Action Mapping by Status

| Status | Actions | Primary Button |
|--------|---------|----------------|
| Paid (succeeded) | Receipt | Download receipt PDF |
| Pending | Details | Navigate to case payment page |
| Failed | Retry | Initiate payment retry flow |
| Refunded | Receipt | Download receipt/refund confirmation |

## Button Specifications
- `height: 28px; padding: 0 11px; border-radius: 5px; border: 1.5px solid $border`
- `font-size: 11px; font-weight: 700; color: $text-secondary`
- **Hover**: `border-color: $teal-border; color: $teal; background: $teal-bg`
- **Retry hover**: `color: $red; border-color: $red-border` (special case for retry — danger action)
- **Visibility**: `opacity: 0` by default, transitions to `opacity: 1` when row is hovered
- Each button has a small SVG icon (11×11px) + text label

## Button Actions

### Receipt Button (Download SVG icon)
- Calls `GET /api/payments/:id/receipt` with `responseType: 'blob'`
- Triggers browser download as `receipt-{id}.pdf`
- Shows snackbar on success/error
- Disabled (not shown) when `receipt_url` is null

### Details Button
- Navigates to `/driver/cases/:caseId/pay` (the case payment page)
- Only shown for pending payments

### Retry Button (Red-tinted)
- Calls `POST /api/payments/:id/retry` (PY-4)
- On success, receives `client_secret` → navigates to `/driver/cases/:caseId/pay` with the new intent
- Shows confirmation dialog before retrying: "Retry this payment of $375.00?"
- Only shown for failed payments

## Hidden Requirements
1. **Accessibility**: Hover-revealed actions are problematic for keyboard/screen reader users. Add `aria-label` to each button and ensure they are focusable (not hidden via `display: none`, only via `opacity`). When a row receives focus-within, show actions.
2. **Mobile**: On touch devices, hover doesn't work. Show actions always (or via a "..." menu button that's always visible on mobile).
3. **Retry confirmation**: Use a simple `window.confirm()` or a Material dialog — the template doesn't specify. Use `window.confirm()` for simplicity.
4. **Retry navigation**: After successful retry, the user must re-enter card details. Navigate with query param `?retry=true&intent=pi_xxx_secret` so the payment page can pick up the new intent.
5. **Receipt fallback**: For older payments without `receipt_url`, the button should be absent, not disabled.
6. **Stop propagation**: Clicking action buttons must not trigger the row click handler (if one exists).
7. **Loading state on retry**: Show a small spinner on the retry button while the API call is in progress.

## Acceptance Criteria
- [x] Receipt button shown for paid/refunded payments with receipt_url
- [x] Details button shown for pending payments
- [x] Retry button shown for failed payments
- [x] Actions appear on row hover with opacity transition
- [x] Actions visible via focus-within for keyboard accessibility
- [x] Receipt downloads as PDF blob
- [x] Retry calls backend endpoint and navigates on success
- [x] Confirmation before retry
- [x] Mobile: actions always visible or via menu
