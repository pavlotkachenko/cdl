import {
  Component, OnInit, OnDestroy, signal, computed, inject, ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

import { NotificationService, Notification } from '../../../core/services/notification.service';

type NotifFilter = 'all' | 'unread' | 'read' | 'action_needed';

interface DateGroup {
  label: string;
  date: string;
  notifications: Notification[];
}

interface SummaryCard {
  key: NotifFilter;
  emoji: string;
  label: string;
  color: string;
  bgColor: string;
}

// ── Type → visual mappings ──
const BAR_COLORS: Record<string, string> = {
  case_update: 'blue', case: 'blue',
  message: 'teal', attorney_message: 'teal',
  payment: 'green',
  court: 'amber', court_date: 'amber', court_reminder: 'amber',
  system: 'purple', document: 'purple', comment: 'purple',
};

const TYPE_CHIPS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  case_update: { label: 'Case Update', color: 'var(--blue)', bg: 'var(--blue-bg)', border: 'var(--blue-border)' },
  case: { label: 'Case Update', color: 'var(--blue)', bg: 'var(--blue-bg)', border: 'var(--blue-border)' },
  message: { label: 'Message', color: 'var(--teal)', bg: 'var(--teal-bg2)', border: 'var(--teal-border)' },
  attorney_message: { label: 'Message', color: 'var(--teal)', bg: 'var(--teal-bg2)', border: 'var(--teal-border)' },
  payment: { label: 'Payment', color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)' },
  court: { label: 'Action Needed', color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)' },
  court_date: { label: 'Action Needed', color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)' },
  court_reminder: { label: 'Action Needed', color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)' },
  system: { label: 'System', color: 'var(--purple)', bg: 'var(--purple-bg)', border: 'var(--purple-border)' },
  document: { label: 'Document', color: 'var(--purple)', bg: 'var(--purple-bg)', border: 'var(--purple-border)' },
  comment: { label: 'Comment', color: 'var(--teal)', bg: 'var(--teal-bg2)', border: 'var(--teal-border)' },
};

const TYPE_EMOJIS: Record<string, string> = {
  case_update: '⚖️', case: '⚖️',
  message: '💬', attorney_message: '💬',
  payment: '💳',
  court: '📅', court_date: '📅', court_reminder: '📅',
  system: '🔧', document: '📄', comment: '💬',
};

const TYPE_ICON_BG: Record<string, string> = {
  case_update: 'var(--blue-bg)', case: 'var(--blue-bg)',
  message: 'var(--teal-bg2)', attorney_message: 'var(--teal-bg2)',
  payment: 'var(--green-bg)',
  court: 'var(--amber-bg)', court_date: 'var(--amber-bg)', court_reminder: 'var(--amber-bg)',
  system: 'var(--purple-bg)', document: 'var(--purple-bg)', comment: 'var(--teal-bg2)',
};

const CTA_LABELS: Record<string, string> = {
  case_update: 'View Case', case: 'View Case',
  message: 'Reply to Message', attorney_message: 'Reply to Message',
  payment: 'View Receipt',
  court: 'View Case', court_date: 'View Case', court_reminder: 'View Case',
  system: 'View Details', document: 'View Document', comment: 'View Comment',
};

