import {
  Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { CaseService } from '../../../core/services/case.service';

@Component({
  selector: 'app-operator-dashboard',
  templateUrl: './operator-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatDividerModule,
  ]
})
export class OperatorDashboardComponent implements OnInit, OnDestroy {
  private caseService = inject(CaseService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  cases = signal<any[]>([]);
  summary = signal<any>({ newCount: 0, avgAgeHours: 0, assignedToday: 0 });
  attorneys = signal<any[]>([]);
  loading = signal(true);
  assigning = signal(false);

  // Assignment form state
  selectedCaseId = signal<string | null>(null);
  selectedAttorneyId = '';
  attorneyPrice = '';

  readonly COLUMNS = ['case_number', 'customer_name', 'violation_type', 'state', 'age', 'actions'];

  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.load();
    this.loadAttorneys();
    this.refreshInterval = setInterval(() => this.load(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  load(): void {
    this.loading.set(true);
    this.caseService.getOperatorCases('new').subscribe({
      next: (response: any) => {
        this.cases.set(response.cases || []);
        this.summary.set(response.summary || { newCount: 0, avgAgeHours: 0, assignedToday: 0 });
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadAttorneys(): void {
    this.caseService.getAvailableAttorneys().subscribe({
      next: (response: any) => this.attorneys.set(response.attorneys || []),
      error: () => {}
    });
  }

  openAssign(caseId: string): void {
    this.selectedCaseId.set(caseId);
    this.selectedAttorneyId = '';
    this.attorneyPrice = '';
  }

  cancelAssign(): void {
    this.selectedCaseId.set(null);
  }

  confirmAssign(): void {
    const caseId = this.selectedCaseId();
    if (!caseId || !this.selectedAttorneyId || !this.attorneyPrice) return;

    const price = parseFloat(this.attorneyPrice);
    if (isNaN(price) || price <= 0) {
      this.snackBar.open('Enter a valid attorney fee', 'Close', { duration: 3000 });
      return;
    }

    this.assigning.set(true);
    this.caseService.assignToAttorney(caseId, this.selectedAttorneyId, price).subscribe({
      next: () => {
        this.snackBar.open('Attorney assigned successfully', 'Close', { duration: 3000 });
        this.selectedCaseId.set(null);
        this.assigning.set(false);
        this.load();
      },
      error: () => {
        this.snackBar.open('Failed to assign attorney', 'Close', { duration: 3000 });
        this.assigning.set(false);
      }
    });
  }

  viewCase(caseId: string): void {
    this.router.navigate(['/operator/cases', caseId]);
  }

  formatAge(hours: number): string {
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }
}
