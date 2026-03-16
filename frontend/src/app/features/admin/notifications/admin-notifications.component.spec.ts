import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TranslateModule } from '@ngx-translate/core';

import { AdminNotificationsComponent } from './admin-notifications.component';

describe('AdminNotificationsComponent', () => {
  let fixture: ComponentFixture<AdminNotificationsComponent>;
  let component: AdminNotificationsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminNotificationsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminNotificationsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should start in loading state', () => {
    expect(component.loading()).toBe(true);
    expect(component.notifications()).toEqual([]);
  });

  it('should load notifications after timeout', () => {
    vi.useFakeTimers();
    fixture.detectChanges(); // triggers ngOnInit

    expect(component.loading()).toBe(true);
    expect(component.notifications().length).toBe(0);

    vi.advanceTimersByTime(400);

    expect(component.loading()).toBe(false);
    expect(component.notifications().length).toBe(10);
  });

  it('unreadCount should count unread notifications', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    vi.advanceTimersByTime(400);

    // The mock data has 6 unread (an-001, an-002, an-003, an-005, an-006, an-008)
    expect(component.unreadCount()).toBe(6);
  });

  it('markRead should mark a notification as read', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    vi.advanceTimersByTime(400);

    const unreadBefore = component.unreadCount();
    const target = component.notifications().find(n => !n.read)!;
    component.markRead(target);

    expect(component.unreadCount()).toBe(unreadBefore - 1);
    const updated = component.notifications().find(n => n.id === target.id)!;
    expect(updated.read).toBe(true);
  });

  it('markAllRead should mark all as read', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    vi.advanceTimersByTime(400);

    expect(component.unreadCount()).toBeGreaterThan(0);
    component.markAllRead();
    expect(component.unreadCount()).toBe(0);
    expect(component.notifications().every(n => n.read)).toBe(true);
  });

  it('filteredNotifications should filter by search term', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    vi.advanceTimersByTime(400);

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
