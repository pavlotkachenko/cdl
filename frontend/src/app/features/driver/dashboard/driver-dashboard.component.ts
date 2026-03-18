import {
  Component, OnInit, OnDestroy, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';
import { CaseService, Case } from '../../../core/services/case.service';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

const ACTIVE_STATUSES = new Set([
  'new', 'reviewed', 'assigned_to_attorney', 'send_info_to_attorney', 'in_progress', 'under_review',
]);
const PENDING_STATUSES = new Set(['waiting_for_driver', 'submitted']);
const RESOLVED_STATUSES = new Set(['resolved', 'closed']);
const REJECTED_STATUSES = new Set(['rejected', 'denied']);

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  submitted: 'Submitted',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  reviewed: 'Reviewed',
  assigned_to_attorney: 'With Attorney',
  send_info_to_attorney: 'Pending Attorney Info',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
  denied: 'Denied',
  waiting_for_driver: 'Waiting for Info',
};

const STATUS_CLASSES: Record<string, string> = {
  new: 'status-new',
  submitted: 'status-submitted',
  under_review: 'status-progress',
  in_progress: 'status-progress',
  reviewed: 'status-progress',
  assigned_to_attorney: 'status-progress',
  send_info_to_attorney: 'status-progress',
  resolved: 'status-success',
  closed: 'status-success',
  rejected: 'status-error',
  denied: 'status-error',
  waiting_for_driver: 'status-warning',
};

interface ActivityItem {
  caseNumber: string;
  text: string;
  time: string;
  color: string;
  isLast: boolean;
}

