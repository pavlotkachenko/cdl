import {
  Component, OnInit, signal, computed, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

import { AdminService, AssignmentRequest } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-assignment-requests',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatBadgeModule,
    TranslateModule,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <button mat-icon-button (click)="goBack()" [attr.aria-label]="'ADM.BACK' | translate">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ 'ADM.ASSIGNMENT_REQUESTS' | translate }}</h1>
        @if (pendingCount() > 0) {
          <span class="badge">{{ pendingCount() }}</span>
        }
      </header>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (requests().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">check_circle_outline</mat-icon>
          <p>{{ 'ADM.NO_PENDING_REQUESTS' | translate }}</p>
        </div>
      } @else {
        <div class="request-list" role="list">
          @for (req of requests(); track req.id) {
            <mat-card class="request-card" role="listitem">
              <mat-card-content>
                <div class="request-row">
                  <div class="request-info">
                    <p class="operator-name">{{ req.operator?.full_name || 'Unknown' }}</p>
                    <p class="case-info">
                      {{ req.case?.case_number || '—' }} · {{ req.case?.violation_type || '' }} · {{ req.case?.state || '' }}
                    </p>
                    <p class="request-time">{{ req.created_at | date:'medium' }}</p>
                  </div>
                  <div class="request-actions">
                    <button mat-flat-button color="primary"
                            (click)="approve(req)"
                            [disabled]="processingId() === req.id"
                            class="approve-btn">
                      @if (processingId() === req.id) {
                        <mat-spinner diameter="18"></mat-spinner>
                      } @else {
                        <mat-icon>check</mat-icon>
                      }
                      {{ 'ADM.APPROVE' | translate }}
                    </button>
                    <button mat-stroked-button color="warn"
                            (click)="reject(req)"
                            [disabled]="processingId() === req.id"
                            class="reject-btn">
                      <mat-icon>close</mat-icon>
                      {{ 'ADM.REJECT' | translate }}
                    </button>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 800px; margin: 0 auto; padding: 16px; }
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .page-header h1 { font-size: 1.25rem; font-weight: 600; margin: 0; flex: 1; }
    .badge {
      background: #1976d2; color: white; border-radius: 12px; padding: 2px 10px;
      font-size: 0.85rem; font-weight: 600;
    }

    .loading { display: flex; justify-content: center; padding: 32px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .request-list { display: flex; flex-direction: column; gap: 8px; }
    .request-card { transition: opacity 0.3s ease; }
    .request-row { display: flex; align-items: center; gap: 16px; }
    .request-info { flex: 1; }
    .operator-name { margin: 0; font-weight: 600; font-size: 0.95rem; }
    .case-info { margin: 4px 0 0; font-size: 0.85rem; color: #555; }
    .request-time { margin: 4px 0 0; font-size: 0.75rem; color: #999; }
    .request-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .approve-btn, .reject-btn { min-height: 40px; }

    @media (max-width: 600px) {
      .request-row { flex-direction: column; align-items: stretch; }
      .request-actions { justify-content: flex-end; }
    }
  `],
})
export class AdminAssignmentRequestsComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  requests = signal<AssignmentRequest[]>([]);
  processingId = signal<string | null>(null);

  pendingCount = computed(() => this.requests().length);

  ngOnInit(): void {
    this.loadRequests();
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  loadRequests(): void {
    this.loading.set(true);
    this.adminService.getAssignmentRequests().subscribe({
      next: (res) => {
        this.requests.set(res.requests || []);
        this.loading.set(false);
      },
      error: () => {
        this.requests.set([]);
        this.loading.set(false);
      },
    });
  }

  approve(req: AssignmentRequest): void {
    this.processingId.set(req.id);
    this.adminService.approveAssignmentRequest(req.id).subscribe({
      next: () => {
        this.requests.update(list => list.filter(r => r.id !== req.id));
        this.processingId.set(null);
        this.snackBar.open('Assignment approved', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.processingId.set(null);
        const msg = err?.error?.error?.message || 'Failed to approve';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      },
    });
  }

  reject(req: AssignmentRequest): void {
    const reason = prompt('Reason for rejection (optional):');
    this.processingId.set(req.id);
    this.adminService.rejectAssignmentRequest(req.id, reason || undefined).subscribe({
      next: () => {
        this.requests.update(list => list.filter(r => r.id !== req.id));
        this.processingId.set(null);
        this.snackBar.open('Assignment rejected', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.processingId.set(null);
        const msg = err?.error?.error?.message || 'Failed to reject';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      },
    });
  }
}
