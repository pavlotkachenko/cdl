import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MessagesComponent } from './messages.component';
import { Conversation, Message } from './messaging.service';
import { AuthService } from '../../../core/services/auth.service';

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

function makeConv(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    case_id: 'case1',
    driver_id: 'u1',
    attorney_id: 'a1',
    operator_id: null,
    conversation_type: 'attorney_case',
    driver: { id: 'u1', name: 'John Driver', email: 'john@test.com', role: 'driver' },
    attorney: { id: 'a1', name: 'Jane Attorney', email: 'jane@test.com', role: 'attorney' },
    operator: null,
    case: { id: 'case1', case_number: 'CASE-2026-000847', status: 'In Progress' },
    last_message: 'Hello',
    last_message_at: '2026-01-01T12:00:00Z',
    unread_count: 2,
    closed_at: null,
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
    ...overrides,
  };
}

function makeMixedConversations(): Conversation[] {
  return [
    makeConv({ id: 'c1', conversation_type: 'attorney_case', unread_count: 2 }),
    makeConv({
      id: 'c2', conversation_type: 'attorney_case', attorney_id: 'a2',
      attorney: { id: 'a2', name: 'Bob Lawyer', email: 'bob@test.com', role: 'attorney' },
      unread_count: 0,
      case: { id: 'case2', case_number: 'CASE-2026-000622', status: 'Active' },
    }),
    makeConv({
      id: 'c3', conversation_type: 'operator', attorney_id: null, operator_id: 'op1',
      operator: { id: 'op1', name: 'Case Coordinator', email: 'op@test.com', role: 'operator' },
      attorney: null, case_id: null, case: null, unread_count: 1,
    }),
    makeConv({
      id: 'c4', conversation_type: 'support', attorney_id: null, operator_id: 'sup1',
      operator: { id: 'sup1', name: 'CDL Support', email: 'sup@test.com', role: 'operator' },
      attorney: null, case_id: null, case: null, unread_count: 0,
    }),
    makeConv({
      id: 'c5', conversation_type: 'attorney_case',
      closed_at: '2026-01-15T00:00:00Z', unread_count: 0,
    }),
  ];
}

