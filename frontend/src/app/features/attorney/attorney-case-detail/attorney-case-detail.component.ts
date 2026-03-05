import {
  Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';

import { CaseService } from '../../../core/services/case.service';

@Component({
  selector: 'app-attorney-case-detail',
  templateUrl: './attorney-case-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatListModule,
  ]
})
export class AttorneyCaseDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private caseService = inject(CaseService);
  private snackBar = inject(MatSnackBar);

  caseId = signal('');
  caseData = signal<any>(null);
  documents = signal<any[]>([]);
  loading = signal(true);
  processing = signal(false);
  selectedStatus = '';

  readonly UPDATABLE_STATUSES = [
    { value: 'send_info_to_attorney', label: 'Working on case' },
    { value: 'waiting_for_driver', label: 'Need info from driver' },
    { value: 'call_court', label: 'Calling court' },
    { value: 'check_with_manager', label: 'Escalate to manager' },
    { value: 'closed', label: 'Close case' },
  ];

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.caseId.set(params['caseId']);
      this.loadCase();
      this.loadDocuments();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCase(): void {
    this.loading.set(true);
    this.caseService.getCaseById(this.caseId()).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this.caseData.set(response.data || response);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadDocuments(): void {
    this.caseService.listDocuments(this.caseId()).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => this.documents.set(response.documents || []),
      error: () => {}
    });
  }

  accept(): void {
    this.processing.set(true);
    this.caseService.acceptCase(this.caseId()).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open('Case accepted — now active in your queue', 'Close', { duration: 3000 });
        this.loadCase();
        this.processing.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to accept case', 'Close', { duration: 3000 });
        this.processing.set(false);
      }
    });
  }

  decline(): void {
    this.processing.set(true);
    this.caseService.declineCase(this.caseId()).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open('Case declined', 'Close', { duration: 3000 });
        this.router.navigate(['/attorney/dashboard']);
      },
      error: () => {
        this.snackBar.open('Failed to decline case', 'Close', { duration: 3000 });
        this.processing.set(false);
      }
    });
  }

  updateStatus(): void {
    if (!this.selectedStatus) return;
    this.processing.set(true);
    this.caseService.updateStatus(this.caseId(), this.selectedStatus).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open('Status updated', 'Close', { duration: 3000 });
        this.selectedStatus = '';
        this.loadCase();
        this.processing.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to update status', 'Close', { duration: 3000 });
        this.processing.set(false);
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'new': 'New',
      'reviewed': 'Under Review',
      'assigned_to_attorney': 'Pending Acceptance',
      'send_info_to_attorney': 'Active',
      'waiting_for_driver': 'Awaiting Driver',
      'attorney_paid': 'Payment Confirmed',
      'call_court': 'Court Proceedings',
      'check_with_manager': 'Escalated',
      'pay_attorney': 'Payment Due',
      'closed': 'Closed'
    };
    return labels[status] || status;
  }

  getFileIcon(fileType: string): string {
    if (fileType?.includes('pdf')) return 'picture_as_pdf';
    if (fileType?.includes('image')) return 'image';
    return 'insert_drive_file';
  }

  goBack(): void {
    this.router.navigate(['/attorney/dashboard']);
  }
}
