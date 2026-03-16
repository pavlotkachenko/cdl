import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AttorneyNotificationsComponent } from './attorney-notifications.component';

describe('AttorneyNotificationsComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function setup() {
    await TestBed.configureTestingModule({
      imports: [AttorneyNotificationsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
    }).compileComponents();

    const fixture = TestBed.createComponent(AttorneyNotificationsComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should start in loading state', async () => {
    const { component } = await setup();
    expect(component.loading()).toBe(true);
    expect(component.notifications()).toEqual([]);
  });

  it('should load notifications after timeout', async () => {
    const { component, fixture } = await setup();
    expect(component.loading()).toBe(true);
    expect(component.notifications().length).toBe(0);

    vi.advanceTimersByTime(400);
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.notifications().length).toBe(12);
  });

  it('unreadCount should count unread notifications', async () => {
    const { component } = await setup();

    vi.advanceTimersByTime(400);

    // The mock data has 4 read notifications (atn-005, atn-008, atn-010, atn-012)
    // so 12 - 4 = 8 unread
    expect(component.unreadCount()).toBe(8);
  });

  it('markRead should mark a notification as read', async () => {
    const { component } = await setup();

    vi.advanceTimersByTime(400);

    const unreadBefore = component.unreadCount();
    const firstUnread = component.notifications().find(n => !n.read)!;
    component.markRead(firstUnread);

    expect(component.unreadCount()).toBe(unreadBefore - 1);
    const updated = component.notifications().find(n => n.id === firstUnread.id)!;
    expect(updated.read).toBe(true);
  });

  it('markAllRead should mark all as read', async () => {
    const { component } = await setup();

    vi.advanceTimersByTime(400);
    expect(component.unreadCount()).toBeGreaterThan(0);

    component.markAllRead();

    expect(component.unreadCount()).toBe(0);
    expect(component.notifications().every(n => n.read)).toBe(true);
  });
});