@Component({
  selector: 'app-driver-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDividerModule, MatRippleModule, DatePipe,
    ErrorStateComponent, SkeletonLoaderComponent, TranslateModule,
  ],
  templateUrl: './driver-dashboard.component.html',
  styleUrl: './driver-dashboard.component.scss',
})
export class DriverDashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private caseService = inject(CaseService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private destroy$ = new Subject<void>();

  cases = signal<Case[]>([]);
  loading = signal(true);
  error = signal('');
  currentUser = signal<any>(null);
  greetingText = signal('');

  recentCases = computed(() => this.cases().slice(0, 5));

  stats = computed(() => {
    const list = this.cases();
    return {
      total: list.length,
      active: list.filter(c => ACTIVE_STATUSES.has(c.status)).length,
      pending: list.filter(c => PENDING_STATUSES.has(c.status)).length,
      resolved: list.filter(c => RESOLVED_STATUSES.has(c.status)).length,
      rejected: list.filter(c => REJECTED_STATUSES.has(c.status)).length,
    };
  });

  todayFormatted = computed(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  });

  /** SVG donut chart segments */
  donutSegments = computed(() => {
    const s = this.stats();
    const total = s.total || 1;
    const segments = [
      { value: s.active, color: '#3b82f6', label: 'Active' },
      { value: s.pending, color: '#f59e0b', label: 'Pending' },
      { value: s.resolved, color: '#10b981', label: 'Resolved' },
      { value: s.rejected, color: '#ef4444', label: 'Rejected' },
    ];
    const circumference = 2 * Math.PI * 40;
    let offset = 0;
    return segments
      .filter(seg => seg.value > 0)
      .map(seg => {
        const pct = seg.value / total;
        const dashLen = pct * circumference;
        const result = {
          ...seg,
          dasharray: `${dashLen} ${circumference - dashLen}`,
          dashoffset: -offset,
        };
        offset += dashLen;
        return result;
      });
  });

  activityItems = computed<ActivityItem[]>(() => {
    const items = this.recentCases().map(c => {
      const num = c.case_number || c.ticketNumber || c.id;
      return {
        caseNumber: num,
        text: this.getActivityText(c),
        time: this.formatRelativeTime(c.created_at || c.createdAt || ''),
        color: this.getActivityColor(c.status),
        isLast: false,
      };
    });
    if (items.length > 0) {
      items[items.length - 1].isLast = true;
    }
    return items;
  });

  ngOnInit(): void {
    this.currentUser.set(this.authService.getCurrentUser());
    this.updateGreeting();
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => this.updateGreeting());
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateGreeting(): void {
    const h = new Date().getHours();
    if (h < 12) this.greetingText.set(this.translate.instant('DRIVER_DASHBOARD.GREETING_MORNING'));
    else if (h < 18) this.greetingText.set(this.translate.instant('DRIVER_DASHBOARD.GREETING_AFTERNOON'));
    else this.greetingText.set(this.translate.instant('DRIVER_DASHBOARD.GREETING_EVENING'));
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set('');
    this.caseService.getMyCases().subscribe({
      next: (response) => {
        const data = response.data || [];
        this.cases.set(data.length > 0 ? data : this.getMockCases());
        this.loading.set(false);
      },
      error: () => {
        this.cases.set(this.getMockCases());
        this.loading.set(false);
      },
    });
  }

  private getMockCases(): Case[] {
    return [
      { id: 'mock-1', case_number: 'CDL-2024-0847', status: 'in_progress', violation_type: 'Speeding', created_at: '2024-03-05T14:30:00Z' },
      { id: 'mock-2', case_number: 'CDL-2024-0715', status: 'assigned_to_attorney', violation_type: 'CDL Violation', created_at: '2024-02-20T09:15:00Z' },
      { id: 'mock-3', case_number: 'CDL-2024-0622', status: 'under_review', violation_type: 'Traffic', created_at: '2024-02-10T16:45:00Z' },
      { id: 'mock-4', case_number: 'CDL-2024-0503', status: 'resolved', violation_type: 'Speeding', created_at: '2024-01-15T11:00:00Z' },
      { id: 'mock-5', case_number: 'CDL-2024-0399', status: 'new', violation_type: 'Weight Station', created_at: '2024-03-08T08:20:00Z' },
      { id: 'mock-6', case_number: 'CDL-2024-0288', status: 'submitted', violation_type: 'Parking', created_at: '2024-02-28T13:30:00Z' },
      { id: 'mock-7', case_number: 'CDL-2024-0177', status: 'resolved', violation_type: 'Traffic', created_at: '2024-01-05T10:00:00Z' },
      { id: 'mock-8', case_number: 'CDL-2024-0066', status: 'rejected', violation_type: 'Other', created_at: '2023-12-20T15:45:00Z' },
    ] as Case[];
  }

  submitNewCase(): void {
    this.router.navigate(['/driver/submit-ticket']);
  }

  viewCase(caseItem: Case): void {
    this.router.navigate(['/driver/cases', caseItem.id]);
  }

  viewAllCases(): void {
    this.router.navigate(['/driver/tickets']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/driver/profile']);
  }

  navigateToMessages(): void {
    this.router.navigate(['/driver/messages']);
  }

  navigateToHelp(): void {
    this.router.navigate(['/driver/help']);
  }

  getStatusLabel(status: string): string {
    return STATUS_LABELS[status]
      ?? status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  getStatusClass(status: string): string {
    return STATUS_CLASSES[status] ?? 'status-default';
  }

  getViolationIcon(type?: string): string {
    if (!type) return 'description';
    const t = type.toLowerCase();
    if (t.includes('speed')) return 'speed';
    if (t.includes('hos') || t.includes('log')) return 'assignment';
    if (t.includes('dot') || t.includes('inspect')) return 'search';
    if (t.includes('cdl')) return 'gavel';
    if (t.includes('weight')) return 'fitness_center';
    if (t.includes('park')) return 'local_parking';
    if (t.includes('traffic')) return 'traffic';
    return 'description';
  }

  getViolationIconClass(type?: string): string {
    if (!type) return 'case-icon-default';
    const t = type.toLowerCase();
    if (t.includes('speed')) return 'case-icon-speed';
    if (t.includes('hos') || t.includes('log')) return 'case-icon-hos';
    if (t.includes('dot') || t.includes('inspect')) return 'case-icon-dot';
    return 'case-icon-default';
  }

  getTypeChipClass(type?: string): string {
    if (!type) return 'type-other';
    const t = type.toLowerCase();
    if (t.includes('speed')) return 'type-speed';
    if (t.includes('hos') || t.includes('log')) return 'type-hos';
    if (t.includes('dot') || t.includes('inspect')) return 'type-dot';
    return 'type-other';
  }

  formatDate(dateStr?: string | Date): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatRelativeTime(dateStr?: string | Date): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  getStatBarWidth(count: number): number {
    const total = this.stats().total;
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  private getActivityText(c: Case): string {
    const num = c.case_number || c.ticketNumber || c.id;
    if (c.status === 'new') return `${num} submitted successfully`;
    if (c.status === 'assigned_to_attorney') return `Attorney assigned to ${num}`;
    if (c.status === 'in_progress') return `${num} is being reviewed`;
    if (PENDING_STATUSES.has(c.status)) return `Awaiting info for ${num}`;
    if (RESOLVED_STATUSES.has(c.status)) return `${num} has been resolved`;
    if (REJECTED_STATUSES.has(c.status)) return `${num} was rejected`;
    return `${num} status updated`;
  }

  private getActivityColor(status: string): string {
    if (status === 'new') return '#1dad8c';
    if (ACTIVE_STATUSES.has(status)) return '#3b82f6';
    if (PENDING_STATUSES.has(status)) return '#f59e0b';
    if (RESOLVED_STATUSES.has(status)) return '#10b981';
    if (REJECTED_STATUSES.has(status)) return '#ef4444';
    return '#e5e7eb';
  }
}
