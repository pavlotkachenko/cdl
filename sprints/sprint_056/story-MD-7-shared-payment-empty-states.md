# MD-7: Shared: migrate payment history and add consistent empty states across all roles

**Status:** TODO
**Priority:** P1
**Dependencies:** MD-1

## Description
Replace mock payment history data with real Stripe/payments API data. Ensure all roles show consistent empty state patterns when no data is available. This story also standardizes the loading, empty, and error state patterns used across all components modified in MD-2 through MD-6.

## Acceptance Criteria

- [ ] payment-history.component.ts: mock payment data removed -- from GET /api/payments/history
- [ ] Empty state component or template standardized across all roles
- [ ] Loading state uses SkeletonLoaderComponent consistently
- [ ] Error state uses ErrorStateComponent with retry button consistently
- [ ] Empty states tested: no cases, no payments, no documents, no notifications, no messages
- [ ] Payment history shows real transaction data from Stripe via the payments table
- [ ] Payment history supports pagination for users with many transactions
- [ ] Co-located spec files updated

## Files

- `frontend/src/app/features/shared/payment/payment-history/payment-history.component.ts`
- `frontend/src/app/features/shared/payment/payment-history/payment-history.component.spec.ts`

## Technical Notes

- Payment history is shared across multiple roles (drivers see their payments, attorneys see client payments, admins see all payments)
- The component likely accepts a filter parameter (user ID, case ID) to scope the payment list
- Real payment data comes from the `payments` table which mirrors Stripe transaction data
- Ensure the API endpoint supports role-based filtering (drivers only see their own payments)
- Empty state should differentiate between "no payments yet" (new user) and "no matching payments" (filtered search)
- The standardized empty/loading/error state patterns established here should be documented for use in future components
