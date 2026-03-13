import {
  Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { NotificationService, Notification } from '../../../core/services/notification.service';
import { SocketService } from '../../../core/services/socket.service';

export interface OperatorNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
}

@Component({
  selector: 'app-operator-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatBadgeModule,
    TranslateModule,
  ],
  template: `
    <div class="notifications-page">
      <header class="page-header">
        <h1>{{ 'OPR.NOTIFICATIONS' | translate }}</h1>
        @if (unreadCount() > 0) {
          <button mat-stroked-button (click)="markAllRead()">
            <mat-icon>done_all</mat-icon> {{ 'OPR.MARK_ALL_READ' | translate }}
          </button>
        }
      </header>

      @if (unreadCount() > 0) {
        <div class="unread-banner">
          <mat-icon aria-hidden="true">notifications_active</mat-icon>
          <span>{{ unreadCount() }} {{ 'OPR.UNREAD_NOTIFICATIONS' | translate }}</span>
        </div>
      }

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (notifications().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">notifications_none</mat-icon>
          <p>{{ 'OPR.NO_NOTIFICATIONS' | translate }}</p>
        </div>
      } @else {
        <div class="notification-list" role="list">
          @for (n of notifications(); track n.id) {
            <mat-card class="notification-card" [class.unread]="!n.read" role="listitem"
                      (click)="markRead(n)" tabindex="0" (keydown.enter)="markRead(n)">
              <mat-card-content>
                <div class="notif-row">
                  <div class="notif-icon" [class]="'type-' + n.type">
                    <mat-icon aria-hidden="true">
                      @switch (n.type) {
                        @case ('info') { info }
                        @case ('warning') { warning }
                        @case ('success') { check_circle }
                        @case ('error') { error }
                      }
                    </mat-icon>
                  </div>
                  <div class="notif-content">
                    <p class="notif-title">{{ n.title }}</p>
                    <p class="notif-message">{{ n.message }}</p>
                    <p class="notif-time">{{ n.created_at | date:'medium' }}</p>
                  </div>
                  @if (!n.read) {
                    <span class="unread-dot" aria-label="Unread"></span>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .notifications-page { max-width: 680px; margin: 0 auto; padding: 24px 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h1 { margin: 0; font-size: 1.4rem; }

    .unread-banner { display: flex; align-items: center; gap: 10px; padding: 10px 16px;
      background: #e3f2fd; border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem; color: #1565c0; }

    .loading { display: flex; justify-content: center; padding: 32px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .notification-list { display: flex; flex-direction: column; gap: 8px; }
    .notification-card { cursor: pointer; transition: all 0.2s ease; }
    .notification-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.12); }
    .notification-card.unread { border-left: 4px solid #1976d2; background: #f8faff; }
    .notif-row { display: flex; align-items: flex-start; gap: 14px; }
    .notif-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0; }
    .notif-icon.type-info { background: #e3f2fd; }
    .notif-icon.type-info mat-icon { color: #1565c0; }
    .notif-icon.type-warning { background: #fff8e1; }
    .notif-icon.type-warning mat-icon { color: #f57f17; }
    .notif-icon.type-success { background: #e8f5e9; }
    .notif-icon.type-success mat-icon { color: #2e7d32; }
    .notif-icon.type-error { background: #ffebee; }
    .notif-icon.type-error mat-icon { color: #c62828; }
    .notif-content { flex: 1; }
    .notif-title { margin: 0; font-size: 0.9rem; font-weight: 600; }
    .notif-message { margin: 4px 0 0; font-size: 0.82rem; color: #555; line-height: 1.4; }
    .notif-time { margin: 6px 0 0; font-size: 0.72rem; color: #999; }
    .unread-dot { width: 10px; height: 10px; border-radius: 50%; background: #1976d2; flex-shrink: 0; margin-top: 4px; }
  `],
})
export class OperatorNotificationsComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private socketService = inject(SocketService);
  private socketSub?: Subscription;

  loading = signal(true);
  notifications = signal<OperatorNotification[]>([]);

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  ngOnInit(): void {
    this.loadNotifications();

    // Connect socket and listen for real-time notifications
    this.socketService.connect();
    this.socketSub = this.socketService.onNotification().subscribe(notification => {
      if (notification) {
        const mapped = this.mapNotification(notification);
        this.notifications.update(list => [mapped, ...list]);
      }
    });
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.notificationService.getNotifications({ limit: 50 }).subscribe({
      next: (res) => {
        const mapped = (res.notifications || []).map(n => this.mapNotification(n));
        this.notifications.set(mapped);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.set([]);
        this.loading.set(false);
      },
    });
  }

  markRead(n: OperatorNotification): void {
    if (n.read) return;
    this.notificationService.markAsRead(n.id).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(item => item.id === n.id ? { ...item, read: true } : item),
        );
      },
      error: () => {},
    });
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(list => list.map(item => ({ ...item, read: true })));
      },
      error: () => {},
    });
  }

  private mapNotification(n: Notification | any): OperatorNotification {
    return {
      id: n.id,
      title: n.title || '',
      message: n.message || '',
      type: this.resolveType(n.type),
      read: !!n.read,
      created_at: n.createdAt || n.created_at || n.timestamp || new Date().toISOString(),
    };
  }

  private resolveType(type: string): 'info' | 'warning' | 'success' | 'error' {
    if (type === 'assignment_rejected') return 'warning';
    if (type === 'assignment_approved' || type === 'payment') return 'success';
    if (type === 'error') return 'error';
    return 'info';
  }
}
