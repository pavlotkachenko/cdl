import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { CarrierService, FleetStats } from '../../../core/services/carrier.service';

@Component({
  selector: 'app-carrier-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="dashboard">
      <header class="dash-header">
        <h1>{{ greeting }}, {{ companyName() }}</h1>
        <p class="sub">Fleet overview</p>
      </header>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="48"></mat-spinner></div>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else {
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
    .loading { display: flex; justify-content: center; padding: 48px; }
    .error { color: #d32f2f; text-align: center; padding: 24px; }
    .risk-banner { display: flex; align-items: center; gap: 10px; padding: 12px 16px;
      border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; }
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
  }

  navigateToDrivers(): void { this.router.navigate(['/carrier/drivers']); }
  navigateToCases(): void { this.router.navigate(['/carrier/cases']); }
  navigateToProfile(): void { this.router.navigate(['/carrier/profile']); }
}
