import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BehaviorSubject } from 'rxjs';

import { NotificationBellComponent } from './notification-bell.component';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';

const MOCK_NOTIFICATION: Notification = {
  id: 'n1',
  type: 'case_update',
  title: 'Case Updated',
  message: 'Your case status changed.',
  read: false,
  createdAt: new Date().toISOString(),
};

function makeNotificationSpy(notifications: Notification[] = []) {
  const notificationsSubject = new BehaviorSubject<Notification[]>(notifications);
  const unreadSubject = new BehaviorSubject<number>(notifications.filter(n => !n.read).length);
  return {
    notifications$: notificationsSubject.asObservable(),
    unreadCount$: unreadSubject.asObservable(),
    getNotifications: vi.fn().mockReturnValue(of({ notifications, total: notifications.length })),
    markAsRead: vi.fn().mockReturnValue(of({ message: 'ok' })),
    markAllAsRead: vi.fn().mockReturnValue(of({ message: 'ok' })),
    pushSocketNotification: vi.fn(),
    getNotificationIcon: vi.fn().mockReturnValue('notifications'),
    formatTimestamp: vi.fn().mockReturnValue('Just now'),
  };
}

function makeSocketSpy(notificationSubject = new Subject<any>()) {
  return {
    connect: vi.fn(),
    onNotification: vi.fn().mockReturnValue(notificationSubject.asObservable()),
  };
}

function makeAuthSpy() {
  return { getUserRole: vi.fn().mockReturnValue('driver') };
}

async function setup(
  notificationSpy = makeNotificationSpy(),
  socketSpy = makeSocketSpy(),
  authSpy = makeAuthSpy(),
) {
  await TestBed.configureTestingModule({
    imports: [NotificationBellComponent, NoopAnimationsModule],
    providers: [
      { provide: NotificationService, useValue: notificationSpy },
      { provide: SocketService, useValue: socketSpy },
      { provide: AuthService, useValue: authSpy },
      provideRouter([]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(NotificationBellComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, notificationSpy, socketSpy, authSpy };
}

describe('NotificationBellComponent', () => {
  it('renders notification bell button', async () => {
    const { fixture } = await setup();
    const button = fixture.nativeElement.querySelector('button[aria-label="Notifications"]');
    expect(button).toBeTruthy();
  });

  it('hides badge when unreadCount is 0', async () => {
    const { component } = await setup(makeNotificationSpy([]));
    expect(component.unreadCount()).toBe(0);
  });

  it('shows unread count from notification service', async () => {
    const unread: Notification = { ...MOCK_NOTIFICATION, read: false };
    const { component } = await setup(makeNotificationSpy([unread]));
    expect(component.unreadCount()).toBe(1);
  });

  it('calls getNotifications and connect on init', async () => {
    const notifSpy = makeNotificationSpy();
    const sockSpy = makeSocketSpy();
    await setup(notifSpy, sockSpy);
    expect(notifSpy.getNotifications).toHaveBeenCalledWith({ limit: 5 });
    expect(sockSpy.connect).toHaveBeenCalled();
  });

  it('sets loading to false after getNotifications resolves', async () => {
    const { component } = await setup();
    expect(component.loading()).toBe(false);
  });

  it('recentNotifications slices to max 5 items', async () => {
    const many: Notification[] = Array.from({ length: 8 }, (_, i) => ({
      ...MOCK_NOTIFICATION, id: `n${i}`,
    }));
    const { component } = await setup(makeNotificationSpy(many));
    expect(component.recentNotifications().length).toBe(5);
  });

  it('pushes socket notification into notification service', async () => {
    const notifSpy = makeNotificationSpy();
    const socketSubject = new Subject<any>();
    const sockSpy = makeSocketSpy(socketSubject);
    await setup(notifSpy, sockSpy);

    socketSubject.next(MOCK_NOTIFICATION);
    expect(notifSpy.pushSocketNotification).toHaveBeenCalledWith(MOCK_NOTIFICATION);
  });

  it('markAllAsRead calls notificationService.markAllAsRead', async () => {
    const notifSpy = makeNotificationSpy([MOCK_NOTIFICATION]);
    const { component } = await setup(notifSpy);
    component.markAllAsRead();
    expect(notifSpy.markAllAsRead).toHaveBeenCalled();
  });

  it('markAsRead skips already-read notifications', async () => {
    const readNotif: Notification = { ...MOCK_NOTIFICATION, read: true };
    const notifSpy = makeNotificationSpy([readNotif]);
    const { component } = await setup(notifSpy);
    component.markAsRead(readNotif);
    expect(notifSpy.markAsRead).not.toHaveBeenCalled();
  });

  it('markAsRead calls service for unread notifications', async () => {
    const notifSpy = makeNotificationSpy([MOCK_NOTIFICATION]);
    const { component } = await setup(notifSpy);
    component.markAsRead(MOCK_NOTIFICATION);
    expect(notifSpy.markAsRead).toHaveBeenCalledWith('n1');
  });
});
