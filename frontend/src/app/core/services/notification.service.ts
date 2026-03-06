// ============================================
// NOTIFICATION SERVICE - Complete Implementation
// Location: frontend/src/app/core/services/notification.service.ts
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: string;
  type: 'case' | 'message' | 'court' | 'payment' | 'system' | 'case_update' | 'attorney_message' | 'comment' | 'document' | 'court_date';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  timestamp?: string;
  data?: any;
  metadata?: { priority?: string; [key: string]: any };
  actionUrl?: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  caseUpdates: boolean;
  messageAlerts: boolean;
  courtReminders: boolean;
  paymentReminders: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  private wsUrl = environment.wsUrl || 'ws://localhost:3000';
  
  // WebSocket connection
  private socket: WebSocket | null = null;
  private reconnectInterval: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Observables
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private newNotificationSubject = new Subject<Notification>();
  public newNotification$ = this.newNotificationSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('✅ NotificationService initialized');
  }

  // ============================================
  // Get all notifications
  // ============================================
  getNotifications(params?: {
    type?: string;
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Observable<{ notifications: Notification[]; total: number }> {
    const queryParams = new URLSearchParams();
    
    if (params?.type) queryParams.append('type', params.type);
    if (params?.read !== undefined) queryParams.append('read', params.read.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${this.apiUrl}/notifications?${queryParams.toString()}`;

    return this.http.get<{ notifications: Notification[]; total: number }>(url).pipe(
      tap(response => {
        this.notificationsSubject.next(response.notifications);
        this.updateUnreadCount(response.notifications);
      }),
      catchError(error => {
        console.error('❌ Get notifications error:', error);
        throw error;
      })
    );
  }

  // ============================================
  // Get unread notifications count
  // ============================================
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/notifications/unread-count`).pipe(
      tap(response => {
        this.unreadCountSubject.next(response.count);
      }),
      catchError(error => {
        console.error('❌ Get unread count error:', error);
        throw error;
      })
    );
  }

  // ============================================
  // Mark notification as read
  // ============================================
  markAsRead(notificationId: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/notifications/${notificationId}/read`,
      {}
    ).pipe(
      tap(() => {
        this.updateNotificationReadStatus(notificationId, true);
      }),
      catchError(error => {
        console.error('❌ Mark as read error:', error);
        throw error;
      })
    );
  }

  // ============================================
  // Mark all notifications as read
  // ============================================
  markAllAsRead(): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/notifications/mark-all-read`,
      {}
    ).pipe(
      tap(() => {
        const notifications = this.notificationsSubject.value.map(n => ({
          ...n,
          read: true
        }));
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(0);
      }),
      catchError(error => {
        console.error('❌ Mark all as read error:', error);
        throw error;
      })
    );
  }

  // ============================================
  // Delete notification
  // ============================================
  deleteNotification(notificationId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/notifications/${notificationId}`
    ).pipe(
      tap(() => {
        const notifications = this.notificationsSubject.value.filter(
          n => n.id !== notificationId
        );
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount(notifications);
      }),
      catchError(error => {
        console.error('❌ Delete notification error:', error);
        throw error;
      })
    );
  }

  // ============================================
  // Get notification preferences
  // ============================================
  getPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(
      `${this.apiUrl}/notifications/preferences`
    ).pipe(
      catchError(error => {
        console.error('❌ Get preferences error:', error);
        throw error;
      })
    );
  }

  // ============================================
  // Update notification preferences
  // ============================================
  updatePreferences(preferences: Partial<NotificationPreferences>): Observable<{
    message: string;
    preferences: NotificationPreferences;
  }> {
    return this.http.post<{
      message: string;
      preferences: NotificationPreferences;
    }>(`${this.apiUrl}/notifications/preferences`, preferences).pipe(
      tap(response => {
        console.log('✅ Preferences updated:', response.preferences);
      }),
      catchError(error => {
        console.error('❌ Update preferences error:', error);
        throw error;
      })
    );
  }

  // ============================================
  // Connect to WebSocket for real-time notifications
  // ============================================
  connectWebSocket(token: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      this.socket = new WebSocket(`${this.wsUrl}?token=${token}`);

      this.socket.onopen = () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Clear reconnect interval if exists
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ WebSocket message parse error:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect(token);
      };

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
    }
  }

  // ============================================
  // Disconnect WebSocket
  // ============================================
  disconnectWebSocket(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    console.log('WebSocket disconnected');
  }

  // ============================================
  // Attempt to reconnect WebSocket
  // ============================================
  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectInterval = setTimeout(() => {
      this.connectWebSocket(token);
    }, delay);
  }

  // ============================================
  // Handle WebSocket messages
  // ============================================
  private handleWebSocketMessage(data: any): void {
    if (data.type === 'notification') {
      const notification: Notification = data.notification;
      
      // Add to notifications list
      const currentNotifications = this.notificationsSubject.value;
      this.notificationsSubject.next([notification, ...currentNotifications]);

      // Update unread count
      if (!notification.read) {
        const currentCount = this.unreadCountSubject.value;
        this.unreadCountSubject.next(currentCount + 1);
      }

      // Emit new notification event
      this.newNotificationSubject.next(notification);

      console.log('📬 New notification received:', notification);
    }
  }

  // ============================================
  // Update notification read status locally
  // ============================================
  private updateNotificationReadStatus(notificationId: string, read: boolean): void {
    const notifications = this.notificationsSubject.value.map(n =>
      n.id === notificationId ? { ...n, read } : n
    );
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount(notifications);
  }

  // ============================================
  // Update unread count
  // ============================================
  private updateUnreadCount(notifications: Notification[]): void {
    const unreadCount = notifications.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // ============================================
  // Clear all notifications
  // ============================================
  clearAll(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/notifications`
    ).pipe(
      tap(() => {
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
      }),
      catchError(error => {
        console.error('❌ Clear all notifications error:', error);
        throw error;
      })
    );
  }

  // ============================================
  // Save notification preferences
  // ============================================
  savePreferences(preferences: NotificationPreferences): Observable<{
    message: string;
    preferences: NotificationPreferences;
  }> {
    return this.updatePreferences(preferences);
  }

  // ============================================
  // Get notification icon by type
  // ============================================
  getNotificationIcon(type: Notification['type']): string {
    const icons: Record<string, string> = {
      case: 'folder',
      case_update: 'update',
      message: 'mail',
      attorney_message: 'mail',
      court: 'gavel',
      court_date: 'event',
      payment: 'payment',
      comment: 'chat',
      document: 'attach_file',
      system: 'info'
    };
    return icons[type] || 'notifications';
  }

  // ============================================
  // Get notification color by type
  // ============================================
  getNotificationColor(type: Notification['type']): string {
    const colors: Record<string, string> = {
      case: '#1976d2',
      case_update: '#1976d2',
      message: '#388e3c',
      attorney_message: '#388e3c',
      court: '#f57c00',
      court_date: '#f57c00',
      payment: '#7b1fa2',
      comment: '#0097a7',
      document: '#455a64',
      system: '#616161'
    };
    return colors[type] || '#616161';
  }

  // ============================================
  // Format timestamp to relative time
  // ============================================
  formatTimestamp(timestamp: Date | string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  // ============================================
  // Get current notifications value
  // ============================================
  get currentNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  // ============================================
  // Get current unread count value
  // ============================================
  get currentUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  // ============================================
  // Push a notification received via Socket.io
  // ============================================
  pushSocketNotification(notification: Notification): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);
    if (!notification.read) {
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    }
    this.newNotificationSubject.next(notification);
  }
}
