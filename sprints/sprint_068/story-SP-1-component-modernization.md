# Story: SP-1 — Component Modernization

**Sprint:** sprint_068
**Priority:** P0
**Status:** DONE

## User Story

As a developer,
I want the SubscriptionManagementComponent modernized to use external template/styles and remove Angular Material,
So that it follows the same architecture as other redesigned components.

## Scope

### Files to Create
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.html`
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.scss`

### Files to Modify
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.ts`

### Database Changes
- None

## Acceptance Criteria

- [ ] Inline `template` and `styles` extracted to external `.html` and `.scss` files
- [ ] `templateUrl` and `styleUrl` used with relative paths (e.g., `./subscription-management.component.html`)
- [ ] All Angular Material imports removed: `MatCardModule`, `MatButtonModule`, `MatIconModule`, `MatProgressSpinnerModule`, `MatSnackBar`
- [ ] `UpperCasePipe`, `CurrencyPipe`, `DatePipe` removed from imports (use custom rendering)
- [ ] `ChangeDetectionStrategy.OnPush` retained
- [ ] `inject(SubscriptionService)` retained for API calls
- [ ] Existing signals retained: `loading`, `subscription`, `plans`, `invoices`
- [ ] New signals added: `billingInterval` (`signal<'monthly' | 'annual'>('monthly')`), `expandedFaqIndex` (`signal<number | null>(null)`)
- [ ] New computed signals: `currentPlanName`, `displayPlans` (hardcoded plan data with computed prices)
- [ ] Component compiles and renders without errors

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `subscription-management.component.ts` | `subscription-management.component.spec.ts` | SP-8 |

## Dependencies

- Depends on: none
- Blocked by: none

## Notes

- This is the foundation story — all other SP stories build on top of this
- Keep `loadAll()`, `loadPlansAndInvoices()`, `loadInvoices()` methods for API data loading
- Add hardcoded plan tier data as a readonly array in the component
- The billing history table is removed from the template (replaced by trust row + FAQ)
