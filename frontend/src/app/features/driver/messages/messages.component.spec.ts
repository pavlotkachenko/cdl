import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { MessagesComponent } from './messages.component';
import { environment } from '../../../../environments/environment';
import { Conversation, Message } from '../../../core/services/messaging.service';

const BASE = `${environment.apiUrl}`;

const CONV: Conversation = {
  id: 'c1', driverId: 'u1', attorneyId: 'a1',
  driver: { id: 'u1', name: 'John Driver' },
  attorney: { id: 'a1', name: 'Jane Attorney' },
  lastMessage: 'Hello', lastMessageAt: '2026-01-01', unreadCount: 2, createdAt: '2026-01-01',
};

const MSG: Message = {
  id: 'm1', conversationId: 'c1', senderId: 'a1',
  content: 'Hi there', isRead: false, createdAt: '2026-01-02',
};

describe('MessagesComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<MessagesComponent>>;
  let component: MessagesComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessagesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideRouter([]),
      ],
    }).compileComponents();

    http      = TestBed.inject(HttpTestingController);
    fixture   = TestBed.createComponent(MessagesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => http.verify());

  function flushConversations(convs = [CONV]) {
    fixture.detectChanges();
    http.expectOne(`${BASE}/conversations`).flush({ data: convs });
    fixture.detectChanges();
  }

  it('shows loading state while conversations load', () => {
    fixture.detectChanges();
    expect(component.loadingConvs()).toBe(true);
    http.expectOne(`${BASE}/conversations`).flush({ data: [] });
  });

  it('renders conversation list after load', () => {
    flushConversations();
    expect(component.conversations()).toHaveLength(1);
    expect(component.conversations()[0].id).toBe('c1');
    expect(component.loadingConvs()).toBe(false);
  });

  it('shows error state on conversation load failure', () => {
    fixture.detectChanges();
    http.expectOne(`${BASE}/conversations`).flush('error', { status: 500, statusText: 'error' });
    fixture.detectChanges();
    expect(component.convError()).toBeTruthy();
  });

  it('selectConversation() loads messages and marks as read', () => {
    flushConversations();

    component.selectConversation(CONV);
    http.expectOne(`${BASE}/conversations/c1/read`).flush({});
    http.expectOne(`${BASE}/conversations/c1/messages`).flush({ messages: [MSG] });
    fixture.detectChanges();

    expect(component.selectedConv()?.id).toBe('c1');
    expect(component.messages()).toHaveLength(1);
    expect(component.messages()[0].content).toBe('Hi there');
  });

  it('selectConversation() clears unread count', () => {
    flushConversations();
    expect(component.conversations()[0].unreadCount).toBe(2);

    component.selectConversation(CONV);
    http.expectOne(`${BASE}/conversations/c1/read`).flush({});
    http.expectOne(`${BASE}/conversations/c1/messages`).flush({ messages: [] });

    expect(component.conversations()[0].unreadCount).toBe(0);
  });

  it('closeThread() clears selectedConv and messages', () => {
    flushConversations();
    component.selectConversation(CONV);
    http.expectOne(`${BASE}/conversations/c1/read`).flush({});
    http.expectOne(`${BASE}/conversations/c1/messages`).flush({ messages: [MSG] });

    component.closeThread();
    expect(component.selectedConv()).toBeNull();
    expect(component.messages()).toHaveLength(0);
  });

  it('sendMessage() posts to /messages and appends to thread', () => {
    flushConversations();
    component.selectConversation(CONV);
    http.expectOne(`${BASE}/conversations/c1/read`).flush({});
    http.expectOne(`${BASE}/conversations/c1/messages`).flush({ messages: [] });

    component.msgForm.setValue({ content: 'Hello!' });
    component.sendMessage();

    const req = http.expectOne(`${BASE}/messages`);
    expect(req.request.body).toEqual({ conversationId: 'c1', content: 'Hello!' });
    req.flush({ message: { ...MSG, content: 'Hello!', senderId: 'u1' } });
    fixture.detectChanges();

    expect(component.messages()).toHaveLength(1);
    expect(component.messages()[0].content).toBe('Hello!');
    expect(component.sending()).toBe(false);
  });

  it('sendMessage() does nothing when form is empty', () => {
    flushConversations();
    component.selectConversation(CONV);
    http.expectOne(`${BASE}/conversations/c1/read`).flush({});
    http.expectOne(`${BASE}/conversations/c1/messages`).flush({ messages: [] });

    component.msgForm.setValue({ content: '' });
    component.sendMessage();
    // no extra requests expected — http.verify() in afterEach will confirm
  });

  it('otherPartyName() returns attorney name when driverId matches currentUserId', () => {
    // Inject a matching driverId so the condition evaluates to true
    const asDriver = { ...CONV, driverId: '' }; // currentUserId is '' (no token)
    expect(component.otherPartyName(asDriver)).toBe('Jane Attorney');
  });
});
