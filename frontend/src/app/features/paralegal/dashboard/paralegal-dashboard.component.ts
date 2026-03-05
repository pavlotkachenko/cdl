import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  standalone: true,
  templateUrl: './paralegal-dashboard.component.html',
  styleUrls: ['./paralegal-dashboard.component.scss'],
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
export class ParalegalDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentUser: any = null;
  stats: ParalegalStats = {
    assignedCases: 0,
    pendingTasks: 0,
    upcomingDeadlines: 0,
    documentsToReview: 0
  };

  loading = true;
  error = '';
  greeting = '';
  firstName = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setGreeting();
    this.loadUserData();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Good morning';
    else if (hour < 18) this.greeting = 'Good afternoon';
    else this.greeting = 'Good evening';
  }

  private loadUserData(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.firstName = user?.name?.split(' ')[0] || 'there';
      });
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = '';

    // TODO: Replace with actual paralegal API service when backend endpoints are ready
    setTimeout(() => {
      this.stats = {
        assignedCases: 0,
        pendingTasks: 0,
        upcomingDeadlines: 0,
        documentsToReview: 0
      };
      this.loading = false;
    }, 500);
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
