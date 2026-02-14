// ============================================
// Sidebar Navigation Component (UPDATED WITH MESSAGES)
// Location: frontend/src/app/core/layout/sidebar/sidebar.component.ts
// ============================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';

// Services
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

interface NavigationItem {
  name: string;
  icon: string;
  link: string;
  badge?: number;
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
    MatDividerModule
  ]
})
export class SidebarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  notificationCount = 0;
  navigation: NavigationItem[] = [];
  userRole: string = 'driver';

  // Driver Navigation
  private driverNavigation: NavigationItem[] = [
    { name: 'Dashboard', icon: 'dashboard', link: '/driver/dashboard' },
    { name: 'My Cases', icon: 'gavel', link: '/driver/tickets' },
    { name: 'Messages', icon: 'forum', link: '/driver/messages', badge: 0 }, // ← Added Messages
    { name: 'Submit Ticket', icon: 'add_circle', link: '/driver/submit-ticket' },
    { name: 'Documents', icon: 'folder', link: '/driver/documents' },
    { name: 'Analytics', icon: 'bar_chart', link: '/driver/analytics' },
    { name: 'Notifications', icon: 'notifications', link: '/driver/notifications', badge: 0 },
    { name: 'Profile', icon: 'person', link: '/driver/profile' },
    { name: 'Help', icon: 'help', link: '/driver/help' }
  ];

  // Admin Navigation
  private adminNavigation: NavigationItem[] = [
    { name: 'Dashboard', icon: 'dashboard', link: '/admin/dashboard' },
    { name: 'Case Management', icon: 'gavel', link: '/admin/cases' },
    { name: 'Staff Management', icon: 'groups', link: '/admin/staff' },
    { name: 'Client Management', icon: 'people', link: '/admin/clients' },
    { name: 'Reports & Analytics', icon: 'assessment', link: '/admin/reports' },
    { name: 'Documents', icon: 'folder', link: '/admin/documents' },
    { name: 'Notifications', icon: 'notifications', link: '/admin/notifications', badge: 0 },
    { name: 'Settings', icon: 'settings', link: '/admin/settings' }
  ];

  // Attorney Navigation
  private attorneyNavigation: NavigationItem[] = [
    { name: 'Dashboard', icon: 'dashboard', link: '/attorney/dashboard' },
    { name: 'My Cases', icon: 'gavel', link: '/attorney/cases' },
    { name: 'Clients', icon: 'people', link: '/attorney/clients' },
    { name: 'Calendar', icon: 'calendar_today', link: '/attorney/calendar' },
    { name: 'Documents', icon: 'folder', link: '/attorney/documents' },
    { name: 'Reports', icon: 'assessment', link: '/attorney/reports' },
    { name: 'Notifications', icon: 'notifications', link: '/attorney/notifications', badge: 0 },
    { name: 'Profile', icon: 'person', link: '/attorney/profile' }
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
      case 'paralegal':
        this.navigation = [...this.attorneyNavigation];
        break;
      case 'driver':
      default:
        this.navigation = [...this.driverNavigation];
        break;
    }

    this.updateNotificationBadge(this.notificationCount);
  }

  private updateNotificationBadge(count: number): void {
    const notificationItem = this.navigation.find(item => item.name === 'Notifications');
    if (notificationItem) {
      notificationItem.badge = count;
    }
  }
}