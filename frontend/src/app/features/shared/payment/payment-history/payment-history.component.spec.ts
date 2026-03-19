import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { PaymentHistoryComponent, PaymentTransaction, PaymentStats } from './payment-history.component';

const STATS_URL = '/api/payments/user/me/stats';
const PAYMENTS_URL = '/api/payments/user/me';

function makeStats(overrides: Partial<PaymentStats> = {}): PaymentStats {
  return {
    total_amount: 1000, paid_amount: 650, pending_amount: 200,
    failed_amount: 100, refunded_amount: 50, transaction_count: 8,
    paid_count: 4, pending_count: 2, failed_count: 1, refunded_count: 1,
    currency: 'USD', ...overrides,
  };
}

function makePayment(overrides: Partial<PaymentTransaction> = {}): PaymentTransaction {
  return {
    id: 'p1', user_id: 'u1', amount: 450, currency: 'USD',
    status: 'succeeded', description: 'Attorney Fee',
    card_brand: 'visa', card_last4: '4242', receipt_url: 'https://stripe.com/receipt',
    created_at: '2026-03-14T14:42:00Z',
    case: { id: 'c1', case_number: 'CASE-2026-000058', violation_type: 'Speeding' },
    attorney: { name: 'James Wilson' },
    ...overrides,
  };
}

