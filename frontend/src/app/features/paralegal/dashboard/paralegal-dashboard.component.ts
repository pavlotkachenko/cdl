import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../core/services/auth.service';

interface ParalegalStats {
  assignedCases: number;
  pendingTasks: number;
  upcomingDeadlines: number;
  documentsToReview: number;
}

@Component({
  selector: 'app-paralegal-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="dashboard-container">

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="60"></mat-spinner>
          <p>Loading your dashboard...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadDashboardData()">
            Try Again
          </button>
        </div>
      } @else {

        <div class="dashboard-header">
          <div>
            <h1>{{ greeting() }}, {{ firstName() }}!</h1>
            <p>Here's your case support overview</p>
          </div>
        </div>

        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon total">
                <mat-icon>gavel</mat-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats().assignedCases }}</h3>
                <p>Assigned Cases</p>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon active">
                <mat-icon>checklist</mat-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats().pendingTasks }}</h3>
                <p>Pending Tasks</p>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon pending">
                <mat-icon>event</mat-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats().upcomingDeadlines }}</h3>
                <p>Upcoming Deadlines</p>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon resolved">
                <mat-icon>description</mat-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats().documentsToReview }}</h3>
                <p>Documents to Review</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="section-header">
          <h2>Quick Actions</h2>
        </div>

        <div class="actions-grid">
          <mat-card class="action-card" (click)="navigateToCases()" role="button" tabindex="0"
                    (keyup.enter)="navigateToCases()" (keyup.space)="navigateToCases()">
            <mat-card-content>
              <mat-icon>gavel</mat-icon>
              <h3>View Cases</h3>
              <p>Review attorney's cases</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="action-card" (click)="navigateToDocuments()" role="button" tabindex="0"
                    (keyup.enter)="navigateToDocuments()" (keyup.space)="navigateToDocuments()">
            <mat-card-content>
              <mat-icon>upload_file</mat-icon>
              <h3>Upload Document</h3>
              <p>Add case documents</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="action-card" (click)="navigateToCalendar()" role="button" tabindex="0"
                    (keyup.enter)="navigateToCalendar()" (keyup.space)="navigateToCalendar()">
            <mat-card-content>
              <mat-icon>calendar_today</mat-icon>
              <h3>Calendar</h3>
              <p>Check deadlines &amp; dates</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="action-card">
            <mat-card-content>
              <mat-icon>help_outline</mat-icon>
              <h3>Help &amp; Support</h3>
              <p>Contact our support team</p>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card class="help-section">
          <mat-card-content>
            <div class="help-header">
              <mat-icon>lightbulb</mat-icon>
              <h3>Need Help?</h3>
            </div>
            <p>Our team is here to assist you with case support</p>
            <div class="contact-info">
              <div class="contact-item">
                <mat-icon>phone</mat-icon>
                <span>(555) 123-4567</span>
              </div>
              <div class="contact-item">
                <mat-icon>email</mat-icon>
                <span>support&#64;cdlhelp.com</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

      }
    </div>
  `,
  styles: [`
    .dashboard-container { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 0; gap: 16px; color: #888; }
    .error-state { display: flex; flex-direction: column; align-items: center; padding: 60px 0; gap: 12px; color: #888; }
    .error-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .dashboard-header { margin-bottom: 24px; }
    .dashboard-header h1 { margin: 0 0 4px; font-size: 1.6rem; }
    .dashboard-header p { margin: 0; color: #888; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .stat-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 16px; }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .stat-icon.total { background: #e3f2fd; color: #1976d2; }
    .stat-icon.active { background: #e8f5e9; color: #388e3c; }
    .stat-icon.pending { background: #fff3e0; color: #f57c00; }
    .stat-icon.resolved { background: #f3e5f5; color: #7b1fa2; }
    .stat-info h3 { margin: 0; font-size: 1.8rem; font-weight: 700; }
    .stat-info p { margin: 4px 0 0; font-size: 0.8rem; color: #888; }
    .section-header { margin-bottom: 16px; }
    .section-header h2 { margin: 0; font-size: 1.1rem; }
    .actions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .action-card { cursor: pointer; transition: box-shadow 0.2s; }
    .action-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .action-card mat-card-content { display: flex; flex-direction: column; align-items: center; padding: 24px 16px; gap: 8px; text-align: center; }
    .action-card mat-icon { font-size: 32px; width: 32px; height: 32px; color: #1976d2; }
    .action-card h3 { margin: 0; font-size: 0.95rem; }
    .action-card p { margin: 0; font-size: 0.78rem; color: #888; }
    .help-section mat-card-content { padding: 20px; }
    .help-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .help-header mat-icon { color: #f9a825; }
    .help-header h3 { margin: 0; }
    .contact-info { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
    .contact-item { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
    .contact-item mat-icon { font-size: 18px; width: 18px; height: 18px; color: #888; }
  `],
})
export class ParalegalDashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(true);
  error = signal('');
  stats = signal<ParalegalStats>({
    assignedCases: 0,
    pendingTasks: 0,
    upcomingDeadlines: 0,
    documentsToReview: 0,
  });

  firstName = computed(() => {
    const user = this.authService.currentUserValue;
    return user?.name?.split(' ')[0] || 'there';
  });

  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  constructor() {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set('');
    // TODO: Replace with real paralegal API when backend endpoints are ready
    setTimeout(() => {
      this.stats.set({ assignedCases: 0, pendingTasks: 0, upcomingDeadlines: 0, documentsToReview: 0 });
      this.loading.set(false);
    }, 0);
  }

  navigateToCases(): void {
    this.router.navigate(['/paralegal/cases']);
  }

  navigateToTasks(): void {
    this.router.navigate(['/paralegal/tasks']);
  }

  navigateToDocuments(): void {
    this.router.navigate(['/paralegal/documents']);
  }

  navigateToCalendar(): void {
    this.router.navigate(['/paralegal/calendar']);
  }
}
