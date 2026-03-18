import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { vi, describe, it, expect } from 'vitest';
import { of } from 'rxjs';

import { AttorneyNotificationsComponent } from './attorney-notifications.component';
import { NotificationService } from '../../../core/services/notification.service';

// 12 notifications: 4 read, 8 unread
const MOCK_NOTIFICATIONS = [
  { id: 'atn-001', title: 'New Case', message: 'Case assigned', type: 'case_update', read: false, createdAt: '2026-03-01T10:00:00Z' },
  { id: 'atn-002', title: 'Court Date', message: 'Court date scheduled', type: 'court', read: false, createdAt: '2026-03-01T09:00:00Z' },
  { id: 'atn-003', title: 'Payment', message: 'Payment received', type: 'payment', read: false, createdAt: '2026-03-01T08:00:00Z' },
  { id: 'atn-004', title: 'Document', message: 'New document uploaded', type: 'document', read: false, createdAt: '2026-02-28T12:00:00Z' },
  { id: 'atn-005', title: 'Status Update', message: 'Case updated', type: 'case_update', read: true, createdAt: '2026-02-28T11:00:00Z' },
  { id: 'atn-006', title: 'Message', message: 'New message', type: 'message', read: false, createdAt: '2026-02-28T10:00:00Z' },
  { id: 'atn-007', title: 'Reminder', message: 'Court reminder', type: 'reminder', read: false, createdAt: '2026-02-27T14:00:00Z' },
  { id: 'atn-008', title: 'Case Closed', message: 'Case resolved', type: 'case_update', read: true, createdAt: '2026-02-27T09:00:00Z' },
  { id: 'atn-009', title: 'Assignment', message: 'New assignment', type: 'assignment', read: false, createdAt: '2026-02-26T16:00:00Z' },
  { id: 'atn-010', title: 'Review', message: 'Review posted', type: 'review', read: true, createdAt: '2026-02-26T10:00:00Z' },
  { id: 'atn-011', title: 'Alert', message: 'Action needed', type: 'alert', read: false, createdAt: '2026-02-25T15:00:00Z' },
  { id: 'atn-012', title: 'System', message: 'System update', type: 'system', read: true, createdAt: '2026-02-25T08:00:00Z' },
];

function makeServiceSpy() {
  return {
    getNotifications: vi.fn().mockReturnValue(of({ notifications: MOCK_NOTIFICATIONS, total: 12 })),
    markAsRead: vi.fn().mockReturnValue(of({ success: true })),
    markAllAsRead: vi.fn().mockReturnValue(of({ success: true })),
  };
}

async function setup(spy = makeServiceSpy()) {
  await TestBed.configureTestingModule({
    imports: [AttorneyNotificationsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
    providers: [
      { provide: NotificationService, useValue: spy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AttorneyNotificationsComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, spy };
}

describe('AttorneyNotificationsComponent', () => {
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should load notifications from service', async () => {
    const { component } = await setup();
    expect(component.loading()).toBe(false);
    expect(component.notifications().length).toBe(12);
  });

  it('unreadCount should count unread notifications', async () => {
    const { component } = await setup();
    // 4 read (atn-005, atn-008, atn-010, atn-012) => 8 unread
    expect(component.unreadCount()).toBe(8);
  });

  it('markRead should mark a notification as read', async () => {
    const { component, spy } = await setup();

    const unreadBefore = component.unreadCount();
    const firstUnread = component.notifications().find(n => !n.read)!;
    component.markRead(firstUnread);

    expect(spy.markAsRead).toHaveBeenCalledWith(firstUnread.id);
    expect(component.unreadCount()).toBe(unreadBefore - 1);
    const updated = component.notifications().find(n => n.id === firstUnread.id)!;
    expect(updated.read).toBe(true);
  });

  it('markAllRead should mark all as read', async () => {
    const { component, spy } = await setup();

    expect(component.unreadCount()).toBeGreaterThan(0);
    component.markAllRead();

    expect(spy.markAllAsRead).toHaveBeenCalled();
    expect(component.unreadCount()).toBe(0);
    expect(component.notifications().every(n => n.read)).toBe(true);
  });
});
