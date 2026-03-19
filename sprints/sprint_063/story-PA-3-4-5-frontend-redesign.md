# Story PA-3/4/5: Frontend Redesign — 2-Column Layout + Split Stripe Elements

## Status: DONE

## Files Created/Modified

### case-payment.component.ts (full rewrite)
- `templateUrl` + `styleUrl` (external files)
- Split Stripe Elements: `StripeCardNumberElement`, `StripeCardExpiryElement`, `StripeCardCvcElement`
- All 3 elements created from same `stripe.elements()` instance (required for `confirmCardPayment`)
- New signals: `attorney`, `courtDate`, `courtLocation`, `cardNumberError`, `cardExpiryError`, `cardCvcError`
- Computed: `processingFee` (2.9% + $0.30), `totalAmount`, `firstInstallment`
- Plan options use typed keys: `'full' | '2' | '4' | '8'`
- Removed unused Material imports (MatCardModule, MatButtonModule, MatIconModule, MatDividerModule)

### case-payment.component.html (NEW)
2-column layout:
- **Left**: Case Summary card, Attorney card (RECOMMENDED badge, avatar, win rate/years/cases stats), Payment Plan selector (radio buttons)
- **Right**: Split Stripe card form (CardNumber + Expiry/CVC row), Order Summary (fee + processing fee + total), Pay button, Secure note
- `@if` / `@for` native Angular 21 control flow
- ARIA roles: `role="radiogroup"`, `role="list"`, `role="listitem"`, `role="alert"` on errors
- Emoji icons per design system (🔒, ✅, ⏳) — no mat-icons

### case-payment.component.scss (NEW)
- CSS Grid 2-column: `grid-template-columns: 1fr 1fr`, stacks to 1-column at ≤768px
- Stripe Elements styled via `.stripe-input` class (background, border, focus ring)
- Blue gradient pay button with hover/active/disabled states
- Attorney stats in a flex row with dividers

## Stripe Dashboard Visibility
- PaymentIntent metadata now includes `caseNumber` (human-readable case number)
- Visible in Stripe dashboard under Payment → Metadata tab
