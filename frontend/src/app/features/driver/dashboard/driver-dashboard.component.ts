// ============================================
// Driver Dashboard Component - FINAL FIX
// Location: frontend/src/app/features/driver/dashboard/driver-dashboard.component.ts
// ============================================

import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services
import { AuthService } from '../../../core/services/auth.service';
import { CaseService, Case } from '../../../core/services/case.service';

export interface DashboardStats {
  total: number;
  active: number;
  pending: number;
  resolved: number;
  rejected: number;
}

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  templateUrl: './driver-dashboard.component.html',
  styleUrls: ['./driver-dashboard.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ]
})
export class DriverDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentUser: any = null;
  stats: DashboardStats = {
    total: 0,
    active: 0,
    pending: 0,
    resolved: 0,
    rejected: 0
  };
  
  cases: Case[] = [];
  recentCases: Case[] = [];
  loading = true;
  error = '';

  constructor(
    private authService: AuthService,
    private caseService: CaseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    console.log('✅ DriverDashboardComponent constructor called');
  }

  ngOnInit(): void {
    console.log('✅ DriverDashboardComponent ngOnInit called');
    this.loadUserData();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  get firstName(): string {
    if (this.currentUser?.full_name) {
      return this.currentUser.full_name.split(' ')[0];
    }
    return 'Driver';
  }

  private loadUserData(): void {
    console.log('🔍 Loading user data...');
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          console.log('✅ User loaded:', user);
          this.currentUser = user;
        },
        error: (err) => {
          console.error('❌ Error loading user:', err);
        }
      });
  }

  loadDashboardData(): void {
    console.log('🔍 loadDashboardData called - starting...');
    
    // Run inside Angular zone to ensure change detection works
    this.ngZone.run(() => {
      this.loading = true;
      this.error = '';
      
      console.log('🔍 Calling caseService.getMyCases()...');
      
      this.caseService.getMyCases()
        .pipe(
          takeUntil(this.destroy$),
          catchError((err) => {
            console.error('❌ Error in getMyCases:', err);
            return this.ngZone.run(() => {
              this.error = 'Failed to load dashboard data';
              return of({ data: [] });
            });
          }),
          finalize(() => {
            console.log('🏁 getMyCases completed (finalize)');
            this.ngZone.run(() => {
              this.loading = false;
              this.cdr.markForCheck();
              console.log('✅ Loading set to false in finalize');
            });
          })
        )
        .subscribe({
          next: (response: any) => {
            this.ngZone.run(() => {
              console.log('✅ Cases response received:', response);
              console.log('📊 Response type:', typeof response);
              console.log('📊 Response.data:', response.data);
              
              this.cases = response.data || response || [];
              console.log('📊 Cases array:', this.cases);
              console.log('📊 Cases count:', this.cases.length);
              
              this.recentCases = this.cases.slice(0, 5);
              console.log('📊 Recent cases:', this.recentCases.length);
              
              this.calculateStats();
              console.log('📊 Stats calculated:', this.stats);
              
              this.loading = false;
              console.log('✅ Loading set to false in subscribe');
              
              // Force change detection
              this.cdr.detectChanges();
              console.log('✅ Change detection triggered');
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              console.error('❌ Subscription error:', err);
              this.error = 'Failed to load dashboard data';
              this.loading = false;
              this.cases = [];
              this.recentCases = [];
              this.calculateStats();
              this.cdr.detectChanges();
            });
          },
          complete: () => {
            console.log('🏁 Subscription completed');
          }
        });
        
      console.log('🔍 Subscribe call made, waiting for response...');
    });
  }

  private calculateStats(): void {
    console.log('🔍 Calculating stats for', this.cases.length, 'cases');
    
    const activeStatuses = ['new', 'reviewed', 'assigned_to_attorney', 'send_info_to_attorney', 'in_progress', 'under_review'];
    const pendingStatuses = ['waiting_for_driver', 'submitted'];
    const resolvedStatuses = ['resolved', 'closed'];
    const rejectedStatuses = ['rejected', 'denied'];

    this.stats = {
      total: this.cases.length,
      active: this.cases.filter(c => activeStatuses.includes(c.status)).length,
      pending: this.cases.filter(c => pendingStatuses.includes(c.status)).length,
      resolved: this.cases.filter(c => resolvedStatuses.includes(c.status)).length,
      rejected: this.cases.filter(c => rejectedStatuses.includes(c.status)).length
    };
    
    console.log('✅ Stats:', this.stats);
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

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'new': 'New',
      'submitted': 'Submitted',
      'under_review': 'Under Review',
      'in_progress': 'In Progress',
      'reviewed': 'Reviewed',
      'assigned_to_attorney': 'With Attorney',
      'send_info_to_attorney': 'Pending Attorney Info',
      'resolved': 'Resolved',
      'closed': 'Closed',
      'rejected': 'Rejected',
      'denied': 'Denied',
      'waiting_for_driver': 'Waiting for Info'
    };
    return labels[status] || status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'new': 'status-new',
      'submitted': 'status-submitted',
      'under_review': 'status-progress',
      'in_progress': 'status-progress',
      'reviewed': 'status-progress',
      'assigned_to_attorney': 'status-progress',
      'resolved': 'status-success',
      'closed': 'status-success',
      'rejected': 'status-error',
      'denied': 'status-error',
      'waiting_for_driver': 'status-warning'
    };
    return classes[status] || 'status-default';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}