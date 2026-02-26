// ============================================
// Notification Center Component - Full Page View
// Location: frontend/src/app/features/driver/notifications/notifications.component.ts
// ============================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';

// Services
import { NotificationService, Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTabsModule
  ]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  allNotifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  
  loading = false;
  selectedFilter: 'all' | 'unread' | 'read' = 'all';
  selectedType: Notification['type'] | 'all' = 'all';
  
  unreadCount = 0;

  notificationTypes: Array<{value: Notification['type'] | 'all', label: string, icon: string}> = [
    { value: 'all', label: 'All', icon: 'select_all' },
    { value: 'case_update', label: 'Case Updates', icon: 'update' },
    { value: 'attorney_message', label: 'Attorney Messages', icon: 'mail' },
    { value: 'comment', label: 'Comments', icon: 'chat' },
    { value: 'document', label: 'Documents', icon: 'attach_file' },
    { value: 'court_date', label: 'Court Dates', icon: 'event' },
    { value: 'system', label: 'System', icon: 'info' }
  ];

  constructor(
    public notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    
    // Subscribe to unread count
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadNotifications(): void {
    this.loading = true;

    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.allNotifications = notifications;
        this.applyFilters();
        this.loading = false;
      });
  }

  private applyFilters(): void {
    let filtered = [...this.allNotifications];

    // Filter by read/unread status
    if (this.selectedFilter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (this.selectedFilter === 'read') {
      filtered = filtered.filter(n => n.read);
    }

    // Filter by type
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(n => n.type === this.selectedType);
    }

    this.filteredNotifications = filtered;
  }

  setFilter(filter: 'all' | 'unread' | 'read'): void {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  setTypeFilter(type: Notification['type'] | 'all'): void {
    this.selectedType = type;
    this.applyFilters();
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
  }

  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(notification.id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    
    if (confirm('Delete this notification?')) {
      this.notificationService.deleteNotification(notification.id);
    }
  }

  clearAll(): void {
    if (confirm('Clear all notifications? This cannot be undone.')) {
      this.notificationService.clearAll().subscribe();
    }
  }

  goToSettings(): void {
    this.router.navigate(['/driver/settings/notifications']);
  }

  refresh(): void {
    this.loadNotifications();
  }

  getIcon(type: Notification['type']): string {
    return this.notificationService.getNotificationIcon(type);
  }

  getColor(type: Notification['type']): string {
    return this.notificationService.getNotificationColor(type);
  }

  formatTime(timestamp: Date | string): string {
    return this.notificationService.formatTimestamp(timestamp);
  }

  formatFullDate(timestamp: Date | string): string {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  groupNotificationsByDate(): Map<string, Notification[]> {
    const groups = new Map<string, Notification[]>();
    
    this.filteredNotifications.forEach(notification => {
      const date = new Date(notification.timestamp || notification.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey: string;
      
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(notification);
    });

    return groups;
  }
}
