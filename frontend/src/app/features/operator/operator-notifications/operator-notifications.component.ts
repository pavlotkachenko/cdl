import {
  Component, OnInit, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule } from '@ngx-translate/core';

interface OperatorNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
}

const MOCK_NOTIFICATIONS: OperatorNotification[] = [
  {
    id: 'opn-001',
    title: 'New Case Assigned',
    message: 'Case CDL-2026-601 has been assigned to you by the admin',
    type: 'info',
    read: false,
    created_at: '2026-03-11T09:45:00Z',
  },
  {
    id: 'opn-002',
    title: 'Assignment Request Approved',
    message: 'Your request for case CDL-2026-505 has been approved by admin',
    type: 'success',
    read: false,
    created_at: '2026-03-11T08:30:00Z',
  },
  {
    id: 'opn-003',
    title: 'Case Status Changed',
    message: 'Case CDL-2026-502 status changed to "Waiting for Driver"',
    type: 'info',
    read: false,
    created_at: '2026-03-10T17:00:00Z',
  },
  {
    id: 'opn-004',
    title: 'Assignment Request Rejected',
    message: 'Your request for case CDL-2026-498 was rejected — already assigned to another operator',
    type: 'warning',
    read: false,
    created_at: '2026-03-10T14:22:00Z',
  },
  {
    id: 'opn-005',
    title: 'Case Resolved',
    message: 'Case CDL-2026-478 has been resolved — ticket dismissed',
    type: 'success',
    read: true,
    created_at: '2026-03-10T11:15:00Z',
  },
  {
    id: 'opn-006',
    title: 'New Unassigned Cases',
    message: '3 new cases are available in the unassigned queue',
    type: 'info',
    read: false,
    created_at: '2026-03-10T09:48:00Z',
  },
  {
    id: 'opn-007',
    title: 'SLA Warning',
    message: 'Case CDL-2026-490 has been unresolved for 48+ hours — requires attention',
    type: 'warning',
    read: false,
    created_at: '2026-03-09T16:30:00Z',
  },
  {
    id: 'opn-008',
    title: 'Attorney Assigned',
    message: 'Attorney Sarah Johnson has been assigned to your case CDL-2026-501',
    type: 'info',
    read: true,
    created_at: '2026-03-09T13:10:00Z',
  },
  {
    id: 'opn-009',
    title: 'Client Document Uploaded',
    message: 'Driver Marcus Rivera uploaded a new document for case CDL-2026-601',
    type: 'info',
    read: true,
    created_at: '2026-03-09T10:00:00Z',
  },
  {
    id: 'opn-010',
    title: 'Weekly Summary',
    message: 'You resolved 12 cases this week — great work!',
    type: 'success',
    read: true,
    created_at: '2026-03-08T08:00:00Z',
  },
];

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
export class OperatorNotificationsComponent implements OnInit {
  loading = signal(true);
  notifications = signal<OperatorNotification[]>([]);

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  ngOnInit(): void {
    setTimeout(() => {
      this.notifications.set(MOCK_NOTIFICATIONS.map(n => ({ ...n })));
      this.loading.set(false);
    }, 400);
  }

  markRead(n: OperatorNotification): void {
    if (n.read) return;
    this.notifications.update(list =>
      list.map(item => item.id === n.id ? { ...item, read: true } : item)
    );
  }

  markAllRead(): void {
    this.notifications.update(list => list.map(item => ({ ...item, read: true })));
  }
}
