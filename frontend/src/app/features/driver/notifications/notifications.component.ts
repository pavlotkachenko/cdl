import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { NotificationService, Notification } from '../../../core/services/notification.service';

type NotifFilter = 'all' | 'unread' | 'read';
type NotifType = Notification['type'] | 'all';

@Component({
  selector: 'app-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule],
  template: `
    <div class="notif-page">
      <div class="notif-header">
        <h1>
          Notifications
          @if (unreadCount() > 0) {
            <span class="badge" aria-label="{{ unreadCount() }} unread">{{ unreadCount() }}</span>
          }
        </h1>
        <div class="header-actions">
          @if (unreadCount() > 0) {
            <button mat-button (click)="markAllAsRead()">Mark All Read</button>
          }
          <button mat-button (click)="goToSettings()" aria-label="Notification settings">
            <mat-icon>settings</mat-icon>
          </button>
        </div>
      </div>

      <div class="filter-row" role="group" aria-label="Filter notifications by status">
        @for (f of filters; track f.value) {
          <button mat-stroked-button
                  [class.active-filter]="selectedFilter() === f.value"
                  (click)="setFilter(f.value)"
                  [attr.aria-pressed]="selectedFilter() === f.value">
            {{ f.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (filteredNotifications().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">check_circle</mat-icon>
          <p>You're all caught up!</p>
        </div>
      } @else {
        @for (n of filteredNotifications(); track n.id) {
          <mat-card [class.unread]="!n.read" class="notif-card" role="article">
            <mat-card-content>
              <div class="notif-row">
                <mat-icon [style.color]="getColor(n.type)" aria-hidden="true">
                  {{ getIcon(n.type) }}
                </mat-icon>
                <div class="notif-body"
                     role="button"
                     tabindex="0"
                     (click)="onNotificationClick(n)"
                     (keydown.enter)="onNotificationClick(n)"
                     [attr.aria-label]="n.title">
                  <p class="notif-title">{{ n.title }}</p>
                  <p class="notif-msg">{{ n.message }}</p>
                  <p class="notif-time">{{ formatTime(n.createdAt) }}</p>
                </div>
                <div class="notif-actions">
                  @if (!n.read) {
                    <button mat-icon-button (click)="markAsRead(n, $event)" aria-label="Mark as read">
                      <mat-icon>check</mat-icon>
                    </button>
                  }
                  <button mat-icon-button (click)="deleteNotification(n, $event)" aria-label="Delete notification">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-divider></mat-divider>
        }
      }
    </div>
  `,
  styles: [`
    .notif-page { max-width: 680px; margin: 0 auto; padding: 24px 16px; }
    .notif-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .notif-header h1 { margin: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 8px; }
    .badge { background: #d32f2f; color: #fff; border-radius: 10px; padding: 2px 7px; font-size: 0.75rem; font-weight: 700; }
    .header-actions { display: flex; align-items: center; gap: 4px; }
    .filter-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .active-filter { background: #e3f2fd; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px 0; color: #888; gap: 8px; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #4caf50; }
    .notif-card { margin-bottom: 4px; }
    .notif-card.unread { border-left: 3px solid #1976d2; }
    .notif-row { display: flex; gap: 12px; align-items: flex-start; }
    .notif-body { flex: 1; cursor: pointer; }
    .notif-body:focus-visible { outline: 2px solid #1976d2; border-radius: 4px; }
    .notif-title { margin: 0 0 2px; font-weight: 600; font-size: 0.9rem; }
    .notif-msg { margin: 0 0 4px; font-size: 0.85rem; color: #555; }
    .notif-time { margin: 0; font-size: 0.75rem; color: #999; }
    .notif-actions { display: flex; gap: 0; flex-shrink: 0; }
  `],
})
export class NotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  loading = signal(false);
  selectedFilter = signal<NotifFilter>('all');
  selectedType = signal<NotifType>('all');

  filteredNotifications = computed(() => {
    let list = this.notifications();
    const filter = this.selectedFilter();
    const type = this.selectedType();
    if (filter === 'unread') list = list.filter(n => !n.read);
    else if (filter === 'read') list = list.filter(n => n.read);
    if (type !== 'all') list = list.filter(n => n.type === type);
    return list;
  });

  readonly filters: { value: NotifFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
  ];

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe(n => this.notifications.set(n));
    this.notificationService.unreadCount$.subscribe(c => this.unreadCount.set(c));
    this.loading.set(true);
    this.notificationService.getNotifications().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  setFilter(filter: NotifFilter): void {
    this.selectedFilter.set(filter);
  }

  setTypeFilter(type: NotifType): void {
    this.selectedType.set(type);
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
  }

  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(notification.id).subscribe();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    if (confirm('Delete this notification?')) {
      this.notificationService.deleteNotification(notification.id).subscribe();
    }
  }

  goToSettings(): void {
    this.router.navigate(['/driver/settings/notifications']);
  }

  getIcon(type: Notification['type']): string {
    return this.notificationService.getNotificationIcon(type);
  }

  getColor(type: Notification['type']): string {
    return this.notificationService.getNotificationColor(type);
  }

  formatTime(timestamp: string): string {
    return this.notificationService.formatTimestamp(timestamp);
  }
}
