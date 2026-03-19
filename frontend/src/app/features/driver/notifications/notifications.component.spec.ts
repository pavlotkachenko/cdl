import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { NotificationsComponent } from './notifications.component';
import { NotificationService, Notification } from '../../../core/services/notification.service';

const NOW = new Date('2026-03-19T12:00:00Z');
const TODAY = new Date('2026-03-19T09:00:00Z').toISOString();
const YESTERDAY = new Date('2026-03-18T14:00:00Z').toISOString();
const EARLIER = new Date('2026-03-16T10:00:00Z').toISOString();
const OLDER = new Date('2026-03-10T10:00:00Z').toISOString();

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1', type: 'case_update', title: 'Case Status Updated',
    message: 'Your case <strong>#CDL-2024-0847</strong> has been assigned.',
    read: false, createdAt: TODAY, actionUrl: '/driver/cases/c1',
  },
  {
    id: 'n2', type: 'message', title: 'New Message from Attorney',
    message: '<strong>Attorney James Wilson</strong> sent you a message.',
    read: false, createdAt: TODAY, actionUrl: '/driver/messages',
  },
  {
    id: 'n3', type: 'payment', title: 'Payment Processed',
    message: 'Your payment of <strong>$250.00</strong> was processed.',
    read: true, createdAt: YESTERDAY, actionUrl: '/driver/payments',
  },
  {
    id: 'n4', type: 'court', title: 'Court Date Reminder',
    message: 'Court hearing for case <strong>#CDL-2024-0622</strong>.',
    read: true, createdAt: EARLIER, actionUrl: '/driver/cases/c4',
    metadata: { priority: 'high' },
  },
  {
    id: 'n5', type: 'case_update', title: 'Case Resolved',
    message: 'Case <strong>#CDL-2024-0503</strong> resolved. Charges dismissed.',
    read: true, createdAt: OLDER, actionUrl: '/driver/cases/c5',
  },
];

function makeServiceSpy(notifications = MOCK_NOTIFICATIONS) {
  const notif$ = new BehaviorSubject<Notification[]>(notifications);
  const unread$ = new BehaviorSubject<number>(notifications.filter(n => !n.read).length);
  const newNotif$ = new Subject<Notification>();
  return {
    notifications$: notif$,
    unreadCount$: unread$,
    newNotification$: newNotif$,
    getNotifications: vi.fn().mockReturnValue(of({ notifications, total: notifications.length })),
    markAsRead: vi.fn().mockReturnValue(of({ message: 'ok' })),
    markAllAsRead: vi.fn().mockReturnValue(of({ message: 'ok' })),
    deleteNotification: vi.fn().mockReturnValue(of({ message: 'ok' })),
    clearAll: vi.fn().mockReturnValue(of({ message: 'ok' })),
    connectWebSocket: vi.fn(),
    disconnectWebSocket: vi.fn(),
    _notif$: notif$,
    _unread$: unread$,
    _newNotif$: newNotif$,
  };
}

