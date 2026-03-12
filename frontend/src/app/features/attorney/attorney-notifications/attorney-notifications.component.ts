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

interface AttorneyNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
}

const MOCK_NOTIFICATIONS: AttorneyNotification[] = [
  {
    id: 'atn-001',
    title: 'Case Assigned to You',
    message: 'Case CDL-2026-112 has been assigned to you by the dispatcher',
    type: 'info',
    read: false,
    created_at: '2026-03-11T09:45:00Z',
  },
  {
    id: 'atn-002',
    title: 'Client Uploaded Document',
    message: 'Miguel Rivera uploaded a new document for case CDL-2026-098',
    type: 'info',
    read: false,
    created_at: '2026-03-11T08:30:00Z',
  },
  {
    id: 'atn-003',
    title: 'Court Date Reminder',
    message: 'Court hearing for case CDL-2026-078 is in 3 days — prepare filings',
    type: 'warning',
    read: false,
    created_at: '2026-03-10T17:00:00Z',
  },
  {
    id: 'atn-004',
    title: 'Payment Received',
    message: 'Payment of $850 received from client James Kowalski for case CDL-2026-065',
    type: 'success',
    read: false,
    created_at: '2026-03-10T14:22:00Z',
  },
  {
    id: 'atn-005',
    title: 'Case Resolved — Won',
    message: 'Case CDL-2026-045 has been resolved in your favor — ticket dismissed',
    type: 'success',
    read: true,
    created_at: '2026-03-10T11:15:00Z',
  },
  {
    id: 'atn-006',
    title: 'Client Message Received',
    message: 'New message from Lisa Chen regarding case CDL-2026-101',
    type: 'info',
    read: false,
    created_at: '2026-03-10T09:48:00Z',
  },
  {
    id: 'atn-007',
    title: 'Filing Deadline Tomorrow',
    message: 'Motion to dismiss for case CDL-2026-089 must be filed by end of day tomorrow',
    type: 'warning',
    read: false,
    created_at: '2026-03-09T16:30:00Z',
  },
  {
    id: 'atn-008',
    title: 'New Client Referred to You',
    message: 'A new client, David Park, has been referred to you for a speeding violation',
    type: 'info',
    read: true,
    created_at: '2026-03-09T13:10:00Z',
  },
  {
    id: 'atn-009',
    title: 'Subscription Renewal Reminder',
    message: 'Your CDL Ticket Management Pro subscription renews on March 20, 2026',
    type: 'warning',
    read: false,
    created_at: '2026-03-09T10:00:00Z',
  },
  {
    id: 'atn-010',
    title: 'Case Status Changed',
    message: 'Case CDL-2026-072 status changed from "Pending Court" to "In Progress"',
    type: 'info',
    read: true,
    created_at: '2026-03-08T15:45:00Z',
  },
  {
    id: 'atn-011',
    title: 'Court Hearing Rescheduled',
    message: 'Hearing for case CDL-2026-056 rescheduled from March 18 to March 25',
    type: 'warning',
    read: false,
    created_at: '2026-03-08T11:20:00Z',
  },
  {
    id: 'atn-012',
    title: 'Monthly Report Ready',
    message: 'Your February 2026 performance report is ready for review',
    type: 'success',
    read: true,
    created_at: '2026-03-07T08:00:00Z',
  },
];

@Component({
  selector: 'app-attorney-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatBadgeModule,
    TranslateModule,
  ],
  template: `
    <div class="notifications-page">
      <header class="page-header">
        <h1>{{ 'ATT.NOTIFICATIONS' | translate }}</h1>
        @if (unreadCount() > 0) {
          <button mat-stroked-button (click)="markAllRead()">
            <mat-icon>done_all</mat-icon> {{ 'ATT.MARK_ALL_READ' | translate }}
          </button>
        }
      </header>

      @if (unreadCount() > 0) {
        <div class="unread-banner">
          <mat-icon aria-hidden="true">notifications_active</mat-icon>
          <span>{{ unreadCount() }} {{ 'ATT.UNREAD_NOTIFICATIONS' | translate }}</span>
        </div>
      }

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (notifications().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">notifications_none</mat-icon>
          <p>{{ 'ATT.NO_NOTIFICATIONS' | translate }}</p>
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
export class AttorneyNotificationsComponent implements OnInit {
  loading = signal(true);
  notifications = signal<AttorneyNotification[]>([]);

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  ngOnInit(): void {
    // Simulate async load from mock data
    setTimeout(() => {
      this.notifications.set(MOCK_NOTIFICATIONS.map(n => ({ ...n })));
      this.loading.set(false);
    }, 400);
  }

  markRead(n: AttorneyNotification): void {
    if (n.read) return;
    this.notifications.update(list =>
      list.map(item => item.id === n.id ? { ...item, read: true } : item)
    );
  }

  markAllRead(): void {
    this.notifications.update(list => list.map(item => ({ ...item, read: true })));
  }
}
