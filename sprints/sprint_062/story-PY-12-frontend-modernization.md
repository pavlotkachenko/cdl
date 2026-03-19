# Story PY-12 — Frontend: Angular Modernization (Signals, OnPush, inject)

## Status: DONE

## Description
Refactor the PaymentHistoryComponent to follow Angular 21 conventions: signals for state, `inject()` for DI, `OnPush` change detection, `@if`/`@for` control flow, and `input()`/`output()` functions. Remove legacy patterns.

## Current State → Target

| Pattern | Current | Target |
|---------|---------|--------|
| Change detection | Default | `ChangeDetectionStrategy.OnPush` |
| DI | `constructor(private http: HttpClient, ...)` | `inject(HttpClient)`, `inject(MatSnackBar)`, `inject(Router)` |
| State | Class properties (`loading`, `unpaidCases`, etc.) | `signal()` |
| Derived state | Methods (`getTotalAmount()`, `getTransactionCount()`) | `computed()` |
| Control flow | Mixed `*ngIf`, `*ngFor`, `@if`, `@for` | All `@if`, `@for` |
| Decorator | `standalone: true` | Remove (Angular 21 default) |
| ViewChild | `@ViewChild(MatPaginator)` | Remove (no mat-paginator) |
| Lifecycle | `ngOnInit`, `ngAfterViewInit` | `ngOnInit` only (no ViewChild setup) |
| Imports | `CommonModule` | Remove (standalone default) |

## Signal State Model
```typescript
// Loading states
loading = signal(false);
loadingStats = signal(false);

// Data
payments = signal<PaymentTransaction[]>([]);
stats = signal<PaymentStats | null>(null);

// Pagination
currentPage = signal(1);
perPage = signal(10);
totalItems = signal(0);
totalPages = computed(() => Math.ceil(this.totalItems() / this.perPage()));

// Sort
sortState = signal<{ column: string; direction: 'asc' | 'desc' }>({
  column: 'created_at',
  direction: 'desc'
});

// Derived
isEmpty = computed(() => !this.loading() && this.payments().length === 0);
hasActiveFilters = computed(() => { /* check form values vs defaults */ });
activeFilterChips = computed(() => { /* build chip array from form values */ });
pageInfo = computed(() => {
  const start = (this.currentPage() - 1) * this.perPage() + 1;
  const end = Math.min(this.currentPage() * this.perPage(), this.totalItems());
  return `${start}–${end} of ${this.totalItems()}`;
});
```

## Updated Interface
```typescript
export interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';
  description?: string;
  card_brand?: string;
  card_last4?: string;
  receipt_url?: string;
  created_at: string;
  paid_at?: string;
  case?: {
    id: string;
    case_number: string;
    violation_type: string;
    location?: string;
  };
  attorney?: {
    name: string;
  };
}

export interface PaymentStats {
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  failed_amount: number;
  refunded_amount: number;
  transaction_count: number;
  paid_count: number;
  pending_count: number;
  failed_count: number;
  refunded_count: number;
  currency: string;
}
```

## Hidden Requirements
1. **Remove unused Material modules**: `MatTableModule`, `MatSortModule`, `MatPaginatorModule`, `MatChipsModule`, `MatDatepickerModule`, `MatNativeDateModule`, `MatSelectModule`, `MatCardModule`, `CommonModule`, `UpperCasePipe`, `MatIconModule`
2. **Keep needed modules**: `ReactiveFormsModule`, `MatButtonModule` (if still using mat-fab for anything), `MatTooltipModule`, `MatProgressSpinnerModule`, `TranslateModule`
3. **Service extraction**: Consider extracting API calls into a `PaymentService` in the same directory (or reuse existing). Currently uses raw `HttpClient` — keep for simplicity.
4. **Effect for data loading**: Use `effect()` to react to pagination/sort signal changes and trigger data reload, OR keep manual method calls from event handlers.
5. **Unsubscribe**: Current subscription leak in `setupFilterListeners` — since we're moving to manual apply, remove the auto-subscribe entirely.

## Acceptance Criteria
- [x] `ChangeDetectionStrategy.OnPush` set
- [x] All state managed via signals
- [x] `inject()` used for all dependencies
- [x] `@if`/`@for` used (no `*ngIf`/`*ngFor`)
- [x] `standalone: true` removed from decorator
- [x] `CommonModule` removed from imports
- [x] Unused Material modules removed
- [x] No subscription leaks
- [x] Interfaces updated with enriched fields
