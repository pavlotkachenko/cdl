// ============================================
// Messaging Service Interface & Types
// ============================================

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../../environments/environment';

// ============================================
// Type Definitions
// ============================================

export type ConversationType = 'attorney_case' | 'operator' | 'support';

export interface User {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  role?: string;
}

export interface Conversation {
  id: string;
  case_id: string | null;
  driver_id: string;
  attorney_id: string | null;
  operator_id: string | null;
  conversation_type: ConversationType;
  driver?: User;
  attorney?: User | null;
  operator?: User | null;
  case?: { id: string; case_number: string; status: string; violation_type?: string } | null;
  last_message_at?: string;
  last_message?: string | null;
  unread_count: number;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id?: string;
  content?: string;
  message_type?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
  is_read: boolean;
  read_at?: string;
  priority?: string;
  sender?: User;
  recipient?: User;
  attachments?: { id: string; file_name: string; file_url: string; file_size: number; file_type: string }[];
}

export interface QuickQuestion {
  id: string;
  question: string;
  category: string;
}

export interface VideoLink {
  id: string;
  conversation_id: string;
  video_url: string;
  generated_by: string;
  expires_at: string;
  created_at?: string;
}

// Response Types — aligned with backend API shape
export interface ConversationsResponse {
  success: boolean;
  data: Conversation[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export interface MessagesResponse {
  success: boolean;
  data: Message[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export interface MessageResponse {
  success: boolean;
  message: string; // status text from backend
  data: Message;   // actual message object
}

export interface QuickQuestionsResponse {
  success: boolean;
  quickQuestions: QuickQuestion[];
  message: string;
}

export interface VideoLinkResponse {
  success: boolean;
  message: string;
  data: VideoLink;
}

export interface TypingEvent {
  conversation_id: string;
  userId: string;
}

// ============================================
// Messaging Service
// ============================================

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private socket!: Socket;
  private apiUrl = '/api'; // Update with your API URL

  // Subjects for real-time events
  newMessage$ = new Subject<Message>();
  typing$ = new Subject<TypingEvent>();
  userOnline$ = new Subject<{ userId: string; userName: string }>();
  messageRead$ = new Subject<{ conversationId: string; userId: string; readAt: Date }>();

  private http = inject(HttpClient);

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    try {
      const wsUrl = environment.wsUrl || window.location.origin;
      this.socket = io(wsUrl, {
        auth: { token: localStorage.getItem('token') },
        reconnectionAttempts: 3,
        timeout: 5000,
      });

      this.socket.on('new-message', (message: Message) => {
        this.newMessage$.next(message);
      });
      this.socket.on('typing', (data: TypingEvent) => {
        this.typing$.next(data);
      });
      this.socket.on('user-online', (data: { userId: string; userName: string }) => {
        this.userOnline$.next(data);
      });
      this.socket.on('message-read', (data: { conversationId: string; userId: string; readAt: Date }) => {
        this.messageRead$.next(data);
      });
    } catch {
      // Socket initialization failed — HTTP-only mode
    }
  }

  // ============================================
  // API Methods
  // ============================================

  getConversations(params?: {
    type?: ConversationType | 'all';
    unread?: boolean;
    search?: string;
  }): Observable<ConversationsResponse> {
    let httpParams = new HttpParams();
    if (params?.type && params.type !== 'all') {
      httpParams = httpParams.set('type', params.type);
    }
    if (params?.unread) {
      httpParams = httpParams.set('unread', 'true');
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    return this.http.get<ConversationsResponse>(`${this.apiUrl}/conversations`, { params: httpParams });
  }

  getMessages(conversationId: string): Observable<MessagesResponse> {
    return this.http.get<MessagesResponse>(`${this.apiUrl}/conversations/${conversationId}/messages`);
  }

  sendMessage(conversationId: string, content: string, recipientId?: string, messageType?: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/messages`, {
      conversationId,
      recipientId,
      content,
      messageType
    });
  }

  sendMessageWithFile(conversationId: string, file: File, recipientId?: string, content?: string): Observable<MessageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    if (recipientId) formData.append('recipientId', recipientId);
    if (content) formData.append('content', content);

    return this.http.post<MessageResponse>(`${this.apiUrl}/messages/file`, formData);
  }

  markAsRead(messageId: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/messages/${messageId}/read`, {});
  }

  getQuickQuestions(): Observable<QuickQuestionsResponse> {
    return this.http.get<QuickQuestionsResponse>(`${this.apiUrl}/quick-questions`);
  }

  generateVideoLink(conversationId: string, platform: 'zoom' | 'meet'): Observable<VideoLinkResponse> {
    return this.http.post<VideoLinkResponse>(`${this.apiUrl}/conversations/${conversationId}/video-link`, {
      platform
    });
  }

  // ============================================
  // Helper Methods
  // ============================================

  /** Returns the non-driver participant of a conversation. */
  getOtherParty(conv: Conversation): User | null {
    if (conv.conversation_type === 'attorney_case') {
      return conv.attorney ?? null;
    }
    return conv.operator ?? null;
  }

  /** Returns a display name for the other party. */
  getOtherPartyName(conv: Conversation): string {
    const other = this.getOtherParty(conv);
    return other?.name ?? other?.full_name ?? other?.email ?? 'Unknown';
  }

  /** Returns a role-based avatar CSS class for a conversation. */
  getAvatarClass(conv: Conversation): string {
    if (conv.closed_at) return 'system';
    switch (conv.conversation_type) {
      case 'attorney_case': return 'attorney';
      case 'operator': return 'operator';
      case 'support': return 'support';
      default: return 'system';
    }
  }

  /** Returns tag label like "Attorney · #0847" */
  getCaseTagLabel(conv: Conversation): string {
    if (conv.conversation_type === 'attorney_case' && conv.case?.case_number) {
      const num = conv.case.case_number.split('-').pop() ?? '';
      return `Attorney · #${num}`;
    }
    if (conv.conversation_type === 'operator') return 'Operations';
    if (conv.conversation_type === 'support') return 'Support';
    return '';
  }

  /** Returns CSS class for the case tag */
  getCaseTagClass(conv: Conversation): string {
    if (conv.closed_at) return 'tag-closed';
    switch (conv.conversation_type) {
      case 'attorney_case': return 'tag-attorney';
      case 'operator': return 'tag-operator';
      case 'support': return 'tag-support';
      default: return 'tag-closed';
    }
  }

  /** Returns role label for a message sender */
  getSenderRole(msg: Message): string {
    switch (msg.sender?.role) {
      case 'attorney': return 'Attorney';
      case 'operator': return 'Operator';
      case 'driver': return 'Driver';
      default: return '';
    }
  }

  /** Returns avatar class for a message sender */
  getSenderAvatarClass(msg: Message): string {
    switch (msg.sender?.role) {
      case 'attorney': return 'attorney';
      case 'operator': return 'operator';
      case 'driver': return 'driver';
      default: return 'system';
    }
  }

  // ============================================
  // Socket Methods
  // ============================================

  joinConversation(conversationId: string): void {
    this.socket?.emit('join-conversation', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit('leave-conversation', { conversationId });
  }

  startTyping(conversationId: string): void {
    this.socket?.emit('typing-start', { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.socket?.emit('typing-stop', { conversationId });
  }

  disconnect(): void {
    this.socket?.disconnect();
  }
}
