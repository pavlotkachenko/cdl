# Story PA-6/7: Test Updates

## Status: DONE

## PA-6: Backend — payment.service.test.js
**18 tests, all pass**

Updated mocks and assertions:
- `createPaymentIntent`: `ticketId`→`caseId`, case data mock has `driver_id` field
- All `ticket_id` column refs in mock data changed to `case_id`
- Added assertions: Stripe metadata contains `caseId`, `cases` table is queried (not `tickets`)
- `confirmPayment`: now tests `latest_charge` expand (modern API), PGRST204 fallback
- `handlePaymentFailure`: asserts `cases` table updated, `tickets` never called
- `processRefund`: asserts `cases` table updated, `tickets` never called
- New `getCasePayments` suite (replaces `getTicketPayments`)

## PA-7: Frontend — case-payment.component.spec.ts
**25 tests, all pass**

New/updated tests:
- Attorney stats: `attorney()` signal populated from case response (win_rate, years_experience, cases_won)
- Attorney card visible in template with correct stats
- `attorney()` is null when case has no assigned attorney
- `courtDate`, `courtLocation` signals populated from API
- `planOptions` has 3 entries with correct `key` values (`'full'`, `'4'`, `'8'`)
- `processingFee` computed as 2.9% + $0.30
- `totalAmount` = amount + processingFee
- `payButtonLabel()` for full plan matches `/^Pay \$[\d,]+\.\d{2}$/`
- `payButtonLabel()` for installment contains "now"
- `firstInstallment()` returns weekly amount per plan key
- `cardNumberError`, `cardExpiryError`, `cardCvcError` are independent signals
- Mock plan options updated to match backend `getPaymentPlanOptions` response shape (payNow/fourWeek/eightWeek)
