import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { NotificationsComponent } from './notifications.component';
import { NotificationService, Notification } from '../../../core/services/notification.service';

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1', type: 'case_update', title: 'Case Updated', message: 'Your case was updated.',
    read: false, createdAt: '2026-01-01T10:00:00Z',
  },
  {
    id: 'n2', type: 'system', title: 'System Alert', message: 'Scheduled maintenance.',
    read: true, createdAt: '2026-01-02T10:00:00Z',
  },
];

function makeServiceSpy(notifications = MOCK_NOTIFICATIONS) {
  const notifications$ = new BehaviorSubject<Notification[]>(notifications);
  const unreadCount$ = new BehaviorSubject<number>(notifications.filter(n => !n.read).length);
  return {
    notifications$,
    unreadCount$,
    getNotifications: vi.fn().mockReturnValue(of({ notifications, total: notifications.length })),
    markAsRead: vi.fn().mockReturnValue(of({ message: 'ok' })),
    markAllAsRead: vi.fn().mockReturnValue(of({ message: 'ok' })),
    deleteNotification: vi.fn().mockReturnValue(of({ message: 'ok' })),
    clearAll: vi.fn().mockReturnValue(of({ message: 'ok' })),
    getNotificationIcon: vi.fn().mockReturnValue('notifications'),
    getNotificationColor: vi.fn().mockReturnValue('#1976d2'),
    formatTimestamp: vi.fn().mockReturnValue('5m ago'),
  };
}

async function setup(spy = makeServiceSpy()) {
  const routerSpy = { navigate: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [NotificationsComponent, NoopAnimationsModule],
    providers: [
      { provide: NotificationService, useValue: spy },
      { provide: Router, useValue: routerSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(NotificationsComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, spy, router: routerSpy };
}

describe('NotificationsComponent', () => {
  it('loads notifications from service on init', async () => {
    const { component, spy } = await setup();
    expect(component.notifications().length).toBe(2);
    expect(spy.getNotifications).toHaveBeenCalled();
  });

  it('unreadCount reflects service BehaviorSubject value', async () => {
    const { component } = await setup();
    expect(component.unreadCount()).toBe(1);
  });

  it('filteredNotifications shows all by default', async () => {
    const { component } = await setup();
    expect(component.filteredNotifications().length).toBe(2);
  });

  it('filteredNotifications filters to unread only', async () => {
    const { component } = await setup();
    component.setFilter('unread');
    expect(component.filteredNotifications().length).toBe(1);
    expect(component.filteredNotifications()[0].id).toBe('n1');
  });

  it('filteredNotifications filters by type', async () => {
    const { component } = await setup();
    component.setTypeFilter('system');
    expect(component.filteredNotifications().length).toBe(1);
    expect(component.filteredNotifications()[0].id).toBe('n2');
  });

  it('markAllAsRead calls service subscribe', async () => {
    const { component, spy } = await setup();
    component.markAllAsRead();
    expect(spy.markAllAsRead).toHaveBeenCalled();
  });
});
