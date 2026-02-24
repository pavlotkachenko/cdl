// ============================================
// Messaging Service - Real Backend Integration
// Location: frontend/src/app/features/driver/services/messaging.service.ts
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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
  caseId?: string;
  driver: User;
  attorney: User;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  messageType?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: Date;
  isRead: boolean;
  readAt?: Date;
}

export interface QuickQuestion {
  id: string;
  question: string;
  category: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface VideoLink {
  id: string;
  conversationId: string;
  platform: 'zoom' | 'meet';
  link: string;
  createdAt: Date;
  expiresAt?: Date;
}

// Response Types
export interface ConversationsResponse {
  success: boolean;
  data: Conversation[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface MessagesResponse {
  success: boolean;
  data: Message[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface MessageResponse {
  success: boolean;
  data: Message;
  message?: string;
}

export interface QuickQuestionsResponse {
  success: boolean;
  data: QuickQuestion[];
  message?: string;
}

export interface VideoLinkResponse {
  success: boolean;
  data: VideoLink;
  message?: string;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  userName?: string;
}

export interface OnlineStatusEvent {
  userId: string;
  userName: string;
  isOnline: boolean;
}

export interface MessageReadEvent {
  conversationId: string;
  messageId: string;
  userId: string;
  readAt: Date;
}

// ============================================
// Messaging Service
// ============================================

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private socket!: Socket;
  private apiUrl = environment.apiUrl;
  private wsUrl = environment.wsUrl;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Subjects for real-time events
  newMessage$ = new Subject<Message>();
  messageRead$ = new Subject<MessageReadEvent>();
  messageDeleted$ = new Subject<{ messageId: string; conversationId: string }>();
  userTyping$ = new Subject<TypingEvent>();
  userStoppedTyping$ = new Subject<TypingEvent>();
  userOnline$ = new Subject<OnlineStatusEvent>();
  userOffline$ = new Subject<OnlineStatusEvent>();
  videoLinkGenerated$ = new Subject<VideoLink>();
  connectionStatus$ = new Subject<{ connected: boolean; error?: string }>();

  constructor(private http: HttpClient) {
    this.initializeSocket();
  }

  // ============================================
  // Socket.io Connection Management
  // ============================================

  private initializeSocket(): void {
    const token = this.getAuthToken();
    
    if (!token) {
      console.warn('No auth token found. Socket connection delayed.');
      return;
    }

    this.socket = io(this.wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.connectionStatus$.next({ connected: true });
    });

    this.socket.on('disconnect', (reason: string) => {
      console.warn('⚠️ WebSocket disconnected:', reason);
      this.connectionStatus$.next({ connected: false });
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.connectionStatus$.next({ 
          connected: false, 
          error: 'Failed to connect after multiple attempts' 
        });
      }
    });

    // Message events
    this.socket.on('new-message', (message: Message) => {
      console.log('📨 New message received:', message);
      this.newMessage$.next(message);
    });

    this.socket.on('message-read', (data: MessageReadEvent) => {
      console.log('✓ Message read:', data);
      this.messageRead$.next(data);
    });

    this.socket.on('message-deleted', (data: { messageId: string; conversationId: string }) => {
      console.log('🗑️ Message deleted:', data);
      this.messageDeleted$.next(data);
    });

    // Typing indicators
    this.socket.on('user-typing', (data: TypingEvent) => {
      console.log('⌨️ User typing:', data);
      this.userTyping$.next(data);
    });

    this.socket.on('user-stopped-typing', (data: TypingEvent) => {
      console.log('⌨️ User stopped typing:', data);
      this.userStoppedTyping$.next(data);
    });

    // Presence events
    this.socket.on('user-online', (data: OnlineStatusEvent) => {
      console.log('🟢 User online:', data);
      this.userOnline$.next(data);
    });

    this.socket.on('user-offline', (data: OnlineStatusEvent) => {
      console.log('🔴 User offline:', data);
      this.userOffline$.next(data);
    });

    // Video link events
    this.socket.on('video-link-generated', (data: VideoLink) => {
      console.log('🎥 Video link generated:', data);
      this.videoLinkGenerated$.next(data);
    });

    // Error events
    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  public reconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.reconnectAttempts = 0;
    this.initializeSocket();
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('token') || localStorage.getItem('access_token');
  }

  // ============================================
  // REST API Methods - Conversations
  // ============================================

  getConversations(page = 1, limit = 50): Observable<ConversationsResponse> {
    return this.http.get<ConversationsResponse>(
      `${this.apiUrl}/conversations`,
      { params: { page: page.toString(), limit: limit.toString() } }
    ).pipe(
      tap(response => console.log('Conversations loaded:', response)),
      catchError(this.handleError)
    );
  }

  getConversation(conversationId: string): Observable<{ success: boolean; data: Conversation }> {
    return this.http.get<{ success: boolean; data: Conversation }>(
      `${this.apiUrl}/conversations/${conversationId}`
    ).pipe(
      tap(response => console.log('Conversation loaded:', response)),
      catchError(this.handleError)
    );
  }

  createConversation(attorneyId: string, caseId?: string): Observable<{ success: boolean; data: Conversation }> {
    return this.http.post<{ success: boolean; data: Conversation }>(
      `${this.apiUrl}/conversations`,
      { attorneyId, caseId }
    ).pipe(
      tap(response => console.log('Conversation created:', response)),
      catchError(this.handleError)
    );
  }

  deleteConversation(conversationId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/conversations/${conversationId}`
    ).pipe(
      tap(response => console.log('Conversation deleted:', response)),
      catchError(this.handleError)
    );
  }

  // ============================================
  // REST API Methods - Messages
  // ============================================

  getMessages(conversationId: string, page = 1, limit = 50): Observable<MessagesResponse> {
    return this.http.get<MessagesResponse>(
      `${this.apiUrl}/conversations/${conversationId}/messages`,
      { params: { page: page.toString(), limit: limit.toString() } }
    ).pipe(
      tap(response => console.log('Messages loaded:', response)),
      catchError(this.handleError)
    );
  }

  sendMessage(conversationId: string, content: string, messageType = 'text'): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.apiUrl}/messages`,
      { conversationId, content, messageType }
    ).pipe(
      tap(response => console.log('Message sent:', response)),
      catchError(this.handleError)
    );
  }

