// ============================================
// Notification Service (COMPLETE - Matches Components)
// Location: frontend/src/app/core/services/notification.service.ts
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'case_update' | 'attorney_message' | 'comment' | 'document' | 'court_date' | 'system';
  read: boolean;
  timestamp: Date;  // Components use 'timestamp' not 'createdAt'
  link?: string;
  actionUrl?: string;  // Components expect this
  metadata?: {
    priority?: 'high' | 'medium' | 'low';
    caseId?: string;
    [key: string]: any;
  };
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  caseUpdates: boolean;
  attorneyMessages: boolean;
  courtDates: boolean;
  documents: boolean;
  comments: boolean;
  systemAlerts: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  // ============================================
  // API POLLING DISABLED FOR DEVELOPMENT
  // ============================================
  private pollingEnabled = false;
  private pollingInterval = 30000;

  constructor(private http: HttpClient) {
    this.loadMockNotifications();
  }

  // ============================================
  // Mock Data
  // ============================================
  
  private loadMockNotifications(): void {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Case Update',
        message: 'Your case #12345 has been assigned to an attorney',
        type: 'case_update',
        read: false,
        timestamp: new Date(),
        link: '/driver/tickets/12345',
        actionUrl: '/driver/tickets/12345',
        metadata: {
          priority: 'high',
          caseId: '12345'
        }
      },
      {
        id: '2',
        title: 'New Document',
        message: 'Attorney uploaded citation_response.pdf',
        type: 'document',
        read: false,
        timestamp: new Date(Date.now() - 3600000),
        link: '/driver/documents',
        actionUrl: '/driver/documents',
        metadata: {
          priority: 'medium'
        }
      },
      {
        id: '3',
        title: 'Court Date Scheduled',
        message: 'Your court hearing is scheduled for March 15, 2024',
        type: 'court_date',
        read: false,
        timestamp: new Date(Date.now() - 7200000),
        link: '/driver/tickets/12345',
        actionUrl: '/driver/tickets/12345',
        metadata: {
          priority: 'high',
          caseId: '12345'
        }
      },
      {
        id: '4',
        title: 'Attorney Message',
        message: 'John Smith sent you a message regarding your case',
        type: 'attorney_message',
        read: true,
        timestamp: new Date(Date.now() - 86400000),
        link: '/driver/tickets/12345',
        actionUrl: '/driver/tickets/12345'
      },
      {
        id: '5',
        title: 'Payment Reminder',
        message: 'Payment due in 3 days for case #12345',
        type: 'warning',
        read: true,
        timestamp: new Date(Date.now() - 172800000),
        link: '/driver/tickets/12345',
        actionUrl: '/driver/tickets/12345'
      }
    ];

    this.notificationsSubject.next(mockNotifications);
    this.updateUnreadCount();
  }

  // ============================================
  // Polling Methods
  // ============================================

  startPolling(): void {
    if (!this.pollingEnabled) {
      console.log('📭 Notification polling is DISABLED - Using mock data');
      return;
    }
  }

  stopPolling(): void {
    // No-op
  }

  // ============================================
  // API Methods
  // ============================================

  fetchNotifications(): Observable<Notification[]> {
    return of(this.notificationsSubject.value);
  }

  markAsRead(notificationId: string): Observable<void> {
    const notifications = this.notificationsSubject.value.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
    
    return of(void 0);
  }

  markAllAsRead(): Observable<void> {
    const notifications = this.notificationsSubject.value.map(n => ({
      ...n,
      read: true
    }));
    
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
    
    return of(void 0);
  }

  deleteNotification(notificationId: string): Observable<void> {
    const notifications = this.notificationsSubject.value.filter(
      n => n.id !== notificationId
    );
    
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
    
    return of(void 0);
  }

  clearAll(): void {
    this.notificationsSubject.next([]);
    this.updateUnreadCount();
  }

  // ============================================
  // Helper Methods
  // ============================================

  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  addNotification(notification: Notification): void {
    const notifications = [notification, ...this.notificationsSubject.value];
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
  }

  // ============================================
  // Icon & Color Methods (Required by Components)
  // ============================================

  getNotificationIcon(type: Notification['type']): string {
    const icons: Record<Notification['type'], string> = {
      info: 'info',
      warning: 'warning',
      success: 'check_circle',
      error: 'error',
      case_update: 'update',
      attorney_message: 'mail',
      comment: 'chat',
      document: 'attach_file',
      court_date: 'event',
      system: 'settings'
    };
    return icons[type] || 'notifications';
  }

  getNotificationColor(type: Notification['type']): string {
    const colors: Record<Notification['type'], string> = {
      info: 'primary',
      warning: 'warn',
      success: 'accent',
      error: 'warn',
      case_update: 'primary',
      attorney_message: 'primary',
      comment: 'primary',
      document: 'accent',
      court_date: 'warn',
      system: 'primary'
    };
    return colors[type] || 'primary';
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return new Date(timestamp).toLocaleDateString();
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  }

  // ============================================
  // Preferences Methods
  // ============================================

  getPreferences(): NotificationPreferences {
    const stored = localStorage.getItem('notificationPreferences');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing preferences:', e);
      }
    }
    
    // Default preferences
    return {
      email: true,
      push: true,
      sms: false,
      caseUpdates: true,
      attorneyMessages: true,
      courtDates: true,
      documents: true,
      comments: true,
      systemAlerts: true
    };
  }

  savePreferences(preferences: NotificationPreferences): void {
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
  }
}
