import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';

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

@Component({
  selector: 'app-payment-history',
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
})
export class PaymentHistoryComponent implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/payments`;

  // Loading states
  loading = signal(false);
  loadingStats = signal(false);
  error = signal(false);

  // Data
  payments = signal<PaymentTransaction[]>([]);
  stats = signal<PaymentStats | null>(null);

  // Pagination
  currentPage = signal(1);
  perPage = signal(10);
  totalItems = signal(0);
  totalPages = computed(() => Math.ceil(this.totalItems() / this.perPage()) || 0);

  // Sort
  sortState = signal<{ column: string; direction: 'asc' | 'desc' }>({
    column: 'created_at',
    direction: 'desc',
  });

  // Applied filters snapshot (set on Apply click)
  appliedFilters = signal<Record<string, unknown>>({});

  // Retry loading
  retryingId = signal<string | null>(null);

  // Filter form
  filterForm = new FormGroup({
    searchTerm: new FormControl(''),
    status: new FormControl('all'),
    startDate: new FormControl(''),
    endDate: new FormControl(''),
    minAmount: new FormControl<number | null>(null),
    maxAmount: new FormControl<number | null>(null),
  });

  readonly statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'succeeded', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
  ];

  readonly perPageOptions = [10, 25, 50];
  readonly skeletonItems = [0, 1, 2, 3];

  // Derived
  isEmpty = computed(() => !this.loading() && this.payments().length === 0);

  activeFilterChips = computed(() => {
    const v = this.appliedFilters();
    const chips: { key: string; label: string; value: string }[] = [];
    if (v['status'] && v['status'] !== 'all') {
      const opt = this.statusOptions.find(o => o.value === v['status']);
      chips.push({ key: 'status', label: 'Status', value: opt?.label || String(v['status']) });
    }
    if (v['searchTerm']) chips.push({ key: 'searchTerm', label: 'Search', value: String(v['searchTerm']) });
    if (v['startDate']) chips.push({ key: 'startDate', label: 'From', value: String(v['startDate']) });
    if (v['endDate']) chips.push({ key: 'endDate', label: 'To', value: String(v['endDate']) });
    if (v['minAmount'] != null) chips.push({ key: 'minAmount', label: 'Min Amount', value: `$${v['minAmount']}` });
    if (v['maxAmount'] != null) chips.push({ key: 'maxAmount', label: 'Max Amount', value: `$${v['maxAmount']}` });
    return chips;
  });

  hasActiveFilters = computed(() => this.activeFilterChips().length > 0);

  pageInfo = computed(() => {
    const total = this.totalItems();
    if (total === 0) return '0 of 0';
    const start = (this.currentPage() - 1) * this.perPage() + 1;
    const end = Math.min(this.currentPage() * this.perPage(), total);
    return `${start}\u2013${end} of ${total}`;
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  ngOnInit(): void {
    this.loadStats();
    this.loadPayments();
  }

  loadStats(): void {
    this.loadingStats.set(true);
    this.http.get<{ success: boolean; data: PaymentStats }>(`${this.apiUrl}/user/me/stats`).subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loadingStats.set(false);
      },
      error: () => {
        this.loadingStats.set(false);
      },
    });
  }

  loadPayments(): void {
    this.loading.set(true);
    this.error.set(false);

    let params = new HttpParams()
      .set('page', this.currentPage().toString())
      .set('per_page', this.perPage().toString())
      .set('sort_by', this.sortState().column)
      .set('sort_dir', this.sortState().direction);

    const f = this.filterForm.value;
    if (f.status && f.status !== 'all') params = params.set('status', f.status);
    if (f.searchTerm) params = params.set('search', f.searchTerm);
    if (f.startDate) params = params.set('date_from', f.startDate);
    if (f.endDate) params = params.set('date_to', f.endDate);
    if (f.minAmount != null) params = params.set('amount_min', f.minAmount.toString());
    if (f.maxAmount != null) params = params.set('amount_max', f.maxAmount.toString());

    this.http.get<{
      success: boolean;
      data: PaymentTransaction[];
      pagination: { page: number; per_page: number; total: number; total_pages: number };
    }>(`${this.apiUrl}/user/me`, { params }).subscribe({
      next: (res) => {
        this.payments.set(res.data);
        this.totalItems.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.appliedFilters.set({ ...this.filterForm.value });
    this.currentPage.set(1);
    this.loadPayments();
  }

  resetFilters(): void {
    this.filterForm.reset({
      status: 'all', searchTerm: '', startDate: '', endDate: '',
      minAmount: null, maxAmount: null,
    });
    this.appliedFilters.set({});
    this.currentPage.set(1);
    this.loadPayments();
    this.loadStats();
  }

  removeChip(key: string): void {
    const defaults: Record<string, unknown> = {
      status: 'all', searchTerm: '', startDate: '', endDate: '',
      minAmount: null, maxAmount: null,
    };
    this.filterForm.get(key)?.setValue(defaults[key] ?? null);
    this.applyFilters();
  }

  toggleSort(column: string): void {
    const current = this.sortState();
    if (current.column === column) {
      this.sortState.set({ column, direction: current.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      this.sortState.set({ column, direction: 'desc' });
    }
    this.currentPage.set(1);
    this.loadPayments();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadPayments();
  }

  changePerPage(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.perPage.set(parseInt(select.value, 10));
    this.currentPage.set(1);
    this.loadPayments();
  }

  refreshData(): void {
    this.loadPayments();
    this.loadStats();
  }

  downloadReceipt(payment: PaymentTransaction, event: Event): void {
    event.stopPropagation();
    if (!payment.receipt_url) return;

    this.http.get(`${this.apiUrl}/${payment.id}/receipt`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${payment.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Receipt downloaded', 'Close', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Error downloading receipt', 'Close', { duration: 3000 });
      },
    });
  }

  retryPayment(payment: PaymentTransaction, event: Event): void {
    event.stopPropagation();
    const amount = this.formatCurrency(payment.amount, payment.currency);
    if (!confirm(`Retry this payment of ${amount}?`)) return;

    this.retryingId.set(payment.id);
    this.http.post<{ success: boolean; data: { payment: unknown; client_secret: string } }>(
      `${this.apiUrl}/${payment.id}/retry`, {},
    ).subscribe({
      next: (res) => {
        this.retryingId.set(null);
        const caseId = payment.case?.id;
        if (caseId && res.data?.client_secret) {
          this.router.navigate(['/driver/cases', caseId, 'pay'], {
            queryParams: { retry: 'true', intent: res.data.client_secret },
          });
        } else {
          this.snackBar.open('Payment retry initiated', 'Close', { duration: 3000 });
          this.loadPayments();
        }
      },
      error: (err) => {
        this.retryingId.set(null);
        const msg = err.error?.message || 'Failed to retry payment';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      },
    });
  }

  viewDetails(payment: PaymentTransaction, event: Event): void {
    event.stopPropagation();
    const caseId = payment.case?.id;
    if (caseId) {
      this.router.navigate(['/driver/cases', caseId, 'pay']);
    }
  }

  async exportCsv(): Promise<void> {
    const total = this.totalItems();
    if (total === 0) {
      this.snackBar.open('No data to export', 'Close', { duration: 3000 });
      return;
    }

    let params = new HttpParams()
      .set('page', '1')
      .set('per_page', '9999')
      .set('sort_by', this.sortState().column)
      .set('sort_dir', this.sortState().direction);

    const f = this.filterForm.value;
    if (f.status && f.status !== 'all') params = params.set('status', f.status!);
    if (f.searchTerm) params = params.set('search', f.searchTerm);
    if (f.startDate) params = params.set('date_from', f.startDate);
    if (f.endDate) params = params.set('date_to', f.endDate);
    if (f.minAmount != null) params = params.set('amount_min', f.minAmount.toString());
    if (f.maxAmount != null) params = params.set('amount_max', f.maxAmount.toString());

    try {
      const res = await firstValueFrom(this.http.get<{
        success: boolean;
        data: PaymentTransaction[];
        pagination: { page: number; per_page: number; total: number; total_pages: number };
      }>(`${this.apiUrl}/user/me`, { params }));

      const all = res.data;
      if (all.length === 0) {
        this.snackBar.open('No data to export', 'Close', { duration: 3000 });
        return;
      }

      const headers = ['Date', 'Time', 'Description', 'Case Number', 'Violation', 'Amount', 'Currency', 'Payment Method', 'Card Last 4', 'Status'];
      const rows = all.map(p => [
        this.formatDateShort(p.created_at),
        this.formatTime(p.created_at),
        p.description || 'Payment',
        p.case?.case_number || '',
        p.case?.violation_type || '',
        p.amount.toFixed(2),
        (p.currency || 'USD').toUpperCase(),
        this.getCardBrandName(p.card_brand),
        p.card_last4 || '',
        this.getStatusLabel(p.status),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.snackBar.open('Data exported successfully', 'Close', { duration: 2000 });
    } catch {
      this.snackBar.open('Export failed', 'Close', { duration: 3000 });
    }
  }

  // ─── Formatting Helpers ───────────────────────────────────

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  }

  formatDateShort(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      succeeded: 'Paid', pending: 'Pending', processing: 'Processing',
      failed: 'Failed', refunded: 'Refunded', cancelled: 'Cancelled',
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      succeeded: 'status-paid', pending: 'status-pending',
      failed: 'status-failed', refunded: 'status-refunded',
    };
    return map[status] || 'status-default';
  }

  getTransactionType(payment: PaymentTransaction): string {
    if (payment.description?.toLowerCase().includes('refund')) return 'refund';
    if (payment.status === 'failed') return 'failed';
    if (payment.description?.toLowerCase().includes('filing fee')) return 'filing';
    return 'attorney_fee';
  }

  getTransactionEmoji(payment: PaymentTransaction): string {
    const map: Record<string, string> = {
      attorney_fee: '\u2696\uFE0F',
      filing: '\uD83D\uDCCB',
      refund: '\uD83D\uDD01',
      failed: '\u274C',
    };
    return map[this.getTransactionType(payment)] || '\uD83D\uDCB3';
  }

  getAmountPrefix(payment: PaymentTransaction): string {
    return payment.status === 'refunded' ? '+' : '-';
  }

  getAmountClass(payment: PaymentTransaction): string {
    const map: Record<string, string> = {
      succeeded: 'amount-paid', pending: 'amount-pending',
      failed: 'amount-failed', refunded: 'amount-refunded',
    };
    return map[payment.status] || '';
  }

  getCardBrandAbbr(brand?: string): string {
    if (!brand) return 'CARD';
    const map: Record<string, string> = { visa: 'VISA', mastercard: 'MC', amex: 'AMEX', discover: 'DISC' };
    return map[brand.toLowerCase()] || brand.toUpperCase();
  }

  getCardBrandName(brand?: string): string {
    if (!brand) return 'Card';
    const map: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', discover: 'Discover' };
    return map[brand.toLowerCase()] || brand;
  }

  getSortDirection(column: string): string {
    const s = this.sortState();
    if (s.column !== column) return 'none';
    return s.direction;
  }
}