const MSG: Message = {
  id: 'm1',
  conversation_id: 'c1',
  sender_id: 'a1',
  content: 'Hi there',
  is_read: false,
  created_at: '2026-01-02T10:00:00Z',
  sender: { id: 'a1', name: 'Jane Attorney', email: 'jane@test.com', role: 'attorney' },
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('MessagesComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<MessagesComponent>>;
  let component: MessagesComponent;
  let http: HttpTestingController;

  const mockAuth = {
    getCurrentUser: () => ({ id: 'u1', name: 'John Driver', email: 'john@test.com', role: 'driver' }),
    currentUser$: { subscribe: () => ({ unsubscribe: () => {} }) },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessagesComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MessagesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => http.verify());

  /** Triggers ngOnInit and flushes the initial getConversations request. */
  function flushConversations(convs: Conversation[] = [makeConv()]) {
    fixture.detectChanges();
    http.expectOne('/api/conversations').flush({ success: true, data: convs });
    fixture.detectChanges();
  }

  // =====================================================================
  // Core behaviour
  // =====================================================================

  it('shows loading state while conversations load', () => {
    fixture.detectChanges();
    expect(component.loadingConvs()).toBe(true);
    http.expectOne('/api/conversations').flush({ success: true, data: [] });
  });

  it('renders conversations after load', () => {
    flushConversations();
    expect(component.conversations()).toHaveLength(1);
    expect(component.conversations()[0].id).toBe('c1');
    expect(component.loadingConvs()).toBe(false);
  });

  it('shows error state on conversation load failure', () => {
    fixture.detectChanges();
    http.expectOne('/api/conversations').flush('error', { status: 500, statusText: 'error' });
    fixture.detectChanges();
    expect(component.convError()).toBeTruthy();
  });

  it('selectConversation loads messages and sets selected', () => {
    const conv = makeConv();
    flushConversations([conv]);

    component.selectConversation(conv);
    http.expectOne('/api/conversations/c1/messages').flush({ success: true, data: [MSG] });
    fixture.detectChanges();

    expect(component.selectedConv()?.id).toBe('c1');
    expect(component.messages()).toHaveLength(1);
    expect(component.messages()[0].content).toBe('Hi there');
  });

  it('selectConversation leaves previous conversation room', () => {
    const conv1 = makeConv({ id: 'c1' });
    const conv2 = makeConv({ id: 'c2' });
    flushConversations([conv1, conv2]);

    component.selectConversation(conv1);
    http.expectOne('/api/conversations/c1/messages').flush({ success: true, data: [] });

    // Select another — should leave c1
    component.selectConversation(conv2);
    http.expectOne('/api/conversations/c2/messages').flush({ success: true, data: [] });

    expect(component.selectedConv()?.id).toBe('c2');
  });

  it('sendMessage posts to /api/messages and appends result', () => {
    const conv = makeConv();
    flushConversations([conv]);
    component.selectConversation(conv);
    http.expectOne('/api/conversations/c1/messages').flush({ success: true, data: [] });

    component.messageControl.setValue('Hello!');
    component.sendMessage();

    const req = http.expectOne('/api/messages');
    expect(req.request.body.content).toBe('Hello!');
    expect(req.request.body.conversationId).toBe('c1');
    req.flush({ success: true, message: 'Sent', data: { ...MSG, id: 'm2', content: 'Hello!', sender_id: 'u1' } });
    fixture.detectChanges();

    expect(component.messages()).toHaveLength(1);
    expect(component.messages()[0].content).toBe('Hello!');
    expect(component.sending()).toBe(false);
    expect(component.messageControl.value).toBe('');
  });

  it('sendMessage does nothing when input is empty', () => {
    const conv = makeConv();
    flushConversations([conv]);
    component.selectConversation(conv);
    http.expectOne('/api/conversations/c1/messages').flush({ success: true, data: [] });

    component.messageControl.setValue('');
    component.sendMessage();
    // afterEach http.verify() confirms no extra request
  });

  it('sendMessage does nothing when no conversation selected', () => {
    flushConversations();
    component.messageControl.setValue('Hello!');
    component.sendMessage();
    // no extra request — no conversation selected
  });

  it('sendMessage adds local fallback message on error', () => {
    const conv = makeConv();
    flushConversations([conv]);
    component.selectConversation(conv);
    http.expectOne('/api/conversations/c1/messages').flush({ success: true, data: [] });

    component.messageControl.setValue('Offline msg');
    component.sendMessage();

    http.expectOne('/api/messages').flush('err', { status: 500, statusText: 'fail' });
    fixture.detectChanges();

    expect(component.messages()).toHaveLength(1);
    expect(component.messages()[0].content).toBe('Offline msg');
    expect(component.messages()[0].id).toMatch(/^local-/);
    expect(component.sending()).toBe(false);
  });

  it('sendMessage sends recipientId as attorney_id for driver user', () => {
    const conv = makeConv({ driver_id: 'u1', attorney_id: 'a1' });
    flushConversations([conv]);
    component.selectConversation(conv);
    http.expectOne('/api/conversations/c1/messages').flush({ success: true, data: [] });

    component.messageControl.setValue('Test');
    component.sendMessage();

    const req = http.expectOne('/api/messages');
    expect(req.request.body.recipientId).toBe('a1');
    req.flush({ success: true, message: 'Sent', data: { ...MSG, id: 'm2' } });
  });

  it('sendMessage sends recipientId as operator_id when attorney_id is null', () => {
    const conv = makeConv({
      driver_id: 'u1', attorney_id: null, operator_id: 'op1',
      conversation_type: 'operator',
    });
    flushConversations([conv]);
    component.selectConversation(conv);
    http.expectOne('/api/conversations/c1/messages').flush({ success: true, data: [] });

    component.messageControl.setValue('Test');
    component.sendMessage();

    const req = http.expectOne('/api/messages');
    expect(req.request.body.recipientId).toBe('op1');
    req.flush({ success: true, message: 'Sent', data: { ...MSG, id: 'm2' } });
  });

  // =====================================================================
  // Computed — totalUnread
  // =====================================================================

  it('totalUnread sums unread_count across all conversations', () => {
    flushConversations(makeMixedConversations());
    // c1: 2, c2: 0, c3: 1, c4: 0, c5: 0 = 3
    expect(component.totalUnread()).toBe(3);
  });

  // =====================================================================
  // Computed — currentUserId
  // =====================================================================

  it('currentUserId returns auth user id', () => {
    flushConversations();
    expect(component.currentUserId()).toBe('u1');
  });

  // =====================================================================
  // Filtering — tab filters (MSG-7)
  // =====================================================================

  it('"All" tab shows all conversations', () => {
    flushConversations(makeMixedConversations());
    component.activeTab.set('all');
    expect(component.filteredConversations()).toHaveLength(5);
  });

  it('"Attorneys" tab shows only attorney_case conversations', () => {
    flushConversations(makeMixedConversations());
    component.activeTab.set('attorneys');
    const filtered = component.filteredConversations();
    expect(filtered).toHaveLength(3); // c1, c2, c5
    expect(filtered.every(c => c.conversation_type === 'attorney_case')).toBe(true);
  });

  it('"Support" tab shows operator and support conversations', () => {
    flushConversations(makeMixedConversations());
    component.activeTab.set('support');
    const filtered = component.filteredConversations();
    expect(filtered).toHaveLength(2); // c3 (operator), c4 (support)
    expect(filtered.every(c =>
      c.conversation_type === 'operator' || c.conversation_type === 'support'
    )).toBe(true);
  });

  it('"Unread" tab shows only conversations with unread_count > 0', () => {
    flushConversations(makeMixedConversations());
    component.activeTab.set('unread');
    const filtered = component.filteredConversations();
    expect(filtered).toHaveLength(2); // c1: 2, c3: 1
    expect(filtered.every(c => c.unread_count > 0)).toBe(true);
  });

  // =====================================================================
  // Filtering — search (MSG-7)
  // =====================================================================

  it('search filters by other party name (case insensitive)', () => {
    flushConversations(makeMixedConversations());
    component.searchQuery.set('jane');
    const filtered = component.filteredConversations();
    // "Jane Attorney" appears in c1, c5 (both attorney_case with same attorney fixture)
    expect(filtered.length).toBeGreaterThanOrEqual(1);
    expect(filtered.every(c => {
      const name = component['msgSvc'].getOtherPartyName(c);
      return name.toLowerCase().includes('jane');
    })).toBe(true);
  });

  it('search + tab filter combine with AND logic', () => {
    flushConversations(makeMixedConversations());
    component.activeTab.set('attorneys');
    component.searchQuery.set('bob');
    const filtered = component.filteredConversations();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('c2');
  });

  it('search debounces input (300ms)', () => {
    vi.useFakeTimers();
    flushConversations(makeMixedConversations());

    component.searchControl.setValue('jane');
    vi.advanceTimersByTime(100);
    // Not yet applied
    expect(component.searchQuery()).toBe('');

    vi.advanceTimersByTime(200); // total 300ms
    expect(component.searchQuery()).toBe('jane');

    vi.useRealTimers();
  });

  // =====================================================================
  // Grouping — computed signals (MSG-7)
  // =====================================================================

  it('activeCaseConvs returns attorney_case with no closed_at', () => {
    flushConversations(makeMixedConversations());
    const active = component.activeCaseConvs();
    expect(active).toHaveLength(2); // c1, c2 (c5 is closed)
    expect(active.every(c => c.conversation_type === 'attorney_case' && !c.closed_at)).toBe(true);
  });

  it('supportConvs returns operator and support conversations', () => {
    flushConversations(makeMixedConversations());
    const support = component.supportConvs();
    expect(support).toHaveLength(2); // c3 (operator), c4 (support)
  });

  it('closedConvs returns conversations with closed_at set', () => {
    flushConversations(makeMixedConversations());
    const closed = component.closedConvs();
    expect(closed).toHaveLength(1); // c5
    expect(closed[0].id).toBe('c5');
    expect(closed[0].closed_at).toBeTruthy();
  });

  it('empty state when no conversations match filter+search', () => {
    flushConversations(makeMixedConversations());
    component.searchQuery.set('zzz_no_match');
    expect(component.activeCaseConvs()).toHaveLength(0);
    expect(component.supportConvs()).toHaveLength(0);
    expect(component.closedConvs()).toHaveLength(0);
  });

  // =====================================================================
  // UI helper methods
  // =====================================================================

  it('getInitials returns first+last initials from two-word name', () => {
    const conv = makeConv();
    expect(component.getInitials(conv)).toBe('JA'); // "Jane Attorney"
  });

  it('getInitials returns first two chars for single-word name', () => {
    const conv = makeConv({
      attorney: { id: 'a1', name: 'Support', email: 's@test.com' },
    });
    expect(component.getInitials(conv)).toBe('SU');
  });

  it('getSenderInitials uses sender name', () => {
    expect(component.getSenderInitials(MSG)).toBe('JA'); // "Jane Attorney"
  });

  it('formatFileSize formats bytes, KB, and MB', () => {
    expect(component.formatFileSize(500)).toBe('500 B');
    expect(component.formatFileSize(2048)).toBe('2.0 KB');
    expect(component.formatFileSize(1572864)).toBe('1.5 MB');
  });

  it('shouldShowDateSeparator returns true for first message', () => {
    flushConversations();
    component.messages.set([MSG]);
    expect(component.shouldShowDateSeparator(0)).toBe(true);
  });

  it('shouldShowDateSeparator returns true when date changes', () => {
    flushConversations();
    component.messages.set([
      { ...MSG, id: 'm1', created_at: '2026-01-01T10:00:00Z' },
      { ...MSG, id: 'm2', created_at: '2026-01-02T10:00:00Z' },
    ]);
    expect(component.shouldShowDateSeparator(1)).toBe(true);
  });

  it('shouldShowDateSeparator returns false for same date', () => {
    flushConversations();
    component.messages.set([
      { ...MSG, id: 'm1', created_at: '2026-01-01T10:00:00Z' },
      { ...MSG, id: 'm2', created_at: '2026-01-01T14:00:00Z' },
    ]);
    expect(component.shouldShowDateSeparator(1)).toBe(false);
  });

  it('isGroupedWithPrevious groups same-sender messages within 2 min', () => {
    flushConversations();
    component.messages.set([
      { ...MSG, id: 'm1', sender_id: 'a1', created_at: '2026-01-01T10:00:00Z' },
      { ...MSG, id: 'm2', sender_id: 'a1', created_at: '2026-01-01T10:01:30Z' },
    ]);
    expect(component.isGroupedWithPrevious(1)).toBe(true);
  });

  it('isGroupedWithPrevious false for different senders', () => {
    flushConversations();
    component.messages.set([
      { ...MSG, id: 'm1', sender_id: 'a1', created_at: '2026-01-01T10:00:00Z' },
      { ...MSG, id: 'm2', sender_id: 'u1', created_at: '2026-01-01T10:00:30Z' },
    ]);
    expect(component.isGroupedWithPrevious(1)).toBe(false);
  });

  it('isGroupedWithPrevious false when gap > 2 min', () => {
    flushConversations();
    component.messages.set([
      { ...MSG, id: 'm1', sender_id: 'a1', created_at: '2026-01-01T10:00:00Z' },
      { ...MSG, id: 'm2', sender_id: 'a1', created_at: '2026-01-01T10:05:00Z' },
    ]);
    expect(component.isGroupedWithPrevious(1)).toBe(false);
  });

  it('isGroupedWithNext groups same-sender messages within 2 min', () => {
    flushConversations();
    component.messages.set([
      { ...MSG, id: 'm1', sender_id: 'a1', created_at: '2026-01-01T10:00:00Z' },
      { ...MSG, id: 'm2', sender_id: 'a1', created_at: '2026-01-01T10:01:00Z' },
    ]);
    expect(component.isGroupedWithNext(0)).toBe(true);
  });

  // =====================================================================
  // Real-time events
  // =====================================================================

  it('newMessage$ appends message when selected conversation matches', () => {
    const conv = makeConv();
    flushConversations([conv]);
    component.selectConversation(conv);
    http.expectOne('/api/conversations/c1/messages').flush({ success: true, data: [] });

    const incoming: Message = {
      id: 'm3', conversation_id: 'c1', sender_id: 'a1',
      content: 'New message', is_read: false, created_at: '2026-01-02T11:00:00Z',
    };
    component['msgSvc'].newMessage$.next(incoming);

    expect(component.messages()).toHaveLength(1);
    expect(component.messages()[0].content).toBe('New message');
  });

  it('newMessage$ updates conversation preview in list', () => {
    const conv = makeConv();
    flushConversations([conv]);

    const incoming: Message = {
      id: 'm3', conversation_id: 'c1', sender_id: 'a1',
      content: 'Updated preview', is_read: false, created_at: '2026-01-02T11:00:00Z',
    };
    component['msgSvc'].newMessage$.next(incoming);

    expect(component.conversations()[0].last_message).toBe('Updated preview');
  });

  it('typing$ triggers typing indicator for selected conversation', () => {
    const conv = makeConv();
    flushConversations([conv]);
    component.selectConversation(conv);
    http.expectOne('/api/conversations/c1/messages').flush({ success: true, data: [] });

    component['msgSvc'].typing$.next({ conversation_id: 'c1', userId: 'a1' });
    expect(component.typingIndicator()).toBe(true);
  });

  it('typing$ does not trigger for other conversations', () => {
    const conv = makeConv();
    flushConversations([conv]);
    component.selectConversation(conv);
    http.expectOne('/api/conversations/c1/messages').flush({ success: true, data: [] });

    component['msgSvc'].typing$.next({ conversation_id: 'other', userId: 'a1' });
    expect(component.typingIndicator()).toBe(false);
  });

  // =====================================================================
  // Keyboard interaction
  // =====================================================================

  it('onEnterKey sends message when shift is not held', () => {
    const conv = makeConv();
    flushConversations([conv]);
    component.selectConversation(conv);
    http.expectOne('/api/conversations/c1/messages').flush({ success: true, data: [] });

    component.messageControl.setValue('Enter test');
    let prevented = false;
    const event = {
      shiftKey: false,
      preventDefault: () => { prevented = true; },
    } as unknown as Event;
    component.onEnterKey(event);

    const req = http.expectOne('/api/messages');
    expect(req.request.body.content).toBe('Enter test');
    req.flush({ success: true, message: 'Sent', data: { ...MSG, id: 'm9' } });
    expect(prevented).toBe(true);
  });

  it('onEnterKey does not send when shift is held', () => {
    const conv = makeConv();
    flushConversations([conv]);
    component.selectConversation(conv);
    http.expectOne('/api/conversations/c1/messages').flush({ success: true, data: [] });

    component.messageControl.setValue('Newline test');
    const event = { shiftKey: true, preventDefault: () => {} } as unknown as Event;
    component.onEnterKey(event);
    // No /api/messages request expected — http.verify() confirms
  });
});