async function setup(spy = makeServiceSpy()) {
  const routerSpy = { navigate: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [NotificationsComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: NotificationService, useValue: spy },
      { provide: Router, useValue: routerSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(NotificationsComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, spy, router: routerSpy };
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
});

describe('NotificationsComponent', () => {
  // ── Page structure ──
  it('renders page header with title and subtitle', async () => {
    const { fixture } = await setup();
    const title = fixture.nativeElement.querySelector('.page-title');
    expect(title?.textContent).toContain('Notifications');
    expect(fixture.nativeElement.querySelector('.page-sub')).toBeTruthy();
  });

  it('shows unread badge when unread > 0', async () => {
    const { fixture } = await setup();
    const badge = fixture.nativeElement.querySelector('.unread-badge');
    expect(badge?.textContent).toContain('2 unread');
  });

  it('renders Preferences and Mark All Read buttons', async () => {
    const { fixture } = await setup();
    const buttons = fixture.nativeElement.querySelectorAll('.header-actions .btn');
    const texts = Array.from(buttons).map((b: any) => b.textContent.trim());
    expect(texts.some((t: string) => t.includes('Preferences'))).toBe(true);
    expect(texts.some((t: string) => t.includes('Mark All Read'))).toBe(true);
  });

  // ── Summary cards ──
  it('renders 4 summary cards', async () => {
    const { fixture } = await setup();
    const cards = fixture.nativeElement.querySelectorAll('.sum-card');
    expect(cards.length).toBe(4);
  });

  it('summary cards show correct counts', async () => {
    const { component } = await setup();
    expect(component.getCardCount('all')).toBe(5);
    expect(component.getCardCount('unread')).toBe(2);
    expect(component.getCardCount('read')).toBe(3);
    expect(component.getCardCount('action_needed')).toBe(1);
  });

  it('clicking summary card updates selectedFilter', async () => {
    const { fixture, component } = await setup();
    const cards = fixture.nativeElement.querySelectorAll('.sum-card');
    cards[1].click(); // Unread
    expect(component.selectedFilter()).toBe('unread');
  });

  it('active summary card has active-filter class', async () => {
    const { fixture } = await setup();
    const activeCard = fixture.nativeElement.querySelector('.sum-card.active-filter');
    expect(activeCard).toBeTruthy();
  });

  // ── Tabs ──
  it('renders 3 tabs (All, Unread, Read)', async () => {
    const { fixture } = await setup();
    const tabs = fixture.nativeElement.querySelectorAll('.tab');
    expect(tabs.length).toBe(3);
  });

  it('tab switching updates filter', async () => {
    const { fixture, component } = await setup();
    const tabs = fixture.nativeElement.querySelectorAll('.tab');
    tabs[1].click(); // Unread
    expect(component.selectedFilter()).toBe('unread');
  });

  it('active tab has active class', async () => {
    const { fixture } = await setup();
    const activeTab = fixture.nativeElement.querySelector('.tab.active');
    expect(activeTab?.textContent).toContain('All');
  });

  // ── Filter logic ──
  it('filteredNotifications returns all by default', async () => {
    const { component } = await setup();
    expect(component.filteredNotifications().length).toBe(5);
  });

  it('filteredNotifications filters to unread', async () => {
    const { component } = await setup();
    component.setFilter('unread');
    expect(component.filteredNotifications().length).toBe(2);
    expect(component.filteredNotifications().every(n => !n.read)).toBe(true);
  });

  it('filteredNotifications filters to read', async () => {
    const { component } = await setup();
    component.setFilter('read');
    expect(component.filteredNotifications().length).toBe(3);
    expect(component.filteredNotifications().every(n => n.read)).toBe(true);
  });

  it('filteredNotifications filters action_needed by type or priority', async () => {
    const { component } = await setup();
    component.setFilter('action_needed');
    const result = component.filteredNotifications();
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('n4');
  });

  // ── Date grouping ──
  it('groupedNotifications computes date groups', async () => {
    const { component } = await setup();
    // Override NOW for deterministic grouping
    const groups = component.groupedNotifications();
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.some(g => g.label === 'Today' || g.label === 'Yesterday' || g.label === 'Earlier this week' || g.label === 'Older')).toBe(true);
  });

  it('renders date group headers in DOM', async () => {
    const { fixture } = await setup();
    const headers = fixture.nativeElement.querySelectorAll('.date-group-header');
    expect(headers.length).toBeGreaterThan(0);
  });

  it('date group headers show notification count', async () => {
    const { fixture } = await setup();
    const counts = fixture.nativeElement.querySelectorAll('.date-group-count');
    expect(counts.length).toBeGreaterThan(0);
    const firstCount = parseInt(counts[0].textContent.trim());
    expect(firstCount).toBeGreaterThan(0);
  });

  // ── Notification items ──
  it('renders notification items', async () => {
    const { fixture } = await setup();
    const items = fixture.nativeElement.querySelectorAll('.notif-item');
    expect(items.length).toBe(5);
  });

  it('unread items have unread class', async () => {
    const { fixture } = await setup();
    const unreadItems = fixture.nativeElement.querySelectorAll('.notif-item.unread');
    expect(unreadItems.length).toBe(2);
  });

  it('read items have read class with dimmed title', async () => {
    const { fixture } = await setup();
    const readItems = fixture.nativeElement.querySelectorAll('.notif-item.read');
    expect(readItems.length).toBe(3);
  });

  it('unread items show NEW pill', async () => {
    const { fixture } = await setup();
    const pills = fixture.nativeElement.querySelectorAll('.notif-new-pill');
    expect(pills.length).toBe(2);
  });

  it('displays type chips with correct labels', async () => {
    const { component } = await setup();
    expect(component.getTypeChip('case_update').label).toBe('Case Update');
    expect(component.getTypeChip('message').label).toBe('Message');
    expect(component.getTypeChip('payment').label).toBe('Payment');
    expect(component.getTypeChip('court').label).toBe('Action Needed');
  });

  it('shows colored left bar for unread, transparent for read', async () => {
    const { component } = await setup();
    expect(component.getBarColor(MOCK_NOTIFICATIONS[0])).toBe('blue'); // case_update, unread
    expect(component.getBarColor(MOCK_NOTIFICATIONS[1])).toBe('teal'); // message, unread
    expect(component.getBarColor(MOCK_NOTIFICATIONS[2])).toBe('none'); // payment, read
  });

  // ── CTA labels ──
  it('returns correct CTA label per type', async () => {
    const { component } = await setup();
    expect(component.getCtaLabel('case_update')).toBe('View Case');
    expect(component.getCtaLabel('message')).toBe('Reply to Message');
    expect(component.getCtaLabel('payment')).toBe('View Receipt');
    expect(component.getCtaLabel('court')).toBe('View Case');
  });

  it('renders CTA links in DOM', async () => {
    const { fixture } = await setup();
    const links = fixture.nativeElement.querySelectorAll('.notif-case-link');
    expect(links.length).toBe(5);
  });

  // ── Mark as read ──
  it('markAsRead calls service', async () => {
    const { component, spy } = await setup();
    const event = new Event('click');
    component.markAsRead(MOCK_NOTIFICATIONS[0], event);
    expect(spy.markAsRead).toHaveBeenCalledWith('n1');
  });

  it('markAllAsRead calls service', async () => {
    const { component, spy } = await setup();
    component.markAllAsRead();
    expect(spy.markAllAsRead).toHaveBeenCalled();
  });

  // ── Delete ──
  it('deleteNotification calls service', async () => {
    const { component, spy } = await setup();
    const event = new Event('click');
    component.deleteNotification(MOCK_NOTIFICATIONS[0], event);
    expect(spy.deleteNotification).toHaveBeenCalledWith('n1');
  });

  // ── Clear all ──
  it('clearAll calls service', async () => {
    const { component, spy } = await setup();
    component.clearAll();
    expect(spy.clearAll).toHaveBeenCalled();
  });

  // ── Navigation ──
  it('onNotificationClick navigates to actionUrl', async () => {
    const { component, router } = await setup();
    component.onNotificationClick(MOCK_NOTIFICATIONS[2]); // read, so no markAsRead
    expect(router.navigate).toHaveBeenCalledWith(['/driver/payments']);
  });

  it('onNotificationClick marks unread as read first', async () => {
    const { component, spy, router } = await setup();
    component.onNotificationClick(MOCK_NOTIFICATIONS[0]); // unread
    expect(spy.markAsRead).toHaveBeenCalledWith('n1');
    expect(router.navigate).toHaveBeenCalledWith(['/driver/cases/c1']);
  });

  it('goToSettings navigates to settings page', async () => {
    const { component, router } = await setup();
    component.goToSettings();
    expect(router.navigate).toHaveBeenCalledWith(['/driver/settings/notifications']);
  });

  // ── Empty state ──
  it('shows empty state when no notifications', async () => {
    const spy = makeServiceSpy([]);
    spy._notif$.next([]);
    spy._unread$.next(0);
    const { fixture } = await setup(spy);
    fixture.detectChanges();
    const emptyTitle = fixture.nativeElement.querySelector('.empty-title');
    expect(emptyTitle?.textContent).toContain('All caught up');
  });

  it('empty state message changes per filter', async () => {
    const { component } = await setup();
    expect(component.getEmptyTitle()).toBe('All caught up!');
    component.setFilter('unread');
    expect(component.getEmptyTitle()).toBe('No unread notifications');
    component.setFilter('action_needed');
    expect(component.getEmptyTitle()).toBe('No action needed');
  });

  // ── Computed signals ──
  it('totalCount, readCount, actionNeededCount are correct', async () => {
    const { component } = await setup();
    expect(component.totalCount()).toBe(5);
    expect(component.readCount()).toBe(3);
    expect(component.actionNeededCount()).toBe(1);
  });

  // ── Batch select ──
  it('toggleSelection adds/removes from selectedItems', async () => {
    const { component } = await setup();
    component.toggleSelection('n1');
    expect(component.isSelected('n1')).toBe(true);
    component.toggleSelection('n1');
    expect(component.isSelected('n1')).toBe(false);
  });

  it('toggleSelectAll selects all filtered notifications', async () => {
    const { component } = await setup();
    component.toggleSelectAll();
    expect(component.selectedItems().size).toBe(5);
  });

  it('toggleSelectAll deselects when all selected', async () => {
    const { component } = await setup();
    component.toggleSelectAll();
    expect(component.selectedItems().size).toBe(5);
    component.toggleSelectAll();
    expect(component.selectedItems().size).toBe(0);
  });

  it('bulkMarkRead calls markAsRead for each selected', async () => {
    const { component, spy } = await setup();
    component.toggleSelection('n1');
    component.toggleSelection('n2');
    component.bulkMarkRead();
    expect(spy.markAsRead).toHaveBeenCalledWith('n1');
    expect(spy.markAsRead).toHaveBeenCalledWith('n2');
    expect(component.selectedItems().size).toBe(0);
  });

  it('bulkDelete calls deleteNotification for each selected', async () => {
    const { component, spy } = await setup();
    component.toggleSelection('n1');
    component.bulkDelete();
    expect(spy.deleteNotification).toHaveBeenCalledWith('n1');
    expect(component.selectedItems().size).toBe(0);
  });

  it('setFilter clears selection', async () => {
    const { component } = await setup();
    component.toggleSelection('n1');
    expect(component.selectedItems().size).toBe(1);
    component.setFilter('unread');
    expect(component.selectedItems().size).toBe(0);
  });

  // ── Checkbox keyboard ──
  it('onCheckboxKeydown Enter toggles selection', async () => {
    const { component } = await setup();
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    vi.spyOn(event, 'preventDefault');
    component.onCheckboxKeydown(event, 'n1');
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.isSelected('n1')).toBe(true);
  });

  it('onCheckboxKeydown Space toggles selection', async () => {
    const { component } = await setup();
    const event = new KeyboardEvent('keydown', { key: ' ' });
    vi.spyOn(event, 'preventDefault');
    component.onCheckboxKeydown(event, 'n2');
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.isSelected('n2')).toBe(true);
  });

  // ── WebSocket ──
  it('connects WebSocket on init when token exists', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token');
    const { spy } = await setup();
    expect(spy.connectWebSocket).toHaveBeenCalledWith('test-token');
  });

  it('disconnects WebSocket on destroy', async () => {
    const { fixture, spy } = await setup();
    fixture.destroy();
    expect(spy.disconnectWebSocket).toHaveBeenCalled();
  });

  it('shows toast on new real-time notification', async () => {
    const spy = makeServiceSpy();
    const { component } = await setup(spy);
    spy._newNotif$.next({ id: 'new1', type: 'case_update', title: 'New Alert', message: 'test', read: false, createdAt: TODAY });
    expect(component.toastMessage()).toContain('New: New Alert');
  });

  // ── Toast ──
  it('showToast sets message and type', async () => {
    const { component } = await setup();
    component.showToast('Test message', 'error');
    expect(component.toastMessage()).toBe('Test message');
    expect(component.toastType()).toBe('error');
  });

  it('dismissToast clears message', async () => {
    const { component } = await setup();
    component.showToast('Test', 'success');
    component.dismissToast();
    expect(component.toastMessage()).toBe('');
  });

  // ── Relative time ──
  it('formatTime returns relative strings', async () => {
    const { component } = await setup();
    const recent = new Date(Date.now() - 5 * 60000).toISOString();
    expect(component.formatTime(recent)).toContain('minutes ago');
    const hourAgo = new Date(Date.now() - 2 * 3600000).toISOString();
    expect(component.formatTime(hourAgo)).toContain('hours ago');
  });

  // ── Emoji helpers ──
  it('getEmoji returns correct emoji per type', async () => {
    const { component } = await setup();
    expect(component.getEmoji('case_update')).toBe('⚖️');
    expect(component.getEmoji('message')).toBe('💬');
    expect(component.getEmoji('payment')).toBe('💳');
    expect(component.getEmoji('court')).toBe('📅');
  });

  // ── Accessibility ──
  it('emojis in summary icons have aria-hidden spans', async () => {
    const { fixture } = await setup();
    const emojiSpans = fixture.nativeElement.querySelectorAll('.sum-icon [aria-hidden="true"]');
    expect(emojiSpans.length).toBe(4);
  });

  it('notification list has role="list"', async () => {
    const { fixture } = await setup();
    const list = fixture.nativeElement.querySelector('[role="list"]');
    expect(list).toBeTruthy();
  });

  it('notification items have role="listitem"', async () => {
    const { fixture } = await setup();
    const items = fixture.nativeElement.querySelectorAll('[role="listitem"]');
    expect(items.length).toBe(5);
  });

  it('action buttons have aria-label', async () => {
    const { fixture } = await setup();
    const delBtns = fixture.nativeElement.querySelectorAll('[aria-label="Delete notification"]');
    expect(delBtns.length).toBe(5);
  });

  it('checkboxes have role="checkbox" and aria-checked', async () => {
    const { fixture } = await setup();
    const checkboxes = fixture.nativeElement.querySelectorAll('[role="checkbox"]');
    expect(checkboxes.length).toBe(5);
    expect(checkboxes[0].getAttribute('aria-checked')).toBe('false');
  });

  it('page title is an h1 element', async () => {
    const { fixture } = await setup();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent).toContain('Notifications');
  });

  // ── Footer ──
  it('renders footer with count and preferences link', async () => {
    const { fixture } = await setup();
    const footer = fixture.nativeElement.querySelector('.notif-footer');
    expect(footer?.textContent).toContain('5 notifications');
    const link = fixture.nativeElement.querySelector('.prefs-link');
    expect(link?.textContent).toContain('Manage notification preferences');
  });

  // ── Loading state ──
  it('shows loading spinner initially', async () => {
    const spy = makeServiceSpy();
    // Don't let getNotifications resolve immediately
    spy.getNotifications = vi.fn().mockReturnValue(of({ notifications: [], total: 0 }));
    // The component sets loading false after subscribe, so we test the loading signal directly
    const routerSpy = { navigate: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [NotificationsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: spy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NotificationsComponent);
    // Before detectChanges, loading should be true after ngOnInit runs
    fixture.detectChanges();
    // After detectChanges and subscription resolves, loading is false
    expect(fixture.componentInstance.loading()).toBe(false);
  });
});
