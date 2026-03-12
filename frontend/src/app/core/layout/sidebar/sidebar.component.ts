// ============================================
// Sidebar Navigation Component (UPDATED WITH MESSAGES)
// Location: frontend/src/app/core/layout/sidebar/sidebar.component.ts
// ============================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';

// Services
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

interface NavigationItem {
  name: string;
  icon: string;
  link: string;
  badge?: number;
  dividerBefore?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatBadgeModule,
    MatDividerModule,
    TitleCasePipe,
    TranslateModule
  ]
})
export class SidebarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  notificationCount = 0;
  navigation: NavigationItem[] = [];
  userRole: string = 'driver';
  userName: string = '';

  // Driver Navigation
  private driverNavigation: NavigationItem[] = [
    { name: 'NAV.DASHBOARD', icon: 'dashboard', link: '/driver/dashboard' },
    { name: 'NAV.MY_CASES', icon: 'gavel', link: '/driver/tickets' },
    { name: 'NAV.MESSAGES', icon: 'forum', link: '/driver/messages', badge: 0 },
    { name: 'NAV.SUBMIT_TICKET', icon: 'add_circle', link: '/driver/submit-ticket' },
    { name: 'NAV.DOCUMENTS', icon: 'folder', link: '/driver/documents', dividerBefore: true },
    { name: 'NAV.ANALYTICS', icon: 'bar_chart', link: '/driver/analytics' },
    { name: 'NAV.PAYMENTS', icon: 'payment', link: '/driver/payments' },
    { name: 'NAV.NOTIFICATIONS', icon: 'notifications', link: '/driver/notifications', badge: 0 },
    { name: 'NAV.PROFILE', icon: 'person', link: '/driver/profile', dividerBefore: true },
    { name: 'NAV.HELP', icon: 'help', link: '/driver/help' }
  ];

  // Admin Navigation
  private adminNavigation: NavigationItem[] = [
    { name: 'NAV.DASHBOARD', icon: 'dashboard', link: '/admin/dashboard' },
    { name: 'NAV.CASE_MANAGEMENT', icon: 'gavel', link: '/admin/cases' },
    { name: 'NAV.STAFF_MANAGEMENT', icon: 'groups', link: '/admin/staff' },
    { name: 'NAV.CLIENT_MANAGEMENT', icon: 'people', link: '/admin/clients' },
    { name: 'NAV.REPORTS', icon: 'assessment', link: '/admin/reports' },
    { name: 'NAV.REVENUE', icon: 'attach_money', link: '/admin/revenue' },
    { name: 'NAV.DOCUMENTS', icon: 'folder', link: '/admin/documents', dividerBefore: true },
    { name: 'NAV.NOTIFICATIONS', icon: 'notifications', link: '/admin/notifications', badge: 0 },
    { name: 'NAV.SETTINGS', icon: 'settings', link: '/admin/settings', dividerBefore: true }
  ];

  // Attorney Navigation
  private attorneyNavigation: NavigationItem[] = [
    { name: 'NAV.DASHBOARD', icon: 'dashboard', link: '/attorney/dashboard' },
    { name: 'NAV.MY_CASES', icon: 'gavel', link: '/attorney/cases' },
    { name: 'NAV.CLIENTS', icon: 'people', link: '/attorney/clients' },
    { name: 'NAV.CALENDAR', icon: 'calendar_today', link: '/attorney/calendar' },
    { name: 'NAV.DOCUMENTS', icon: 'folder', link: '/attorney/documents', dividerBefore: true },
    { name: 'NAV.REPORTS', icon: 'assessment', link: '/attorney/reports' },
    { name: 'NAV.NOTIFICATIONS', icon: 'notifications', link: '/attorney/notifications', badge: 0 },
    { name: 'NAV.PROFILE', icon: 'person', link: '/attorney/profile', dividerBefore: true },
    { name: 'NAV.SUBSCRIPTION', icon: 'credit_card', link: '/attorney/subscription' }
  ];

  // Carrier Navigation
  private carrierNavigation: NavigationItem[] = [
    { name: 'NAV.DASHBOARD', icon: 'dashboard', link: '/carrier/dashboard' },
    { name: 'NAV.MY_DRIVERS', icon: 'groups', link: '/carrier/drivers' },
    { name: 'NAV.FLEET_CASES', icon: 'gavel', link: '/carrier/cases' },
    { name: 'NAV.DOCUMENTS', icon: 'folder', link: '/carrier/documents', dividerBefore: true },
    { name: 'NAV.ANALYTICS', icon: 'bar_chart', link: '/carrier/analytics' },
    { name: 'NAV.PAYMENTS', icon: 'payment', link: '/carrier/payments' },
    { name: 'NAV.WEBHOOKS', icon: 'webhook', link: '/carrier/webhooks' },
    { name: 'NAV.NOTIFICATIONS', icon: 'notifications', link: '/carrier/notifications', badge: 0 },
    { name: 'NAV.SETTINGS', icon: 'settings', link: '/carrier/settings', dividerBefore: true }
  ];

  // Paralegal Navigation
  private paralegalNavigation: NavigationItem[] = [
    { name: 'NAV.DASHBOARD', icon: 'dashboard', link: '/paralegal/dashboard' },
    { name: 'NAV.MY_CASES', icon: 'gavel', link: '/paralegal/cases' },
    { name: 'NAV.TASKS', icon: 'checklist', link: '/paralegal/tasks' },
    { name: 'NAV.DOCUMENTS', icon: 'folder', link: '/paralegal/documents', dividerBefore: true },
    { name: 'NAV.CALENDAR', icon: 'calendar_today', link: '/paralegal/calendar' },
    { name: 'NAV.MESSAGES', icon: 'forum', link: '/paralegal/messages', badge: 0 },
    { name: 'NAV.NOTIFICATIONS', icon: 'notifications', link: '/paralegal/notifications', badge: 0 },
    { name: 'NAV.PROFILE', icon: 'person', link: '/paralegal/profile', dividerBefore: true }
  ];

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get user role
    this.loadUserRole();

    // Subscribe to notification count
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.notificationCount = count;
        this.updateNotificationBadge(count);
      });

    // Subscribe to user changes (role might change)
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.userRole = user.role || 'driver';
          this.loadNavigation();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserRole(): void {
    this.userRole = this.authService.getUserRole() || 'driver';
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try { this.userName = JSON.parse(stored).name || ''; } catch { /* ignore */ }
    }
    this.loadNavigation();
  }

  private loadNavigation(): void {
    switch (this.userRole) {
      case 'admin':
        this.navigation = [...this.adminNavigation];
        break;
      case 'attorney':
        this.navigation = [...this.attorneyNavigation];
        break;
      case 'carrier':
        this.navigation = [...this.carrierNavigation];
        break;
      case 'paralegal':
        this.navigation = [...this.paralegalNavigation];
        break;
      case 'driver':
      default:
        this.navigation = [...this.driverNavigation];
        break;
    }

    this.updateNotificationBadge(this.notificationCount);
  }

  private updateNotificationBadge(count: number): void {
    const notificationItem = this.navigation.find(item => item.name === 'NAV.NOTIFICATIONS');
    if (notificationItem) {
      notificationItem.badge = count;
    }
  }
}