import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { CarrierService, ComplianceReportRow } from '../../../core/services/carrier.service';

@Component({
  selector: 'app-compliance-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="header-row">
        <button mat-icon-button (click)="goBack()" aria-label="Go back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>DOT Compliance Report</h1>
      </div>

      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filter-row">
            <label class="date-field">
              <span>From</span>
              <input type="date" [(ngModel)]="fromDate" aria-label="Start date" class="date-input">
            </label>
            <label class="date-field">
              <span>To</span>
              <input type="date" [(ngModel)]="toDate" aria-label="End date" class="date-input">
            </label>
            <button mat-raised-button color="primary" (click)="load()" [disabled]="loading()">
              Generate
            </button>
            @if (report().length > 0) {
              <button mat-stroked-button (click)="printReport()" aria-label="Print report">
                <mat-icon aria-hidden="true">print</mat-icon> Print
              </button>
            }
          </div>
        </mat-card-content>
      </mat-card>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (report().length === 0 && generated()) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">assignment</mat-icon>
          <p>No violations found for the selected date range.</p>
        </div>
      } @else if (report().length > 0) {
        <mat-card class="report-card" id="printable-report">
          <mat-card-content>
            <div class="report-meta">
              <p class="report-title">Fleet Violation History</p>
              @if (generatedAt()) {
                <p class="generated-at">Generated: {{ generatedAt() | date:'medium' }}</p>
              }
            </div>
            <div class="table-wrap" role="region" aria-label="Compliance report table">
              <table class="report-table" aria-label="DOT compliance violations">
                <thead>
                  <tr>
                    <th scope="col">Case #</th>
                    <th scope="col">Driver</th>
                    <th scope="col">CDL</th>
                    <th scope="col">Violation</th>
                    <th scope="col">State</th>
                    <th scope="col">Status</th>
                    <th scope="col">Date</th>
                    <th scope="col">Attorney</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of report(); track row.case_number) {
                    <tr>
                      <td>{{ row.case_number }}</td>
                      <td>{{ row.driver_name }}</td>
                      <td>{{ row.cdl_number }}</td>
                      <td>{{ row.violation_type }}</td>
                      <td>{{ row.state }}</td>
                      <td><span class="status-badge status-{{ row.status }}">{{ row.status }}</span></td>
                      <td>{{ row.incident_date }}</td>
                      <td>{{ row.attorney_name || '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="row-count">{{ report().length }} violation{{ report().length !== 1 ? 's' : '' }} total</p>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 960px; margin: 0 auto; padding: 24px 16px; }
    .header-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    h1 { margin: 0; font-size: 1.4rem; }
    .filter-card { margin-bottom: 16px; }
    .filter-row { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
    .date-field { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; color: #555; }
    .date-input { padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.85rem; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 48px; color: #999; text-align: center; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .report-card { margin-top: 4px; }
    .report-meta { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
    .report-title { font-weight: 600; font-size: 1rem; margin: 0; }
    .generated-at { font-size: 0.78rem; color: #999; margin: 0; }
    .table-wrap { overflow-x: auto; }
    .report-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .report-table th { text-align: left; padding: 8px 10px; font-weight: 600;
      border-bottom: 2px solid #e0e0e0; color: #555; white-space: nowrap; }
    .report-table td { padding: 7px 10px; border-bottom: 1px solid #f0f0f0; }
    .status-badge { font-size: 0.72rem; padding: 2px 6px; border-radius: 10px;
      background: #e0e0e0; text-transform: uppercase; font-weight: 600; }
    .status-badge.status-resolved { background: #e8f5e9; color: #2e7d32; }
    .status-badge.status-closed { background: #f5f5f5; color: #757575; }
    .row-count { font-size: 0.8rem; color: #999; margin: 10px 0 0; text-align: right; }
    @media print {
      .filter-card, button { display: none !important; }
      .page { padding: 0; }
      .report-card { box-shadow: none !important; }
    }
  `],
})
export class ComplianceReportComponent implements OnInit {
  private carrierService = inject(CarrierService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  fromDate = '';
  toDate = '';
  loading = signal(false);
  report = signal<ComplianceReportRow[]>([]);
  generatedAt = signal<string | null>(null);
  generated = signal(false);

  ngOnInit(): void { this.load(); }

  goBack(): void { this.router.navigate(['/carrier/dashboard']); }

  load(): void {
    this.loading.set(true);
    this.generated.set(false);
    this.carrierService.getComplianceReport(this.fromDate || undefined, this.toDate || undefined).subscribe({
      next: (r) => {
        this.report.set(r.report);
        this.generatedAt.set(r.generated_at);
        this.loading.set(false);
        this.generated.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to generate report.', 'Close', { duration: 3000 });
      },
    });
  }

  printReport(): void { window.print(); }
}
