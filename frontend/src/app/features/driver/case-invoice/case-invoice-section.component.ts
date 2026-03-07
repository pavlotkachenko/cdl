/**
 * IN-2 — CaseInvoiceSectionComponent
 * Displays invoice information for a case and provides download/print action.
 * Designed to be embedded in case detail views.
 */
import {
  Component, OnInit, input, signal, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../../environments/environment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CaseInvoice {
  invoice_number: string;
  case_number: string;
  customer_name: string;
  attorney_name: string | null;
  amount: number;
  currency: string;
  issued_at: string;
  status: string;
}

@Component({
  selector: 'app-case-invoice-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, UpperCasePipe, MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    @if (loading()) {
      <div class="inv-loading"><mat-spinner diameter="24"></mat-spinner></div>
    } @else if (invoice()) {
      <mat-card class="inv-card">
        <mat-card-content>
          <div class="inv-header">
            <div>
              <p class="inv-number">{{ invoice()!.invoice_number }}</p>
              <p class="inv-meta">Issued: {{ invoice()!.issued_at | date:'mediumDate' }}</p>
            </div>
            <p class="inv-amount">{{ invoice()!.amount | currency:invoice()!.currency.toUpperCase() }}</p>
          </div>
          @if (invoice()!.attorney_name) {
            <p class="inv-attorney">Attorney: {{ invoice()!.attorney_name }}</p>
          }
          <button mat-stroked-button (click)="downloadPdf()" class="print-btn"
                  aria-label="Download invoice as PDF">
            <mat-icon aria-hidden="true">download</mat-icon> Download PDF
          </button>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .inv-loading { display: flex; justify-content: center; padding: 16px; }
    .inv-card { margin: 16px 0; }
    .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .inv-number { margin: 0; font-weight: 600; font-size: 0.95rem; }
    .inv-meta { margin: 2px 0 0; font-size: 0.8rem; color: #666; }
    .inv-amount { margin: 0; font-size: 1.3rem; font-weight: 700; color: #1976d2; }
    .inv-attorney { margin: 0 0 12px; font-size: 0.85rem; color: #555; }
    .print-btn { margin-top: 8px; }
  `],
})
export class CaseInvoiceSectionComponent implements OnInit {
  private http = inject(HttpClient);

  caseId = input.required<string>();

  loading = signal(false);
  invoice = signal<CaseInvoice | null>(null);

  ngOnInit(): void {
    this.loadInvoice();
  }

  private loadInvoice(): void {
    this.loading.set(true);
    this.http.get<{ invoice: CaseInvoice }>(`${environment.apiUrl}/invoices/case/${this.caseId()}`).subscribe({
      next: ({ invoice }) => { this.invoice.set(invoice); this.loading.set(false); },
      error: () => { this.invoice.set(null); this.loading.set(false); },
    });
  }

  downloadPdf(): void {
    const inv = this.invoice();
    if (!inv) return;

    const doc = new jsPDF();
    const issuedDate = new Date(inv.issued_at).toLocaleDateString('en-US', { dateStyle: 'long' });
    const amountFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency.toUpperCase() }).format(inv.amount);

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CDL Ticket Management', 14, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice', 14, 28);

    // Invoice meta
    doc.setFontSize(10);
    doc.text(`Invoice #: ${inv.invoice_number}`, 14, 40);
    doc.text(`Issued: ${issuedDate}`, 14, 47);
    doc.text(`Status: ${inv.status.toUpperCase()}`, 14, 54);

    // Table
    autoTable(doc, {
      startY: 64,
      head: [['Case #', 'Driver', 'Attorney', 'Amount']],
      body: [[
        inv.case_number,
        inv.customer_name,
        inv.attorney_name ?? '—',
        amountFormatted,
      ]],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [25, 118, 210] },
    });

    doc.save(`invoice-${inv.invoice_number}.pdf`);
  }
}
