import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  driverId: string;
  attorneyId: string;
  driver: { id: string; name: string };
  attorney: { id: string; name: string };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private http = inject(HttpClient);
  private api  = `${environment.apiUrl}`;

  // Real-time subjects populated by socket events
  readonly newMessage$ = new Subject<Message>();
  readonly typing$     = new Subject<TypingEvent>();

  private socket: any = null;

  getConversations(): Observable<Conversation[]> {
    return this.http.get<any>(`${this.api}/conversations`).pipe(
      map(r => r.data ?? r.conversations ?? []),
    );
  }

  getMessages(conversationId: string): Observable<Message[]> {
    return this.http.get<any>(`${this.api}/conversations/${conversationId}/messages`).pipe(
      map(r => r.data?.messages ?? r.messages ?? []),
    );
  }

  sendMessage(conversationId: string, content: string): Observable<Message> {
    return this.http.post<any>(`${this.api}/messages`, { conversationId, content }).pipe(
      map(r => r.data ?? r.message),
    );
  }

  markAsRead(conversationId: string): Observable<void> {
    return this.http.post<void>(`${this.api}/conversations/${conversationId}/read`, {});
  }

  /** Lazily connect socket. Idempotent — safe to call multiple times. */
  connectSocket(token: string): void {
    if (this.socket || typeof window === 'undefined') return;
    import('socket.io-client').then(({ io }) => {
      this.socket = io(this.api.replace('/api', ''), { auth: { token } });
      this.socket.on('new-message', (m: Message)  => this.newMessage$.next(m));
      this.socket.on('typing',      (e: TypingEvent) => this.typing$.next(e));
    }).catch(() => { /* socket unavailable — real-time degrades gracefully */ });
  }

  joinConversation(id: string):  void { this.socket?.emit('join-conversation',  { conversationId: id }); }
  leaveConversation(id: string): void { this.socket?.emit('leave-conversation', { conversationId: id }); }
  emitTyping(id: string):        void { this.socket?.emit('typing-start',       { conversationId: id }); }
  disconnect():                  void { this.socket?.disconnect(); this.socket = null; }
}
