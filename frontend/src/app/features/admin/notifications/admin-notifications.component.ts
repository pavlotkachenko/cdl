import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';

import { NotificationService, Notification } from '../../../core/services/notification.service';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
}

@Component({
  selector: 'app-admin-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DatePipe,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatBadgeModule,
    TranslateModule,
  ],
  template: `
    <div class="notifications-page">
      <header class="page-header">
        <h1>{{ 'ADMIN.NOTIFICATIONS' | translate }}</h1>
        <div class="header-actions">
          <button mat-icon-button
                  (click)="showSearch.set(!showSearch())"
                  [attr.aria-label]="'ADMIN.TOGGLE_SEARCH' | translate"
                  [class.active-toggle]="showSearch()">
            <mat-icon>{{ showSearch() ? 'search_off' : 'search' }}</mat-icon>
          </button>
          @if (unreadCount() > 0) {
            <button mat-stroked-button (click)="markAllRead()">
              <mat-icon>done_all</mat-icon> {{ 'ADMIN.MARK_ALL_READ' | translate }}
            </button>
          }
        </div>
      </header>

      @if (showSearch()) {
        <div class="search-bar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>{{ 'ADMIN.SEARCH_NOTIFICATIONS' | translate }}</mat-label>
            <input matInput
                   [ngModel]="searchTerm()"
                   (ngModelChange)="searchTerm.set($event)"
                   [placeholder]="'ADMIN.SEARCH_PLACEHOLDER' | translate" />
            <mat-icon matPrefix>search</mat-icon>
            @if (searchTerm()) {
              <button matSuffix mat-icon-button (click)="searchTerm.set('')" aria-label="Clear search">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>
        </div>
      }

      @if (unreadCount() > 0) {
        <div class="unread-banner">
          <mat-icon aria-hidden="true">notifications_active</mat-icon>
          <span>{{ unreadCount() }} {{ 'ADMIN.UNREAD_NOTIFICATIONS' | translate }}</span>
        </div>
      }

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (filteredNotifications().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">notifications_none</mat-icon>
          <p>{{ 'ADMIN.NO_NOTIFICATIONS' | translate }}</p>
        </div>
      } @else {
        <div class="notification-list" role="list">
          @for (n of filteredNotifications(); track n.id) {
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
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .active-toggle { color: #1976d2; }
    .search-bar { margin-bottom: 16px; }
    .search-field { width: 100%; }

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
export class AdminNotificationsComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);

  loading = signal(true);
  notifications = signal<AdminNotification[]>([]);
  showSearch = signal(false);
  searchTerm = signal('');

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  filteredNotifications = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.notifications();
    return this.notifications().filter(n =>
      n.title.toLowerCase().includes(term) ||
      n.message.toLowerCase().includes(term),
    );
  });

  ngOnInit(): void {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    this.loading.set(true);
    this.notificationService.getNotifications({ limit: 50 }).pipe(
      catchError(() => of({ notifications: [] as Notification[], total: 0 })),
    ).subscribe({
      next: (response) => {
        const mapped: AdminNotification[] = response.notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: this.mapNotificationType(n.type),
          read: n.read,
          created_at: n.createdAt || n.timestamp || '',
        }));
        this.notifications.set(mapped);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.set([]);
        this.loading.set(false);
      },
    });
  }

  private mapNotificationType(type: string): 'info' | 'warning' | 'success' | 'error' {
    switch (type) {
      case 'payment': case 'case_update': return 'success';
      case 'court': case 'court_date': return 'warning';
      case 'system': return 'error';
      default: return 'info';
    }
  }

  markRead(n: AdminNotification): void {
    if (n.read) return;
    this.notificationService.markAsRead(n.id).pipe(
      catchError(() => of(null)),
    ).subscribe();
    this.notifications.update(list =>
      list.map(item => item.id === n.id ? { ...item, read: true } : item)
    );
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().pipe(
      catchError(() => of(null)),
    ).subscribe();
    this.notifications.update(list => list.map(item => ({ ...item, read: true })));
  }
}
