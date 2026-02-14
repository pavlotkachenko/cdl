// ============================================
// Notification Bell Component - Header Icon with Dropdown
// Location: frontend/src/app/shared/components/notification-bell/notification-bell.component.ts
// ============================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services
import { NotificationService, Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  unreadCount = 0;
  recentNotifications: Notification[] = [];
  showDot = false;

  constructor(
    public notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to unread count
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
        this.showDot = count > 0;
      });

    // Subscribe to notifications
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        // Show only the 5 most recent
        this.recentNotifications = notifications.slice(0, 5);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNotificationClick(notification: Notification): void {
    // Mark as read
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  viewAllNotifications(): void {
    this.router.navigate(['/driver/notifications']);
  }

  getIcon(type: Notification['type']): string {
    return this.notificationService.getNotificationIcon(type);
  }

  getColor(type: Notification['type']): string {
    return this.notificationService.getNotificationColor(type);
  }

  formatTime(timestamp: Date): string {
    return this.notificationService.formatTimestamp(timestamp);
  }
}
