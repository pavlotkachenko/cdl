import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect } from 'vitest';
import { of, Subject, throwError } from 'rxjs';

import { provideTranslateService } from '@ngx-translate/core';
import { OperatorNotificationsComponent } from './operator-notifications.component';
import { NotificationService } from '../../../core/services/notification.service';
import { SocketService } from '../../../core/services/socket.service';

const MOCK_API_NOTIFICATIONS = [
  { id: 'n1', title: 'New Case', message: 'Case CDL-601', type: 'case_update', read: false, created_at: '2026-03-11T09:00:00Z' },
  { id: 'n2', title: 'Approved', message: 'Assignment approved', type: 'assignment_approved', read: false, created_at: '2026-03-11T08:00:00Z' },
  { id: 'n3', title: 'Resolved', message: 'Case closed', type: 'system', read: true, created_at: '2026-03-10T10:00:00Z' },
];

let socketNotification$: Subject<any>;
let notifSpy: {
  getNotifications: ReturnType<typeof vi.fn>;
  markAsRead: ReturnType<typeof vi.fn>;
  markAllAsRead: ReturnType<typeof vi.fn>;
};
let socketSpy: {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  onNotification: ReturnType<typeof vi.fn>;
};

async function setup(apiResponse: any = { notifications: MOCK_API_NOTIFICATIONS, total: 3 }) {
  socketNotification$ = new Subject();
  notifSpy = {
    getNotifications: vi.fn().mockReturnValue(of(apiResponse)),
    markAsRead: vi.fn().mockReturnValue(of({ message: 'ok' })),
    markAllAsRead: vi.fn().mockReturnValue(of({ message: 'ok' })),
  };
  socketSpy = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onNotification: vi.fn().mockReturnValue(socketNotification$.asObservable()),
  };

  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [OperatorNotificationsComponent, NoopAnimationsModule],
    providers: [
      provideTranslateService(),
      { provide: NotificationService, useValue: notifSpy },
      { provide: SocketService, useValue: socketSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(OperatorNotificationsComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('OperatorNotificationsComponent', () => {
  it('calls getNotifications on init (no setTimeout)', async () => {
    const { component } = await setup();
    expect(notifSpy.getNotifications).toHaveBeenCalledWith({ limit: 50 });
    expect(component.loading()).toBe(false);
    expect(component.notifications()).toHaveLength(3);
  });

  it('connects socket and subscribes to onNotification', async () => {
    await setup();
    expect(socketSpy.connect).toHaveBeenCalled();
    expect(socketSpy.onNotification).toHaveBeenCalled();
  });

  it('unreadCount reflects unread notifications from API', async () => {
    const { component } = await setup();
    expect(component.unreadCount()).toBe(2);
  });

  it('markRead calls service and updates local state', async () => {
    const { component } = await setup();
    const first = component.notifications()[0];
    component.markRead(first);
    expect(notifSpy.markAsRead).toHaveBeenCalledWith('n1');
    expect(component.unreadCount()).toBe(1);
  });

  it('markRead is a no-op for already-read notifications', async () => {
    const { component } = await setup();
    const readNotif = component.notifications().find(n => n.read)!;
    component.markRead(readNotif);
    expect(notifSpy.markAsRead).not.toHaveBeenCalled();
  });

  it('markAllRead calls service and sets all to read', async () => {
    const { component } = await setup();
    component.markAllRead();
    expect(notifSpy.markAllAsRead).toHaveBeenCalled();
    expect(component.unreadCount()).toBe(0);
    expect(component.notifications().every(n => n.read)).toBe(true);
  });

  it('socket event prepends new notification to list', async () => {
    const { component } = await setup();
    socketNotification$.next({
      id: 'n-live', title: 'Live', message: 'New case arrived',
      type: 'case_update', read: false, created_at: '2026-03-12T12:00:00Z',
    });
    expect(component.notifications()).toHaveLength(4);
    expect(component.notifications()[0].id).toBe('n-live');
    expect(component.unreadCount()).toBe(3);
  });

  it('handles API error gracefully', async () => {
    socketNotification$ = new Subject();
    notifSpy = {
      getNotifications: vi.fn().mockReturnValue(throwError(() => new Error('fail'))),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
    };
    socketSpy = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      onNotification: vi.fn().mockReturnValue(socketNotification$.asObservable()),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [OperatorNotificationsComponent, NoopAnimationsModule],
      providers: [
        provideTranslateService(),
        { provide: NotificationService, useValue: notifSpy },
        { provide: SocketService, useValue: socketSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(OperatorNotificationsComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.loading()).toBe(false);
    expect(component.notifications()).toHaveLength(0);
  });

  it('maps notification types correctly', async () => {
    const { component } = await setup({
      notifications: [
        { id: 'r1', title: 'Rejected', message: 'x', type: 'assignment_rejected', read: false, created_at: '2026-03-11T00:00:00Z' },
        { id: 'r2', title: 'Paid', message: 'x', type: 'payment', read: false, created_at: '2026-03-11T00:00:00Z' },
      ],
      total: 2,
    });
    expect(component.notifications()[0].type).toBe('warning');
    expect(component.notifications()[1].type).toBe('success');
  });
});
