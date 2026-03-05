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

interface FleetStats {
  totalDrivers: number;
  activeCases: number;
  pendingCases: number;
  resolvedCases: number;
}

@Component({
  selector: 'app-carrier-dashboard',
  standalone: true,
  templateUrl: './carrier-dashboard.component.html',
  styleUrls: ['./carrier-dashboard.component.scss'],
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
export class CarrierDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentUser: any = null;
  stats: FleetStats = {
    totalDrivers: 0,
    activeCases: 0,
    pendingCases: 0,
    resolvedCases: 0
  };

  loading = true;
  error = '';
  greeting = '';
  companyName = '';

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
        this.companyName = user?.name || 'Carrier';
      });
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = '';

    // TODO: Replace with actual carrier API service when backend endpoints are ready
    setTimeout(() => {
      this.stats = {
        totalDrivers: 0,
        activeCases: 0,
        pendingCases: 0,
        resolvedCases: 0
      };
      this.loading = false;
    }, 500);
  }

  navigateToDrivers(): void {
    this.router.navigate(['/carrier/drivers']);
  }

  navigateToCases(): void {
    this.router.navigate(['/carrier/cases']);
  }

  navigateToSettings(): void {
    this.router.navigate(['/carrier/settings']);
  }
}
