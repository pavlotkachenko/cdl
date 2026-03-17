import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AdminNotificationsComponent } from './admin-notifications.component';
import { NotificationService, Notification } from '../../../core/services/notification.service';

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'an-001', type: 'case_update', title: 'New Case Assigned', message: 'Case #1234 has been assigned to you', read: false, createdAt: '2025-12-01T10:00:00Z' },
  { id: 'an-002', type: 'payment', title: 'Payment Received', message: 'Payment of $500 received for case #5678', read: false, createdAt: '2025-11-30T14:30:00Z' },
  { id: 'an-003', type: 'court_date', title: 'Court Date Reminder', message: 'Court hearing scheduled for Dec 15', read: false, createdAt: '2025-11-29T09:00:00Z' },
  { id: 'an-004', type: 'case', title: 'Case Resolved', message: 'Case #9012 has been resolved successfully', read: true, createdAt: '2025-11-28T16:00:00Z' },
  { id: 'an-005', type: 'system', title: 'Security Alert', message: 'Unusual login attempt detected from new location', read: false, createdAt: '2025-11-27T08:00:00Z' },
  { id: 'an-006', type: 'message', title: 'New Message', message: 'You have a new message from client John Doe', read: false, createdAt: '2025-11-26T11:00:00Z' },
  { id: 'an-007', type: 'case', title: 'Document Uploaded', message: 'New document uploaded for case #3456', read: true, createdAt: '2025-11-25T13:00:00Z' },
  { id: 'an-008', type: 'case_update', title: 'Status Update', message: 'Case #7890 status changed to In Progress', read: false, createdAt: '2025-11-24T15:00:00Z' },
  { id: 'an-009', type: 'payment', title: 'Payment Overdue', message: 'Payment for case #2345 is overdue', read: true, createdAt: '2025-11-23T10:00:00Z' },
  { id: 'an-010', type: 'court', title: 'Court Filing Complete', message: 'Court filing for case #6789 has been completed', read: true, createdAt: '2025-11-22T12:00:00Z' },
];

describe('AdminNotificationsComponent', () => {
  let fixture: ComponentFixture<AdminNotificationsComponent>;
  let component: AdminNotificationsComponent;
  let notificationService: {
    getNotifications: ReturnType<typeof vi.fn>;
    markAsRead: ReturnType<typeof vi.fn>;
    markAllAsRead: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    notificationService = {
      getNotifications: vi.fn().mockReturnValue(of({ notifications: MOCK_NOTIFICATIONS, total: MOCK_NOTIFICATIONS.length })),
      markAsRead: vi.fn().mockReturnValue(of({ message: 'ok' })),
      markAllAsRead: vi.fn().mockReturnValue(of({ message: 'ok' })),
    };

    await TestBed.configureTestingModule({
      imports: [AdminNotificationsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load notifications from service', () => {
    expect(notificationService.getNotifications).toHaveBeenCalled();
    expect(component.loading()).toBe(false);
    expect(component.notifications().length).toBe(10);
  });

  it('unreadCount should count unread notifications', () => {
    // The mock data has 6 unread (an-001, an-002, an-003, an-005, an-006, an-008)
    expect(component.unreadCount()).toBe(6);
  });

  it('markRead should mark a notification as read', () => {
    const unreadBefore = component.unreadCount();
    const target = component.notifications().find(n => !n.read)!;
    component.markRead(target);

    expect(component.unreadCount()).toBe(unreadBefore - 1);
    const updated = component.notifications().find(n => n.id === target.id)!;
    expect(updated.read).toBe(true);
  });

  it('markAllRead should mark all as read', () => {
    expect(component.unreadCount()).toBeGreaterThan(0);
    component.markAllRead();
    expect(component.unreadCount()).toBe(0);
    expect(component.notifications().every(n => n.read)).toBe(true);
  });

  it('filteredNotifications should filter by search term', () => {
    component.searchTerm.set('security');

    const filtered = component.filteredNotifications();
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Security Alert');
  });

  it('showSearch toggle should work', () => {
    expect(component.showSearch()).toBe(false);
    component.showSearch.set(true);
    expect(component.showSearch()).toBe(true);
    component.showSearch.set(false);
    expect(component.showSearch()).toBe(false);
  });
});
