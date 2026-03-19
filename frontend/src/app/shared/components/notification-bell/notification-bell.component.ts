import {
  Component, OnInit, inject, signal, computed,
  DestroyRef, ChangeDetectionStrategy,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NotificationService, Notification } from '../../../core/services/notification.service';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-notification-bell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
  imports: [
    MatIconModule, MatButtonModule, MatBadgeModule,
    MatMenuModule, MatDividerModule, MatTooltipModule,
  ],
})
export class NotificationBellComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private socketService = inject(SocketService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly notifications = toSignal(this.notificationService.notifications$, { initialValue: [] as Notification[] });
  readonly unreadCount = toSignal(this.notificationService.unreadCount$, { initialValue: 0 });
  readonly recentNotifications = computed(() => this.notifications().slice(0, 5));
  readonly loading = signal(false);

  ngOnInit(): void {
    this.loadNotifications();
    this.socketService.connect();
    this.socketService.onNotification()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(n => this.notificationService.pushSocketNotification(n));
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.notificationService.getNotifications({ limit: 5 }).subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  markAsRead(notification: Notification): void {
    if (notification.read) return;
    this.notificationService.markAsRead(notification.id).subscribe();
  }

  onNotificationClick(notification: Notification): void {
    this.markAsRead(notification);
    this.navigateToNotification(notification);
  }

  private navigateToNotification(notification: Notification): void {
    switch (notification.type) {
      case 'case':
      case 'case_update':
        if (notification.data?.caseId) {
          this.router.navigate(['/driver/cases', notification.data.caseId]);
        } else {
          this.router.navigate(['/driver/notifications']);
        }
        break;
      case 'message':
      case 'attorney_message':
        this.router.navigate(['/driver/messages']);
        break;
      default:
        this.router.navigate(['/driver/notifications']);
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  viewAllNotifications(): void {
    const role = this.authService.getUserRole();
    this.router.navigate([`/${role}/notifications`]);
  }

  getNotificationIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type as Notification['type']);
  }

  getTimeAgo(dateString: string): string {
    return this.notificationService.formatTimestamp(dateString);
  }
}
