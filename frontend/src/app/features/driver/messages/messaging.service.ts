// ============================================
// Messaging Service Interface & Types
// Location: frontend/src/app/features/driver/services/messaging.service.ts
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../../environments/environment';

// ============================================
// Type Definitions
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  firm?: string;
}

export interface Conversation {
  id: string;
  driverId: string;
  attorneyId: string;
  driver: User;
  attorney: User;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  isOnline: boolean; // Added this property
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  messageType?: string;
  fileUrl?: string; // Added this property
  fileName?: string; // Added this property
  fileType?: string; // Added this property
  fileSize?: number; // Added this property
  createdAt: Date;
  isRead: boolean;
  readAt?: Date;
}

export interface QuickQuestion {
  id: string;
  question: string; // Added this property
  category: string;
}

export interface VideoLink {
  id: string;
  conversationId: string;
  platform: 'zoom' | 'meet';
  link: string;
  createdAt: Date;
}

// Response Types
export interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
  message: string;
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
  message: string;
}

export interface MessageResponse {
  success: boolean;
  message: Message;
  messageText: string;
}

export interface QuickQuestionsResponse {
  success: boolean;
  quickQuestions: QuickQuestion[];
  message: string;
}

export interface VideoLinkResponse {
  success: boolean;
  videoLink: VideoLink;
  message: string;
}

export interface TypingEvent {
  conversationId: string;
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

  constructor(private http: HttpClient) {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    // Initialize socket connection
    const wsUrl = environment.wsUrl || window.location.origin;
    this.socket = io(wsUrl, {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // Listen to socket events
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
  }

  // ============================================
  // API Methods
  // ============================================

  getConversations(): Observable<ConversationsResponse> {
    return this.http.get<ConversationsResponse>(`${this.apiUrl}/conversations`);
  }

  getMessages(conversationId: string): Observable<MessagesResponse> {
    return this.http.get<MessagesResponse>(`${this.apiUrl}/conversations/${conversationId}/messages`);
  }

  sendMessage(conversationId: string, content: string, messageType?: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/conversations/${conversationId}/messages`, {
      content,
      messageType
    });
  }

  sendMessageWithFile(conversationId: string, file: File, content?: string): Observable<MessageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (content) {
      formData.append('content', content);
    }

    return this.http.post<MessageResponse>(
      `${this.apiUrl}/conversations/${conversationId}/messages/file`,
      formData
    );
  }

  markAsRead(conversationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/conversations/${conversationId}/read`, {});
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
  // Socket Methods
  // ============================================

  joinConversation(conversationId: string): void {
    this.socket.emit('join-conversation', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.socket.emit('leave-conversation', { conversationId });
  }

  startTyping(conversationId: string): void {
    this.socket.emit('typing-start', { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.socket.emit('typing-stop', { conversationId });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
