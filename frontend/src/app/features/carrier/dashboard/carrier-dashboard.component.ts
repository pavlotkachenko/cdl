import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { CarrierService, FleetStats, CsaScoreResponse } from '../../../core/services/carrier.service';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-carrier-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleCasePipe, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, ErrorStateComponent, SkeletonLoaderComponent],
  template: `
    <div class="dashboard">
      <header class="dash-header">
        <h1>{{ greeting }}, {{ companyName() }}</h1>
        <p class="sub">Fleet overview</p>
      </header>

      @if (loading()) {
        <app-skeleton-loader [rows]="4" [height]="80"></app-skeleton-loader>
        <div class="skeleton-spacer"></div>
        <app-skeleton-loader [rows]="3" [height]="44"></app-skeleton-loader>
      } @else if (error()) {
        <app-error-state [message]="error()" retryLabel="Retry" (retry)="loadData()"></app-error-state>
      } @else {
        <!-- CSA Score Widget -->
        <div class="csa-widget" [class]="'csa-' + csaData().riskLevel" aria-label="CSA Risk Score">
          <div class="csa-score-block">
            <span class="csa-number">{{ csaData().csaScore }}</span>
            <span class="csa-label">CSA Risk Score</span>
          </div>
          <div class="csa-details">
            <span class="csa-risk-badge">{{ csaData().riskLevel | titlecase }} Risk</span>
            <span class="csa-sub">Based on {{ csaData().openViolations }} open violation{{ csaData().openViolations !== 1 ? 's' : '' }}</span>
            <span class="csa-hint" title="Score derived from open violation count and severity. Lower is better.">
              <mat-icon aria-hidden="true" style="font-size:14px;width:14px;height:14px">info</mat-icon>
              What is this?
            </span>
          </div>
        </div>

        <div class="risk-banner" [class]="'risk-' + riskLevel()">
          <mat-icon aria-hidden="true">{{ riskLevel() === 'green' ? 'check_circle' : riskLevel() === 'yellow' ? 'warning' : 'error' }}</mat-icon>
          <span>Risk Score: <strong>{{ riskScore() }}</strong> open violations</span>
        </div>

        <div class="stat-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon aria-hidden="true">people</mat-icon>
              <p class="stat-value">{{ stats().totalDrivers }}</p>
              <p class="stat-label">Drivers</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card active">
            <mat-card-content>
              <mat-icon aria-hidden="true">gavel</mat-icon>
              <p class="stat-value">{{ stats().activeCases }}</p>
              <p class="stat-label">Active Cases</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card pending">
            <mat-card-content>
              <mat-icon aria-hidden="true">schedule</mat-icon>
              <p class="stat-value">{{ stats().pendingCases }}</p>
              <p class="stat-label">Pending</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card resolved">
            <mat-card-content>
              <mat-icon aria-hidden="true">done_all</mat-icon>
              <p class="stat-value">{{ stats().resolvedCases }}</p>
              <p class="stat-label">Resolved</p>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="quick-actions">
          <button mat-raised-button color="primary" (click)="navigateToDrivers()">
            <mat-icon>people</mat-icon> Manage Drivers
          </button>
          <button mat-raised-button (click)="navigateToCases()">
            <mat-icon>folder_open</mat-icon> View Cases
          </button>
          <button mat-raised-button color="accent" (click)="navigateToAnalytics()">
            <mat-icon>bar_chart</mat-icon> Fleet Analytics
          </button>
          <button mat-stroked-button (click)="navigateToProfile()">
            <mat-icon>business</mat-icon> Company Profile
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard { max-width: 640px; margin: 0 auto; padding: 24px 16px; }
    .dash-header { margin-bottom: 20px; }
    .dash-header h1 { margin: 0; font-size: 1.4rem; }
    .sub { color: #666; margin: 4px 0 0; font-size: 0.875rem; }
    .skeleton-spacer { height: 20px; }
    .risk-banner { display: flex; align-items: center; gap: 10px; padding: 12px 16px;
      border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; }
    .csa-widget { display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-radius: 12px; margin-bottom: 16px; }
    .csa-low { background: #e8f5e9; color: #2e7d32; }
    .csa-medium { background: #fff8e1; color: #f57f17; }
    .csa-high { background: #ffebee; color: #c62828; }
    .csa-score-block { display: flex; flex-direction: column; align-items: center; min-width: 64px; }
    .csa-number { font-size: 2.5rem; font-weight: 800; line-height: 1; }
    .csa-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .csa-details { display: flex; flex-direction: column; gap: 2px; }
    .csa-risk-badge { font-weight: 700; font-size: 1rem; }
    .csa-sub { font-size: 0.8rem; opacity: 0.85; }
    .csa-hint { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; opacity: 0.7; cursor: help; margin-top: 4px; }
    .risk-green { background: #e8f5e9; color: #2e7d32; }
    .risk-yellow { background: #fff8e1; color: #f57f17; }
    .risk-red { background: #ffebee; color: #c62828; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat-card mat-card-content { display: flex; flex-direction: column; align-items: center; padding: 16px; gap: 4px; }
    .stat-value { font-size: 2rem; font-weight: 700; margin: 0; }
    .stat-label { font-size: 0.8rem; color: #666; margin: 0; }
    .stat-card.active .stat-value { color: #1976d2; }
    .stat-card.pending .stat-value { color: #f57c00; }
    .stat-card.resolved .stat-value { color: #388e3c; }
    .quick-actions { display: flex; flex-direction: column; gap: 10px; }
    .quick-actions button { justify-content: flex-start; }
  `],
})
export class CarrierDashboardComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private carrierService = inject(CarrierService);

  loading = signal(true);
  error = signal('');
  stats = signal<FleetStats>({ totalDrivers: 0, activeCases: 0, pendingCases: 0, resolvedCases: 0 });
  companyName = signal('Carrier');
  csaData = signal<CsaScoreResponse>({ csaScore: 0, riskLevel: 'low', openViolations: 0, breakdown: { hos: 0, maintenance: 0, speeding_major: 0, speeding_minor: 0, other: 0 } });

  riskScore = computed(() => this.stats().activeCases + this.stats().pendingCases);
  riskLevel = computed(() => {
    const score = this.riskScore();
    if (score < 5) return 'green';
    if (score <= 15) return 'yellow';
    return 'red';
  });

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user?.name) this.companyName.set(user.name);
    });
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');
    this.carrierService.getStats().subscribe({
      next: (s) => { this.stats.set(s); this.loading.set(false); },
      error: () => { this.error.set('Failed to load fleet stats. Please try again.'); this.loading.set(false); },
    });
    this.carrierService.getCsaScore().subscribe({
      next: (csa) => this.csaData.set(csa),
      error: () => { /* non-fatal — widget stays at defaults */ },
    });
  }

  navigateToDrivers(): void { this.router.navigate(['/carrier/drivers']); }
  navigateToCases(): void { this.router.navigate(['/carrier/cases']); }
  navigateToAnalytics(): void { this.router.navigate(['/carrier/analytics']); }
  navigateToProfile(): void { this.router.navigate(['/carrier/profile']); }
}