@Component({
  selector: 'app-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // ── State signals ──
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  loading = signal(true);
  selectedFilter = signal<NotifFilter>('all');
  selectedItems = signal<Set<string>>(new Set());

  // ── Toast ──
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Summary cards config ──
  readonly summaryCards: SummaryCard[] = [
    { key: 'all', emoji: '🔔', label: 'All', color: 'var(--text-primary)', bgColor: 'var(--border-light)' },
    { key: 'unread', emoji: '🔴', label: 'Unread', color: 'var(--red)', bgColor: 'var(--red-bg)' },
    { key: 'read', emoji: '✅', label: 'Read', color: 'var(--green)', bgColor: 'var(--green-bg)' },
    { key: 'action_needed', emoji: '⏰', label: 'Action Needed', color: 'var(--amber)', bgColor: 'var(--amber-bg)' },
  ];

  // ── Computed signals ──
  totalCount = computed(() => this.notifications().length);
  readCount = computed(() => this.notifications().filter(n => n.read).length);
  actionNeededCount = computed(() =>
    this.notifications().filter(n => this.isActionNeeded(n)).length
  );

  filteredNotifications = computed(() => {
    const list = this.notifications();
    const filter = this.selectedFilter();
    switch (filter) {
      case 'unread': return list.filter(n => !n.read);
      case 'read': return list.filter(n => n.read);
      case 'action_needed': return list.filter(n => this.isActionNeeded(n));
      default: return list;
    }
  });

  private isActionNeeded(n: Notification): boolean {
    return n.metadata?.priority === 'high' || n.type === 'court' || n.type === 'court_date' || n.type === 'court_reminder';
  }

  groupedNotifications = computed<DateGroup[]>(() => {
    const list = this.filteredNotifications();
    if (list.length === 0) return [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay() + (todayStart.getDay() === 0 ? -6 : 1));

    const groups: Record<string, Notification[]> = {
      today: [], yesterday: [], earlier: [], older: [],
    };

    for (const n of list) {
      const d = new Date(n.createdAt);
      if (d >= todayStart) groups['today'].push(n);
      else if (d >= yesterdayStart) groups['yesterday'].push(n);
      else if (d >= weekStart) groups['earlier'].push(n);
      else groups['older'].push(n);
    }

    const todayStr = todayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const yesterdayStr = yesterdayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const result: DateGroup[] = [];
    if (groups['today'].length) result.push({ label: 'Today', date: todayStr, notifications: groups['today'] });
    if (groups['yesterday'].length) result.push({ label: 'Yesterday', date: yesterdayStr, notifications: groups['yesterday'] });
    if (groups['earlier'].length) result.push({ label: 'Earlier this week', date: '', notifications: groups['earlier'] });
    if (groups['older'].length) result.push({ label: 'Older', date: '', notifications: groups['older'] });
    return result;
  });

  // Case grouping: collapse notifications with same related_case_id
  caseGroups = computed(() => {
    const groups = new Map<string, Notification[]>();
    for (const n of this.filteredNotifications()) {
      const caseId = this.getCaseId(n);
      if (caseId) {
        const existing = groups.get(caseId) || [];
        existing.push(n);
        groups.set(caseId, existing);
      }
    }
    return groups;
  });

  expandedCaseGroups = signal<Set<string>>(new Set());

  private getCaseId(n: Notification): string {
    return n.data?.case_id || n.data?.related_case_id || '';
  }

  isGroupedNotification(n: Notification): boolean {
    const caseId = this.getCaseId(n);
    if (!caseId) return false;
    const group = this.caseGroups().get(caseId);
    return !!group && group.length > 1;
  }

  getCaseGroupCount(n: Notification): number {
    return this.caseGroups().get(this.getCaseId(n))?.length || 0;
  }

  isCaseGroupExpanded(n: Notification): boolean {
    return this.expandedCaseGroups().has(this.getCaseId(n));
  }

  toggleCaseGroup(n: Notification): void {
    const caseId = this.getCaseId(n);
    if (!caseId) return;
    this.expandedCaseGroups.update(set => {
      const newSet = new Set(set);
      if (newSet.has(caseId)) newSet.delete(caseId);
      else newSet.add(caseId);
      return newSet;
    });
  }

  // ── Summary count helpers ──
  getCardCount(key: NotifFilter): number {
    switch (key) {
      case 'all': return this.totalCount();
      case 'unread': return this.unreadCount();
      case 'read': return this.readCount();
      case 'action_needed': return this.actionNeededCount();
      default: return 0;
    }
  }

  // ── Type → visual helpers ──
  getBarColor(n: Notification): string {
    if (n.read) return 'none';
    return BAR_COLORS[n.type] || 'teal';
  }

  getTypeChip(type: string): { label: string; color: string; bg: string; border: string } {
    return TYPE_CHIPS[type] || { label: 'Notification', color: 'var(--text-muted)', bg: 'var(--border-light)', border: 'var(--border)' };
  }

  getEmoji(type: string): string {
    return TYPE_EMOJIS[type] || '🔔';
  }

  getIconBg(type: string): string {
    return TYPE_ICON_BG[type] || 'var(--border-light)';
  }

  getCtaLabel(type: string): string {
    return CTA_LABELS[type] || 'View Details';
  }

  // ── Lifecycle ──
  ngOnInit(): void {
    this.notificationService.notifications$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(n => this.notifications.set(n));

    this.notificationService.unreadCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(c => this.unreadCount.set(c));

    this.loading.set(true);
    this.notificationService.getNotifications().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });

    // WebSocket: connect for real-time updates
    try {
      const token = localStorage.getItem('token');
      if (token) {
        this.notificationService.connectWebSocket(token);
      }
    } catch {
      // WebSocket optional — silent fail
    }

    // Listen for new real-time notifications
    this.notificationService.newNotification$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(n => {
        this.showToast(`New: ${n.title}`, 'success');
      });
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    try {
      this.notificationService.disconnectWebSocket();
    } catch {
      // silent
    }
  }

  // ── Filter actions ──
  setFilter(filter: NotifFilter): void {
    this.selectedFilter.set(filter);
    this.selectedItems.set(new Set());
  }

  // ── Notification actions ──
  onNotificationClick(n: Notification): void {
    if (!n.read) {
      this.notificationService.markAsRead(n.id).subscribe();
    }
    if (n.actionUrl) {
      this.router.navigate([n.actionUrl]);
    }
  }

  markAsRead(n: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(n.id).subscribe();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.showToast('All notifications marked as read.', 'success'),
      error: () => this.showToast('Failed to mark all as read.', 'error'),
    });
  }

  deleteNotification(n: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(n.id).subscribe({
      next: () => this.showToast('Notification deleted.', 'success'),
      error: () => this.showToast('Failed to delete notification.', 'error'),
    });
  }

  clearAll(): void {
    if (this.notifications().length === 0) return;
    this.notificationService.clearAll().subscribe({
      next: () => this.showToast('All notifications cleared.', 'success'),
      error: () => this.showToast('Failed to clear notifications.', 'error'),
    });
  }

  // ── Batch selection ──
  toggleSelection(id: string): void {
    this.selectedItems.update(set => {
      const newSet = new Set(set);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }

  toggleSelectAll(): void {
    const filtered = this.filteredNotifications();
    const currentSelection = this.selectedItems();
    if (currentSelection.size === filtered.length) {
      this.selectedItems.set(new Set());
    } else {
      this.selectedItems.set(new Set(filtered.map(n => n.id)));
    }
  }

  isSelected(id: string): boolean {
    return this.selectedItems().has(id);
  }

  bulkMarkRead(): void {
    const ids = Array.from(this.selectedItems());
    for (const id of ids) {
      this.notificationService.markAsRead(id).subscribe();
    }
    this.selectedItems.set(new Set());
    this.showToast(`${ids.length} notifications marked as read.`, 'success');
  }

  bulkDelete(): void {
    const ids = Array.from(this.selectedItems());
    for (const id of ids) {
      this.notificationService.deleteNotification(id).subscribe();
    }
    this.selectedItems.set(new Set());
    this.showToast(`${ids.length} notifications deleted.`, 'success');
  }

  onCheckboxKeydown(event: KeyboardEvent, id: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleSelection(id);
    }
  }

  // ── Navigation ──
  goToSettings(): void {
    this.router.navigate(['/driver/settings/notifications']);
  }

  // ── Relative time formatting ──
  formatTime(timestamp: string): string {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ── Empty state ──
  getEmptyTitle(): string {
    switch (this.selectedFilter()) {
      case 'unread': return 'No unread notifications';
      case 'read': return 'No read notifications';
      case 'action_needed': return 'No action needed';
      default: return 'All caught up!';
    }
  }

  getEmptySubtitle(): string {
    switch (this.selectedFilter()) {
      case 'unread': return 'You\'ve read all your notifications. Great job staying on top of things!';
      case 'read': return 'Notifications you\'ve read will appear here.';
      case 'action_needed': return 'No notifications require your immediate attention right now.';
      default: return 'You don\'t have any notifications yet. We\'ll let you know when something happens.';
    }
  }

  // ── Toast ──
  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastTimer = setTimeout(() => this.toastMessage.set(''), 3000);
  }

  dismissToast(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage.set('');
  }
}
