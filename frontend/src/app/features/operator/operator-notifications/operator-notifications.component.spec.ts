import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { provideTranslateService } from '@ngx-translate/core';
import { OperatorNotificationsComponent } from './operator-notifications.component';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [OperatorNotificationsComponent, NoopAnimationsModule],
    providers: [provideTranslateService()],
  }).compileComponents();

  const fixture = TestBed.createComponent(OperatorNotificationsComponent);
  return { fixture, component: fixture.componentInstance };
}

describe('OperatorNotificationsComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in loading state', async () => {
    const { component } = await setup();
    expect(component.loading()).toBe(true);
    expect(component.notifications()).toHaveLength(0);
  });

  it('loads mock notifications after timeout', async () => {
    const { component, fixture } = await setup();
    fixture.detectChanges();
    vi.advanceTimersByTime(500);
    expect(component.loading()).toBe(false);
    expect(component.notifications().length).toBeGreaterThan(0);
  });

  it('unreadCount reflects unread notifications', async () => {
    const { component, fixture } = await setup();
    fixture.detectChanges();
    vi.advanceTimersByTime(500);
    const total = component.notifications().length;
    const readCount = component.notifications().filter(n => n.read).length;
    expect(component.unreadCount()).toBe(total - readCount);
  });

  it('markRead marks a single notification as read', async () => {
    const { component, fixture } = await setup();
    fixture.detectChanges();
    vi.advanceTimersByTime(500);

    const unreadBefore = component.unreadCount();
    const firstUnread = component.notifications().find(n => !n.read);
    if (firstUnread) {
      component.markRead(firstUnread);
      expect(component.unreadCount()).toBe(unreadBefore - 1);
    }
  });

  it('markRead is a no-op for already-read notifications', async () => {
    const { component, fixture } = await setup();
    fixture.detectChanges();
    vi.advanceTimersByTime(500);

    const readNotif = component.notifications().find(n => n.read);
    if (readNotif) {
      const countBefore = component.unreadCount();
      component.markRead(readNotif);
      expect(component.unreadCount()).toBe(countBefore);
    }
  });

  it('markAllRead sets all notifications to read', async () => {
    const { component, fixture } = await setup();
    fixture.detectChanges();
    vi.advanceTimersByTime(500);

    component.markAllRead();
    expect(component.unreadCount()).toBe(0);
    expect(component.notifications().every(n => n.read)).toBe(true);
  });
});
