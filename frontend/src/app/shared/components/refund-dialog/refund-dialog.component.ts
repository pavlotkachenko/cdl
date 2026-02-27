import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

export interface RefundDialogData {
  transactionId: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface RefundRequest {
  amount: number;
  reason: string;
  notes?: string;
}

@Component({
  selector: 'app-refund-dialog',
  standalone: true,
  templateUrl: './refund-dialog.component.html',
  styleUrls: ['./refund-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
})
export class RefundDialogComponent implements OnInit {
  refundForm: FormGroup;
  processing = false;
  maxAmount: number;

  refundReasons = [
    { value: 'duplicate', label: 'Duplicate Charge' },
    { value: 'fraudulent', label: 'Fraudulent Transaction' },
    { value: 'customer_request', label: 'Customer Request' },
    { value: 'service_not_provided', label: 'Service Not Provided' },
    { value: 'error', label: 'Processing Error' },
    { value: 'other', label: 'Other' }
  ];

  constructor(
    public dialogRef: MatDialogRef<RefundDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RefundDialogData,
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.maxAmount = data.amount / 100; // Convert from cents to dollars
    this.refundForm = this.fb.group({
      amount: [this.maxAmount, [
        Validators.required, 
        Validators.min(0.01), 
        Validators.max(this.maxAmount)
      ]],
      reason: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {}

  isPartialRefund(): boolean {
    const amount = this.refundForm.get('amount')?.value;
    return amount && amount < this.maxAmount;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.refundForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    const confirmMessage = this.isPartialRefund() 
      ? `Are you sure you want to refund ${this.formatCurrency(this.refundForm.value.amount * 100)}?`
      : `Are you sure you want to refund the full amount of ${this.formatCurrency(this.data.amount)}?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    this.processRefund();
  }

  private processRefund(): void {
    this.processing = true;

    const refundRequest: RefundRequest = {
      amount: Math.round(this.refundForm.value.amount * 100), // Convert to cents
      reason: this.refundForm.value.reason,
      notes: this.refundForm.value.notes || undefined
    };

    this.http.post(
      `${environment.apiUrl}/payments/${this.data.transactionId}/refund`,
      refundRequest
    ).subscribe({
      next: (result) => {
        this.snackBar.open('Refund processed successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error processing refund:', error);
        this.processing = false;
        const errorMessage = error.error?.message || 'Error processing refund';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  setFullAmount(): void {
    this.refundForm.patchValue({ amount: this.maxAmount });
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  }

  getAmountError(): string {
    const control = this.refundForm.get('amount');
    if (control?.hasError('required')) {
      return 'Amount is required';
    }
    if (control?.hasError('min')) {
      return 'Amount must be greater than $0.00';
    }
    if (control?.hasError('max')) {
      return `Amount cannot exceed ${this.formatCurrency(this.data.amount)}`;
    }
    return '';
  }
}
