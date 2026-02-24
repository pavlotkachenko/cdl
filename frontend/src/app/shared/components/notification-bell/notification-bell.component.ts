// ============================================
// NOTIFICATION BELL COMPONENT - Complete Implementation
// Location: frontend/src/app/shared/components/notification-bell/notification-bell.component.ts
// ============================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule
  ]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  loading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to notifications
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        // Show only the latest 5 notifications in the dropdown
        this.notifications = notifications.slice(0, 5);
      });

    // Subscribe to unread count
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });

    // Subscribe to new notifications
    this.notificationService.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        console.log('🔔 New notification:', notification);
        // You can add a toast/snackbar here to show the notification
        this.playNotificationSound();
      });

    // Load initial notifications
    this.loadNotifications();

    // Connect to WebSocket for real-time notifications
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // Load notifications from server
  // ============================================
  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications({ limit: 5 }).subscribe({
      next: (response) => {
        console.log('✅ Notifications loaded:', response.notifications.length);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Load notifications error:', error);
        this.loading = false;
      }
    });
  }

  // ============================================
  // Connect to WebSocket
  // ============================================
  connectWebSocket(): void {
    const token = this.authService.getToken();
    if (token) {
      this.notificationService.connectWebSocket(token);
    }
  }

  // ============================================
  // Mark notification as read
  // ============================================
  markAsRead(notification: Notification, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (notification.read) {
      return;
    }

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        console.log('✅ Notification marked as read');
      },
      error: (error) => {
        console.error('❌ Mark as read error:', error);
      }
    });
  }

  // ============================================
  // Handle notification click
  // ============================================
  onNotificationClick(notification: Notification): void {
    // Mark as read
    this.markAsRead(notification);

    // Navigate based on notification type
    this.navigateToNotification(notification);
  }

  // ============================================
  // Navigate based on notification type
  // ============================================
  private navigateToNotification(notification: Notification): void {
    switch (notification.type) {
      case 'case':
        if (notification.data?.caseId) {
          this.router.navigate(['/driver/cases', notification.data.caseId]);
        }
        break;
      case 'message':
        if (notification.data?.messageId || notification.data?.caseId) {
          this.router.navigate(['/driver/messages']);
        }
        break;
      case 'court':
        if (notification.data?.courtDateId || notification.data?.caseId) {
          this.router.navigate(['/driver/calendar']);
        }
        break;
      case 'payment':
        if (notification.data?.caseId) {
          this.router.navigate(['/driver/cases', notification.data.caseId]);
        }
        break;
      default:
        this.router.navigate(['/driver/notifications']);
    }
  }

  // ============================================
  // Mark all as read
  // ============================================
  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        console.log('✅ All notifications marked as read');
      },
      error: (error) => {
        console.error('❌ Mark all as read error:', error);
      }
    });
  }

  // ============================================
  // View all notifications
  // ============================================
  viewAllNotifications(): void {
    const userRole = this.authService.getUserRole();
    this.router.navigate([`/${userRole}/notifications`]);
  }

  // ============================================
  // Get notification icon based on type
  // ============================================
  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      case: 'folder',
      message: 'message',
      court: 'gavel',
      payment: 'payment',
      system: 'info'
    };
    return icons[type] || 'notifications';
  }

  // ============================================
  // Get notification color based on type
  // ============================================
  getNotificationColor(type: string): string {
    const colors: { [key: string]: string } = {
      case: 'primary',
      message: 'accent',
      court: 'warn',
      payment: 'success',
      system: 'info'
    };
    return colors[type] || 'default';
  }

  // ============================================
  // Get time ago string
  // ============================================
  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) {
      return 'Just now';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }

  // ============================================
  // Play notification sound (optional)
  // ============================================
  private playNotificationSound(): void {
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(error => {
        // User hasn't interacted with page yet, sound blocked
        console.log('Notification sound blocked:', error);
      });
    } catch (error) {
      console.log('Notification sound not available');
    }
  }
}