  sendMessageWithFile(conversationId: string, file: File, content?: string): Observable<MessageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    
    if (content) {
      formData.append('content', content);
    }

    return this.http.post<MessageResponse>(
      `${this.apiUrl}/messages/file`,
      formData
    ).pipe(
      tap(response => console.log('Message with file sent:', response)),
      catchError(this.handleError)
    );
  }

  markAsRead(messageId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/messages/${messageId}/read`,
      {}
    ).pipe(
      tap(response => console.log('Message marked as read:', response)),
      catchError(this.handleError)
    );
  }

  deleteMessage(messageId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/messages/${messageId}`
    ).pipe(
      tap(response => console.log('Message deleted:', response)),
      catchError(this.handleError)
    );
  }

  // ============================================
  // REST API Methods - Quick Questions
  // ============================================

  getQuickQuestions(): Observable<QuickQuestionsResponse> {
    return this.http.get<QuickQuestionsResponse>(
      `${this.apiUrl}/quick-questions`
    ).pipe(
      tap(response => console.log('Quick questions loaded:', response)),
      catchError(this.handleError)
    );
  }

  // ============================================
  // REST API Methods - Video Links
  // ============================================

  generateVideoLink(conversationId: string, platform: 'zoom' | 'meet'): Observable<VideoLinkResponse> {
    return this.http.post<VideoLinkResponse>(
      `${this.apiUrl}/conversations/${conversationId}/video-link`,
      { platform }
    ).pipe(
      tap(response => console.log('Video link generated:', response)),
      catchError(this.handleError)
    );
  }

  // ============================================
  // Socket.io Methods
  // ============================================

  joinConversation(conversationId: string): void {
    if (this.socket && this.socket.connected) {
      console.log('Joining conversation:', conversationId);
      this.socket.emit('join-conversation', { conversationId });
    } else {
      console.warn('Socket not connected. Cannot join conversation.');
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.socket && this.socket.connected) {
      console.log('Leaving conversation:', conversationId);
      this.socket.emit('leave-conversation', { conversationId });
    }
  }

  startTyping(conversationId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing-start', { conversationId });
    }
  }

  stopTyping(conversationId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing-stop', { conversationId });
    }
  }

  getOnlineUsers(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('get-online-users');
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
    }
  }

  isConnected(): boolean {
    return this.socket && this.socket.connected;
  }

  // ============================================
  // Error Handling
  // ============================================

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || 
                    error.error?.error || 
                    `Server error: ${error.status} - ${error.statusText}`;
    }

    console.error('API Error:', {
      status: error.status,
      message: errorMessage,
      error: error.error
    });

    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      error: error.error
    }));
  }
}
