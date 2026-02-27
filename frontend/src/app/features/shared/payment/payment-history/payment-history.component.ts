import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export interface PaymentTransaction {
  id: string;
  user_id: string;
  attorney_name?: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  description?: string;
  receipt_url?: string;
  created_at: string;
  metadata?: any;
}

@Component({
  selector: 'app-payment-history',
  standalone: true,
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UpperCasePipe,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatCardModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
})
export class PaymentHistoryComponent implements OnInit {
  displayedColumns: string[] = ['date', 'description', 'amount', 'method', 'status', 'actions'];
  dataSource: MatTableDataSource<PaymentTransaction>;
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Filters
  filterForm = new FormGroup({
    startDate: new FormControl(null),
    endDate: new FormControl(null),
    status: new FormControl('all'),
    minAmount: new FormControl(null),
    maxAmount: new FormControl(null),
    searchTerm: new FormControl('')
  });

  statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'succeeded', label: 'Succeeded' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ];

  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<PaymentTransaction>([]);
  }

  ngOnInit(): void {
    this.loadPaymentHistory();
    this.setupFilterListeners();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Custom filter predicate
    this.dataSource.filterPredicate = (data: PaymentTransaction, filter: string) => {
      const searchTerm = filter.toLowerCase();
      return (
        data.description?.toLowerCase().includes(searchTerm) ||
        data.attorney_name?.toLowerCase().includes(searchTerm) ||
        data.payment_method.toLowerCase().includes(searchTerm) ||
        data.status.toLowerCase().includes(searchTerm)
      );
    };
  }

  setupFilterListeners(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadPaymentHistory(): void {
    this.loading = true;

    let params = new HttpParams();
    const filters = this.filterForm.value;

    if (filters.startDate) {
      params = params.set('start_date', new Date(filters.startDate).toISOString());
    }
    if (filters.endDate) {
      params = params.set('end_date', new Date(filters.endDate).toISOString());
    }
    if (filters.status && filters.status !== 'all') {
      params = params.set('status', filters.status);
    }
    if (filters.minAmount) {
      params = params.set('min_amount', (filters.minAmount * 100).toString());
    }
    if (filters.maxAmount) {
      params = params.set('max_amount', (filters.maxAmount * 100).toString());
    }

    this.http.get<PaymentTransaction[]>(`${this.apiUrl}/history`, { params }).subscribe({
      next: (transactions) => {
        this.dataSource.data = transactions;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payment history:', error);
        this.loading = false;
        this.snackBar.open('Error loading payment history', 'Close', { duration: 3000 });
      }
    });
  }

  applyFilters(): void {
    const searchTerm = this.filterForm.value.searchTerm || '';
    this.dataSource.filter = searchTerm.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  resetFilters(): void {
    this.filterForm.reset({
      status: 'all'
    });
    this.loadPaymentHistory();
  }

  downloadReceipt(transaction: PaymentTransaction): void {
    if (!transaction.receipt_url) {
      this.snackBar.open('Receipt not available', 'Close', { duration: 3000 });
      return;
    }

    this.http.get(`${this.apiUrl}/${transaction.id}/receipt`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${transaction.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Receipt downloaded', 'Close', { duration: 2000 });
      },
      error: (error) => {
        console.error('Error downloading receipt:', error);
        this.snackBar.open('Error downloading receipt', 'Close', { duration: 3000 });
      }
    });
  }

  exportToCsv(): void {
    const data = this.dataSource.filteredData;
    
    if (data.length === 0) {
      this.snackBar.open('No data to export', 'Close', { duration: 3000 });
      return;
    }

    const headers = ['Date', 'Description', 'Amount', 'Currency', 'Payment Method', 'Status'];
    const csvData = data.map(t => [
      new Date(t.created_at).toLocaleString(),
      t.description || 'N/A',
      (t.amount / 100).toFixed(2),
      t.currency.toUpperCase(),
      t.payment_method,
      t.status
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Data exported successfully', 'Close', { duration: 2000 });
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'succeeded': 'primary',
      'pending': 'accent',
      'failed': 'warn',
      'refunded': 'basic'
    };
    return colors[status.toLowerCase()] || 'basic';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'succeeded': 'check_circle',
      'pending': 'schedule',
      'failed': 'error',
      'refunded': 'undo'
    };
    return icons[status.toLowerCase()] || 'help';
  }

  getTotalAmount(): number {
    return this.dataSource.filteredData
      .filter(t => t.status === 'succeeded')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getTransactionCount(): number {
    return this.dataSource.filteredData.length;
  }
}
