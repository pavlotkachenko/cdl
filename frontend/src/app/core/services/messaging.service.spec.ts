import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { MessagingService } from './messaging.service';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}`;

describe('MessagingService', () => {
  let service: MessagingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MessagingService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getConversations() makes GET to /conversations and maps data', () => {
    const conv = { id: 'c1', driverId: 'u1', attorneyId: 'a1', driver: { id: 'u1', name: 'D' }, attorney: { id: 'a1', name: 'A' }, lastMessage: '', lastMessageAt: '', unreadCount: 0, createdAt: '' };
    service.getConversations().subscribe(r => {
      expect(r).toHaveLength(1);
      expect(r[0].id).toBe('c1');
    });
    http.expectOne(`${BASE}/conversations`).flush({ data: [conv] });
  });

  it('getMessages() makes GET to /conversations/:id/messages', () => {
    const msgs = [{ id: 'm1', conversationId: 'c1', senderId: 'u1', content: 'hi', isRead: false, createdAt: '' }];
    service.getMessages('c1').subscribe(r => expect(r).toHaveLength(1));
    http.expectOne(`${BASE}/conversations/c1/messages`).flush({ messages: msgs });
  });

  it('sendMessage() makes POST to /messages with conversationId + content', () => {
    const msg = { id: 'm2', conversationId: 'c1', senderId: 'u1', content: 'hello', isRead: false, createdAt: '' };
    service.sendMessage('c1', 'hello').subscribe(r => expect(r.id).toBe('m2'));
    const req = http.expectOne(`${BASE}/messages`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ conversationId: 'c1', content: 'hello' });
    req.flush({ message: msg });
  });

  it('markAsRead() makes POST to /conversations/:id/read', () => {
    service.markAsRead('c1').subscribe();
    const req = http.expectOne(`${BASE}/conversations/c1/read`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
