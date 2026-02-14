// ============================================
// Messaging Service (Type-Safe)
// Location: frontend/src/app/core/services/messaging.service.ts
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  messageType: 'text' | 'file' | 'video_link' | 'quick_question';
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
}

export interface Conversation {
  id: string;
  caseId: string;
  driverId: string;
  attorneyId: string;
  lastMessageAt: Date;
  unreadCount: number;
  driver: {
    id: string;
    name: string;
    avatar?: string;
  };
  attorney: {
    id: string;
    name: string;
    avatar?: string;
  };
  case: {
    id: string;
    caseNumber: string;
    type: string;
    status: string;
  };
  lastMessage?: Message;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface MessageResponse {
  success: boolean;
  message: Message;
}

export interface QuickQuestionsResponse {
  success: boolean;
  quickQuestions: QuickQuestion[];
}

export interface QuickQuestion {
  id: number;
  text: string;
  category: string;
}

export interface VideoLinkResponse {
  success: boolean;
  videoLink: {
    platform: string;
    link: string;
    meetingId: string;
  };
}

export interface TypingEvent {
  userId: string;
  userName: string;
  conversationId: string;
}

export interface UserOnlineEvent {
  userId: string;
  userName: string;
}

export interface MessageReadEvent {
  conversationId: string;
  userId: string;
  readAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private apiUrl = environment.apiUrl + '/messages';
  private socket!: Socket;

  // State management
  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();

  private currentConversationSubject = new BehaviorSubject<Conversation | null>(null);
  public currentConversation$ = this.currentConversationSubject.asObservable();

  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  // Real-time events
  private newMessageSubject = new Subject<Message>();
  public newMessage$ = this.newMessageSubject.asObservable();

  private typingSubject = new Subject<TypingEvent>();
  public typing$ = this.typingSubject.asObservable();

  private userOnlineSubject = new Subject<UserOnlineEvent>();
  public userOnline$ = this.userOnlineSubject.asObservable();

  private messageReadSubject = new Subject<MessageReadEvent>();
  public messageRead$ = this.messageReadSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.initializeSocket();
  }

  // ============================================
  // Socket.io Setup
  // ============================================
  private initializeSocket(): void {
    const token = this.authService.getToken();
    
    if (!token) {
      console.warn('No auth token, skipping socket connection');
      return;
    }

    this.socket = io(environment.apiUrl, {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to messaging server');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from messaging server');
    });

    // Listen for new messages
    this.socket.on('new_message', (data: { message: Message }) => {
      console.log('📩 New message received:', data.message);
      this.handleNewMessage(data.message);
    });

    // Listen for typing indicators
    this.socket.on('user_typing', (data: TypingEvent) => {
      this.typingSubject.next(data);
    });

    this.socket.on('user_stopped_typing', (data: TypingEvent) => {
      // Handle stopped typing
    });

    // Listen for online status
    this.socket.on('user_online', (data: UserOnlineEvent) => {
      this.userOnlineSubject.next(data);
    });

    this.socket.on('user_offline', (data: UserOnlineEvent) => {
      // Handle user offline
    });

    // Listen for read receipts
    this.socket.on('messages_read', (data: MessageReadEvent) => {
      this.messageReadSubject.next(data);
      this.updateMessageReadStatus(data.conversationId, data.readAt);
    });
  }

  // ============================================
  // Conversations
  // ============================================
  getConversations(): Observable<ConversationsResponse> {
    return this.http.get<ConversationsResponse>(`${this.apiUrl}/conversations`).pipe(
      tap(response => {
        if (response.success) {
          this.conversationsSubject.next(response.conversations);
        }
      })
    );
  }

  getConversation(conversationId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/conversations/${conversationId}`).pipe(
      tap(response => {
        if (response.success) {
          this.currentConversationSubject.next(response.conversation);
        }
      })
    );
  }

  createConversation(caseId: string, attorneyId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/conversations`, {
      caseId,
      attorneyId
    });
  }

  // ============================================
  // Messages
  // ============================================
  getMessages(conversationId: string, page: number = 1): Observable<MessagesResponse> {
    return this.http.get<MessagesResponse>(`${this.apiUrl}/conversations/${conversationId}/messages`, {
      params: { page: page.toString() }
    }).pipe(
      tap(response => {
        if (response.success) {
          if (page === 1) {
            this.messagesSubject.next(response.messages);
          } else {
            // Prepend older messages
            const currentMessages = this.messagesSubject.value;
            this.messagesSubject.next([...response.messages, ...currentMessages]);
          }
        }
      })
    );
  }

  sendMessage(conversationId: string, content: string, messageType: string = 'text'): Observable<MessageResponse> {
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
      `${this.apiUrl}/conversations/${conversationId}/messages/with-file`,
      formData
    );
  }

  markAsRead(conversationId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/conversations/${conversationId}/mark-read`, {});
  }

  searchMessages(query: string, conversationId?: string): Observable<any> {
    const params: any = { q: query };
    if (conversationId) {
      params.conversationId = conversationId;
    }

    return this.http.get<any>(`${this.apiUrl}/search`, { params });
  }

  // ============================================
  // Quick Questions
  // ============================================
  getQuickQuestions(): Observable<QuickQuestionsResponse> {
    return this.http.get<QuickQuestionsResponse>(`${this.apiUrl}/quick-questions`);
  }

  // ============================================
  // Video Calls
  // ============================================
  generateVideoLink(conversationId: string, platform: 'zoom' | 'meet' = 'zoom'): Observable<VideoLinkResponse> {
    return this.http.post<VideoLinkResponse>(`${this.apiUrl}/video-calls/generate`, {
      conversationId,
      platform
    });
  }

  // ============================================
  // Real-time Actions
  // ============================================
  joinConversation(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  startTyping(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('typing_start', { conversationId });
    }
  }

  stopTyping(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('typing_stop', { conversationId });
    }
  }

  // ============================================
  // Helper Methods
  // ============================================
  private handleNewMessage(message: Message): void {
    // Add to messages array if it's for current conversation
    const currentConv = this.currentConversationSubject.value;
    if (currentConv && message.conversationId === currentConv.id) {
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, message]);
    }

    // Emit event
    this.newMessageSubject.next(message);

    // Update conversation list
    this.updateConversationsList(message);
  }

  private updateConversationsList(message: Message): void {
    const conversations = this.conversationsSubject.value;
    const index = conversations.findIndex(c => c.id === message.conversationId);
    
    if (index !== -1) {
      const updated = [...conversations];
      updated[index] = {
        ...updated[index],
        lastMessage: message,
        lastMessageAt: message.createdAt,
        unreadCount: updated[index].unreadCount + 1
      };
      
      // Move to top
      updated.unshift(updated.splice(index, 1)[0]);
      
      this.conversationsSubject.next(updated);
    }
  }

  private updateMessageReadStatus(conversationId: string, readAt: Date): void {
    const messages = this.messagesSubject.value;
    const updated = messages.map(msg => {
      if (msg.conversationId === conversationId && !msg.isRead) {
        return { ...msg, isRead: true, readAt };
      }
      return msg;
    });
    this.messagesSubject.next(updated);
  }

  // ============================================
  // Cleanup
  // ============================================
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