describe('PaymentHistoryComponent', () => {
  let component: PaymentHistoryComponent;
  let fixture: ComponentFixture<PaymentHistoryComponent>;
  let httpMock: HttpTestingController;
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentHistoryComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentHistoryComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    snackBarSpy = vi.spyOn(TestBed.inject(MatSnackBar), 'open');
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushInitialRequests(payments: PaymentTransaction[] = [], stats?: PaymentStats) {
    const statsReq = httpMock.expectOne(req => req.url.includes('/user/me/stats'));
    statsReq.flush({ success: true, data: stats || makeStats() });

    const paymentsReq = httpMock.expectOne(req => req.url.includes('/user/me') && !req.url.includes('/stats'));
    paymentsReq.flush({
      success: true,
      data: payments,
      pagination: { page: 1, per_page: 10, total: payments.length, total_pages: 1 },
    });
  }

  // ─── Initialization ────────────────────────────────

  it('should create', () => {
    fixture.detectChanges();
    flushInitialRequests();
    expect(component).toBeTruthy();
  });

  it('loads stats and payments on init', () => {
    fixture.detectChanges();
    flushInitialRequests([makePayment()], makeStats());

    expect(component.stats()).toEqual(makeStats());
    expect(component.payments().length).toBe(1);
    expect(component.totalItems()).toBe(1);
    expect(component.loading()).toBe(false);
    expect(component.loadingStats()).toBe(false);
  });

  // ─── KPI Cards ─────────────────────────────────────

  it('displays stats values correctly', () => {
    fixture.detectChanges();
    flushInitialRequests([], makeStats({ total_amount: 1500, paid_amount: 1000 }));
    fixture.detectChanges();

    expect(component.formatCurrency(component.stats()!.total_amount)).toBe('$1,500.00');
    expect(component.formatCurrency(component.stats()!.paid_amount)).toBe('$1,000.00');
  });

  it('shows zero values when stats are empty', () => {
    fixture.detectChanges();
    flushInitialRequests([], makeStats({ total_amount: 0, paid_amount: 0, pending_amount: 0, transaction_count: 0 }));

    expect(component.stats()!.total_amount).toBe(0);
    expect(component.stats()!.transaction_count).toBe(0);
  });

  // ─── Filtering ─────────────────────────────────────

  it('applies filters and resets page to 1', () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.currentPage.set(3);
    component.filterForm.patchValue({ status: 'succeeded', searchTerm: 'attorney' });
    component.applyFilters();

    const req = httpMock.expectOne(r => r.url.includes('/user/me') && !r.url.includes('/stats'));
    expect(req.request.params.get('status')).toBe('succeeded');
    expect(req.request.params.get('search')).toBe('attorney');
    expect(req.request.params.get('page')).toBe('1');
    req.flush({ success: true, data: [], pagination: { page: 1, per_page: 10, total: 0, total_pages: 0 } });

    expect(component.currentPage()).toBe(1);
  });

  it('tracks applied filter chips', () => {
    fixture.detectChanges();
    flushInitialRequests();

    expect(component.hasActiveFilters()).toBe(false);

    component.filterForm.patchValue({ status: 'failed', minAmount: 100 });
    component.applyFilters();

    const req = httpMock.expectOne(r => r.url.includes('/user/me') && !r.url.includes('/stats'));
    req.flush({ success: true, data: [], pagination: { page: 1, per_page: 10, total: 0, total_pages: 0 } });

    expect(component.hasActiveFilters()).toBe(true);
    expect(component.activeFilterChips().length).toBe(2);
    expect(component.activeFilterChips()[0].key).toBe('status');
    expect(component.activeFilterChips()[1].key).toBe('minAmount');
  });

  it('removes individual filter chip', () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.filterForm.patchValue({ status: 'pending', searchTerm: 'test' });
    component.applyFilters();
    httpMock.expectOne(r => r.url.includes('/user/me') && !r.url.includes('/stats')).flush({
      success: true, data: [], pagination: { page: 1, per_page: 10, total: 0, total_pages: 0 },
    });

    expect(component.activeFilterChips().length).toBe(2);

    component.removeChip('status');
    const req2 = httpMock.expectOne(r => r.url.includes('/user/me') && !r.url.includes('/stats'));
    req2.flush({ success: true, data: [], pagination: { page: 1, per_page: 10, total: 0, total_pages: 0 } });

    expect(component.filterForm.get('status')!.value).toBe('all');
    expect(component.activeFilterChips().length).toBe(1);
  });

  it('resets all filters and reloads', () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.filterForm.patchValue({ status: 'failed', searchTerm: 'x' });
    component.resetFilters();

    // Expect both stats and payments reload
    httpMock.expectOne(r => r.url.includes('/user/me/stats')).flush({ success: true, data: makeStats() });
    httpMock.expectOne(r => r.url.includes('/user/me') && !r.url.includes('/stats')).flush({
      success: true, data: [], pagination: { page: 1, per_page: 10, total: 0, total_pages: 0 },
    });

    expect(component.filterForm.get('status')!.value).toBe('all');
    expect(component.filterForm.get('searchTerm')!.value).toBe('');
    expect(component.hasActiveFilters()).toBe(false);
  });

  // ─── Sorting ───────────────────────────────────────

  it('toggles sort direction', () => {
    fixture.detectChanges();
    flushInitialRequests();

    expect(component.sortState()).toEqual({ column: 'created_at', direction: 'desc' });

    component.toggleSort('created_at');
    httpMock.expectOne(r => r.url.includes('/user/me') && !r.url.includes('/stats')).flush({
      success: true, data: [], pagination: { page: 1, per_page: 10, total: 0, total_pages: 0 },
    });

    expect(component.sortState()).toEqual({ column: 'created_at', direction: 'asc' });
  });

  it('switches to new sort column with desc default', () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.toggleSort('amount');
    const req = httpMock.expectOne(r => r.url.includes('/user/me') && !r.url.includes('/stats'));
    expect(req.request.params.get('sort_by')).toBe('amount');
    expect(req.request.params.get('sort_dir')).toBe('desc');
    req.flush({ success: true, data: [], pagination: { page: 1, per_page: 10, total: 0, total_pages: 0 } });
  });

  // ─── Pagination ────────────────────────────────────

  it('computes page info correctly', () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.currentPage.set(1);
    component.perPage.set(10);
    component.totalItems.set(42);

    expect(component.pageInfo()).toBe('1\u201310 of 42');
    expect(component.totalPages()).toBe(5);
  });

  it('computes page numbers with windowing', () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.totalItems.set(100);
    component.perPage.set(10);
    component.currentPage.set(5);

    const pages = component.pageNumbers();
    expect(pages).toEqual([3, 4, 5, 6, 7]);
  });

  it('navigates to a specific page', () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.totalItems.set(50);
    component.goToPage(3);

    const req = httpMock.expectOne(r => r.url.includes('/user/me') && !r.url.includes('/stats'));
    expect(req.request.params.get('page')).toBe('3');
    req.flush({ success: true, data: [], pagination: { page: 3, per_page: 10, total: 50, total_pages: 5 } });

    expect(component.currentPage()).toBe(3);
  });

  it('ignores invalid page navigation', () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.goToPage(0);
    component.goToPage(-1);
    httpMock.expectNone(r => r.url.includes('/user/me') && !r.url.includes('/stats'));
  });

  // ─── Empty / Error States ──────────────────────────

  it('sets isEmpty when no payments returned', () => {
    fixture.detectChanges();
    flushInitialRequests([]);

    expect(component.isEmpty()).toBe(true);
  });

  it('sets error state on API failure', () => {
    fixture.detectChanges();

    httpMock.expectOne(r => r.url.includes('/user/me/stats')).flush({ success: true, data: makeStats() });
    httpMock.expectOne(r => r.url.includes('/user/me') && !r.url.includes('/stats')).error(new ProgressEvent('Network error'));

    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  // ─── Formatting Helpers ────────────────────────────

  it('formats currency correctly', () => {
    expect(component.formatCurrency(450)).toBe('$450.00');
    expect(component.formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('formats date and time', () => {
    const date = '2026-03-14T14:42:00Z';
    expect(component.formatDateShort(date)).toContain('Mar');
    expect(component.formatDateShort(date)).toContain('2026');
    expect(component.formatTime(date)).toMatch(/\d+:\d+\s*(AM|PM)/);
  });

  it('maps status labels', () => {
    expect(component.getStatusLabel('succeeded')).toBe('Paid');
    expect(component.getStatusLabel('pending')).toBe('Pending');
    expect(component.getStatusLabel('failed')).toBe('Failed');
    expect(component.getStatusLabel('refunded')).toBe('Refunded');
  });

  it('maps status CSS classes', () => {
    expect(component.getStatusClass('succeeded')).toBe('status-paid');
    expect(component.getStatusClass('failed')).toBe('status-failed');
  });

  it('detects transaction type from description and status', () => {
    expect(component.getTransactionType(makePayment({ description: 'Refund for case' }))).toBe('refund');
    expect(component.getTransactionType(makePayment({ status: 'failed' }))).toBe('failed');
    expect(component.getTransactionType(makePayment({ description: 'Filing Fee' }))).toBe('filing');
    expect(component.getTransactionType(makePayment({ description: 'Attorney Fee' }))).toBe('attorney_fee');
  });

  it('returns correct amount prefix', () => {
    expect(component.getAmountPrefix(makePayment({ status: 'refunded' }))).toBe('+');
    expect(component.getAmountPrefix(makePayment({ status: 'succeeded' }))).toBe('-');
  });

  it('maps card brand abbreviations', () => {
    expect(component.getCardBrandAbbr('visa')).toBe('VISA');
    expect(component.getCardBrandAbbr('mastercard')).toBe('MC');
    expect(component.getCardBrandAbbr('amex')).toBe('AMEX');
    expect(component.getCardBrandAbbr(undefined)).toBe('CARD');
  });

  // ─── Row Actions ───────────────────────────────────

  it('calls receipt download endpoint', () => {
    fixture.detectChanges();
    flushInitialRequests();

    const payment = makePayment();
    const event = new Event('click');
    vi.spyOn(event, 'stopPropagation');

    component.downloadReceipt(payment, event);

    expect(event.stopPropagation).toHaveBeenCalled();
    const req = httpMock.expectOne(r => r.url.includes(`/${payment.id}/receipt`));
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['pdf content'], { type: 'application/pdf' }));

    expect(snackBarSpy).toHaveBeenCalledWith('Receipt downloaded', 'Close', expect.any(Object));
  });

  it('skips receipt download when no receipt_url', () => {
    fixture.detectChanges();
    flushInitialRequests();

    const payment = makePayment({ receipt_url: undefined });
    component.downloadReceipt(payment, new Event('click'));

    httpMock.expectNone(r => r.url.includes('/receipt'));
  });

  it('navigates to case payment page on viewDetails', () => {
    fixture.detectChanges();
    flushInitialRequests();

    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const payment = makePayment({ status: 'pending' });
    component.viewDetails(payment, new Event('click'));

    expect(navSpy).toHaveBeenCalledWith(['/driver/cases', 'c1', 'pay']);
  });

  // ─── CSV Export ────────────────────────────────────

  it('shows snackbar when no data to export', async () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.totalItems.set(0);
    await component.exportCsv();

    expect(snackBarSpy).toHaveBeenCalledWith('No data to export', 'Close', expect.any(Object));
  });

  it('fetches all data and creates CSV blob', async () => {
    fixture.detectChanges();
    flushInitialRequests([makePayment()]);

    component.totalItems.set(1);
    const createSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});

    const exportPromise = component.exportCsv();

    const req = httpMock.expectOne(r => r.url.includes('/user/me') && r.params.get('per_page') === '9999');
    req.flush({
      success: true,
      data: [makePayment()],
      pagination: { page: 1, per_page: 9999, total: 1, total_pages: 1 },
    });

    await exportPromise;

    expect(createSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith('Data exported successfully', 'Close', expect.any(Object));

    createSpy.mockRestore();
    revokeSpy.mockRestore();
  });
});
