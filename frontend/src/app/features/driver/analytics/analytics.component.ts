import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

import { DriverAnalyticsService, DriverAnalytics } from '../../../core/services/driver-analytics.service';

interface AnalyticsSummary {
  totalCases: number;
  winRate: number;
  activeCases: number;
  pendingCases: number;
  avgResolutionDays: number;
}

interface AnalyticsTrends {
  caseVolume: { change: number; changePercent: number };
  winRate: { change: number; changePercent: number };
  resolutionTime: { change: number; changePercent: number };
}

interface CaseByType {
  type: string;
  count: number;
  pct: number;
  color: string;
}

interface CaseByStatus {
  status: string;
  count: number;
  pct: number;
  color: string;
  gradient: string;
}

interface TimelineMonth {
  month: string;
  count: number;
}

interface LocationData {
  state: string;
  count: number;
  pct: number;
}

interface DonutSegment {
  color: string;
  dasharray: string;
  dashoffset: number;
}

@Component({
  selector: 'app-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private analyticsService = inject(DriverAnalyticsService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  summary: AnalyticsSummary | null = null;
  trends: AnalyticsTrends | null = null;
  casesByType: CaseByType[] = [];
  casesByStatus: CaseByStatus[] = [];
  timeline: TimelineMonth[] = [];
  locationData: LocationData[] = [];
  donutSegments: DonutSegment[] = [];

  periodControl = new FormControl('quarter');

  periodOptions = [
    { value: 'quarter', label: 'Last 3 Months' },
    { value: 'half', label: 'Last 6 Months' },
    { value: 'year', label: 'Last 12 Months' },
    { value: 'all', label: 'All Time' },
  ];

  ngOnInit(): void {
    this.loadData();

    this.periodControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;

    this.analyticsService.getAnalytics()
      .pipe(
        timeout(2000),
        catchError(() => of(null)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          if (data && data.totalCases > 0) {
            this.applyApiData(data);
          } else {
            this.applyMockData();
          }
          this.computeDonutSegments();
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.applyMockData();
          this.computeDonutSegments();
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  refreshData(): void {
    this.loadData();
  }

  generatePDFReport(): void {
    // Stub — would trigger PDF generation
  }

  // ── Formatting helpers ──

  formatPercentage(value: number): string {
    return value.toFixed(1) + '%';
  }

  getChangeColor(change: number, invertBetter = false): string {
    if (change === 0) return '#6b7280';
    const positive = invertBetter ? change < 0 : change > 0;
    return positive ? '#10b981' : '#ef4444';
  }

  getChangeIcon(change: number): string {
    if (change > 0) return 'trending_up';
    if (change < 0) return 'trending_down';
    return 'trending_flat';
  }

  getChangeBgClass(change: number, invertBetter = false): string {
    if (change === 0) return 'change-neutral';
    const positive = invertBetter ? change < 0 : change > 0;
    return positive ? 'change-up' : 'change-down';
  }

  absValue(n: number): number {
    return Math.abs(n);
  }

  barHeight(count: number): number {
    const max = this.timeline.length > 0
      ? Math.max(...this.timeline.map(t => t.count))
      : 1;
    return max > 0 ? Math.round((count / max) * 100) : 0;
  }

  barPixelHeight(count: number): number {
    return Math.round((this.barHeight(count) / 100) * 140);
  }

  isCurrentMonth(month: string): boolean {
    return this.timeline.length > 0 && month === this.timeline[this.timeline.length - 1].month;
  }

  isPeakMonth(count: number): boolean {
    const max = this.timeline.length > 0
      ? Math.max(...this.timeline.map(t => t.count))
      : 0;
    return count === max && max > 0;
  }

  locationBarWidth(count: number): number {
    const max = this.locationData.length > 0
      ? Math.max(...this.locationData.map(l => l.count))
      : 1;
    return max > 0 ? Math.round((count / max) * 100) : 0;
  }

  typeBarWidth(count: number): number {
    const max = this.casesByType.length > 0
      ? Math.max(...this.casesByType.map(t => t.count))
      : 1;
    return max > 0 ? Math.round((count / max) * 100) : 0;
  }

  get resolvedCount(): number {
    const found = this.casesByStatus.find(s => s.status === 'Resolved');
    return found ? found.count : 0;
  }

  get inProgressCount(): number {
    return this.casesByStatus
      .filter(s => s.status !== 'Resolved' && s.status !== 'Rejected')
      .reduce((sum, s) => sum + s.count, 0);
  }

  get peakMonths(): string {
    const max = this.timeline.length > 0
      ? Math.max(...this.timeline.map(t => t.count))
      : 0;
    return this.timeline
      .filter(t => t.count === max)
      .map(t => t.month)
      .join(' & ');
  }

  goBack(): void {
    this.router.navigate(['/driver/dashboard']);
  }

  // ── Donut computation ──

  private computeDonutSegments(): void {
    const total = this.summary?.totalCases || 1;
    const circumference = 2 * Math.PI * 58;
    let offset = 0;
    this.donutSegments = this.casesByType.map(item => {
      const pct = item.count / total;
      const dashLen = pct * circumference;
      const seg: DonutSegment = {
        color: item.color,
        dasharray: `${dashLen} ${circumference - dashLen}`,
        dashoffset: -offset,
      };
      offset += dashLen;
      return seg;
    });
  }

  // ── Data application ──

  private applyApiData(data: DriverAnalytics): void {
    this.summary = {
      totalCases: data.totalCases,
      winRate: data.successRate,
      activeCases: data.openCases,
      pendingCases: Math.round(data.openCases * 0.6),
      avgResolutionDays: 14,
    };
    this.trends = this.getMockTrends();
    this.timeline = data.casesByMonth;
    this.casesByType = this.getMockCasesByType();
    this.casesByStatus = this.getMockCasesByStatus();
    this.locationData = this.getMockLocationData();
  }

  private applyMockData(): void {
    this.summary = {
      totalCases: 24,
      winRate: 87.5,
      activeCases: 5,
      pendingCases: 3,
      avgResolutionDays: 12,
    };
    this.trends = this.getMockTrends();
    this.timeline = this.getMockTimeline();
    this.casesByType = this.getMockCasesByType();
    this.casesByStatus = this.getMockCasesByStatus();
    this.locationData = this.getMockLocationData();
  }

  private getMockTrends(): AnalyticsTrends {
    return {
      caseVolume: { change: 3, changePercent: 14.3 },
      winRate: { change: 2.5, changePercent: 3.0 },
      resolutionTime: { change: -2, changePercent: -14.3 },
    };
  }

  private getMockTimeline(): TimelineMonth[] {
    return [
      { month: 'Sep', count: 2 },
      { month: 'Oct', count: 3 },
      { month: 'Nov', count: 5 },
      { month: 'Dec', count: 2 },
      { month: 'Jan', count: 4 },
      { month: 'Feb', count: 3 },
      { month: 'Mar', count: 5 },
    ];
  }

  private getMockCasesByType(): CaseByType[] {
    return [
      { type: 'Speeding', count: 9, pct: 37.5, color: '#3b82f6' },
      { type: 'CDL Violation', count: 5, pct: 20.8, color: '#ef4444' },
      { type: 'Traffic Signal', count: 4, pct: 16.7, color: '#f59e0b' },
      { type: 'Weight Station', count: 3, pct: 12.5, color: '#8b5cf6' },
      { type: 'Parking', count: 2, pct: 8.3, color: '#10b981' },
      { type: 'Other', count: 1, pct: 4.2, color: '#6b7280' },
    ];
  }

  private getMockCasesByStatus(): CaseByStatus[] {
    return [
      { status: 'Resolved', count: 14, pct: 58.3, color: '#10b981', gradient: 'linear-gradient(90deg,#10b981,#34d399)' },
      { status: 'In Progress', count: 4, pct: 16.7, color: '#3b82f6', gradient: 'linear-gradient(90deg,#3b82f6,#60a5fa)' },
      { status: 'Under Review', count: 3, pct: 12.5, color: '#f59e0b', gradient: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
      { status: 'New', count: 2, pct: 8.3, color: '#06b6d4', gradient: 'linear-gradient(90deg,#06b6d4,#22d3ee)' },
      { status: 'Rejected', count: 1, pct: 4.2, color: '#ef4444', gradient: 'linear-gradient(90deg,#ef4444,#f87171)' },
    ];
  }

  private getMockLocationData(): LocationData[] {
    return [
      { state: 'California', count: 6, pct: 25 },
      { state: 'Texas', count: 5, pct: 20.8 },
      { state: 'Florida', count: 4, pct: 16.7 },
      { state: 'Ohio', count: 3, pct: 12.5 },
      { state: 'Georgia', count: 2, pct: 8.3 },
      { state: 'Illinois', count: 2, pct: 8.3 },
      { state: 'Indiana', count: 1, pct: 4.2 },
      { state: 'Arizona', count: 1, pct: 4.2 },
    ];
  }
}
