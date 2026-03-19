import {
  Component, OnInit, OnDestroy, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { UserPreferencesService } from '../../../../core/services/user-preferences.service';
import { AuthService } from '../../../../core/services/auth.service';

// ── Toggle item definitions ──
interface ToggleItem {
  key: string;
  label: string;
  desc: string;
  emoji: string;
  iconBg: string;
  badge?: string;
  badgeClass?: string;
}

const EMAIL_ITEMS: ToggleItem[] = [
  { key: 'case_status', label: 'Case Status Updates', desc: 'Receive an email whenever your case status changes — attorney assigned, hearing scheduled, charges dismissed.', emoji: '⚖️', iconBg: 'var(--blue-bg)', badge: 'Urgent', badgeClass: 'badge-urgent' },
  { key: 'attorney_messages', label: 'Attorney Messages', desc: 'Get notified when your attorney sends a new message requiring your response.', emoji: '💬', iconBg: 'var(--teal-bg2)', badge: 'Recommended', badgeClass: 'badge-recommended' },
  { key: 'payment', label: 'Payment Confirmations', desc: 'Receipts and confirmations for all payments and payment plan installments.', emoji: '💳', iconBg: 'var(--green-bg)' },
  { key: 'court_dates', label: 'Court Date Reminders', desc: 'Reminders sent 7 days and 24 hours before each hearing date.', emoji: '📅', iconBg: 'var(--amber-bg)', badge: 'Urgent', badgeClass: 'badge-urgent' },
  { key: 'documents', label: 'Document Requests', desc: 'Alerts when your attorney requests additional documents or evidence from you.', emoji: '📄', iconBg: 'var(--purple-bg)' },
  { key: 'marketing', label: 'Marketing & News', desc: 'CDL law tips, platform updates, and relevant trucking industry news.', emoji: '📧', iconBg: 'var(--border-light)' },
];

const SMS_ITEMS: ToggleItem[] = [
  { key: 'case_status', label: 'Case Status Updates via SMS', desc: 'Receive text messages when your case status changes. Ideal when away from email.', emoji: '⚖️', iconBg: 'var(--blue-bg)', badge: 'Urgent', badgeClass: 'badge-urgent' },
  { key: 'court_dates', label: 'Court Date Reminders via SMS', desc: 'SMS reminders 24 hours before your hearing. Never miss an important date.', emoji: '📅', iconBg: 'var(--amber-bg)' },
];

const PUSH_ITEMS: ToggleItem[] = [
  { key: 'case_updates', label: 'Case Updates', desc: 'Instant browser notifications when your case status changes.', emoji: '⚖️', iconBg: 'var(--blue-bg)', badge: 'Recommended', badgeClass: 'badge-recommended' },
  { key: 'messages', label: 'New Messages', desc: 'Instant push alerts when your attorney sends a message.', emoji: '💬', iconBg: 'var(--teal-bg2)', badge: 'New', badgeClass: 'badge-new' },
  { key: 'payment', label: 'Payment Alerts', desc: 'Confirmation when payments succeed or a plan installment is due.', emoji: '💳', iconBg: 'var(--green-bg)' },
];

const DEFAULT_EMAIL: Record<string, boolean> = {
  case_status: true, attorney_messages: true, payment: true,
  court_dates: true, documents: true, marketing: false,
};

const DEFAULT_SMS: Record<string, boolean> = {
  case_status: false, court_dates: false,
};

const DEFAULT_PUSH: Record<string, boolean> = {
  case_updates: true, messages: true, payment: false,
};

const ALL_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

@Component({
  selector: 'app-notification-preferences',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-preferences.component.html',
  styleUrl: './notification-preferences.component.scss',
})
export class NotificationPreferencesComponent implements OnInit, OnDestroy {
  private preferencesService = inject(UserPreferencesService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Item lists (exposed to template) ──
  readonly emailItems = EMAIL_ITEMS;
  readonly smsItems = SMS_ITEMS;
  readonly pushItems = PUSH_ITEMS;
  readonly allDays = ALL_DAYS;

  // ── Toggle state signals ──
  emailToggles = signal<Record<string, boolean>>({ ...DEFAULT_EMAIL });
  smsToggles = signal<Record<string, boolean>>({ ...DEFAULT_SMS });
  pushToggles = signal<Record<string, boolean>>({ ...DEFAULT_PUSH });

  // ── Master toggles ──
  emailMasterOn = signal(true);
  smsMasterOn = signal(false);

  // ── Quiet hours ──
  quietHoursEnabled = signal(true);
  quietFrom = signal('22:00');
  quietUntil = signal('07:00');
  quietDays = signal<Set<string>>(new Set(ALL_DAYS));

  // ── Push permission ──
  pushPermission = signal<string>('default');

  // ── User info (loaded from auth) ──
  userEmail = signal('');
  userPhone = signal('');
  phoneVerified = signal(false);

  // ── UI state ──
  saving = signal(false);
  saveFlash = signal(false);
  saveError = signal(false);

  // ── Saved state for dirty tracking ──
  private initialState = '';

  // ── Computed counts for sidebar ──
  emailEnabledCount = computed(() => {
    if (!this.emailMasterOn()) return 0;
    const toggles = this.emailToggles();
    return Object.values(toggles).filter(Boolean).length;
  });

  smsEnabledCount = computed(() => {
    if (!this.smsMasterOn()) return 0;
    const toggles = this.smsToggles();
    return Object.values(toggles).filter(Boolean).length;
  });

  pushEnabledCount = computed(() => {
    const toggles = this.pushToggles();
    return Object.values(toggles).filter(Boolean).length;
  });

  // ── Display helpers for quiet hours ──
  quietFromDisplay = computed(() => this.formatTime(this.quietFrom()));
  quietUntilDisplay = computed(() => this.formatTime(this.quietUntil()));

  ngOnInit(): void {
    this.checkPushPermission();
    this.loadUserInfo();
    this.initialState = this.serializeState();
  }

  ngOnDestroy(): void {
    if (this.flashTimer) {
      clearTimeout(this.flashTimer);
      this.flashTimer = null;
    }
  }

  private loadUserInfo(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userEmail.set(user.email || '');
      this.userPhone.set(user.phone || '');
      this.phoneVerified.set(!!user.phone);
    }
  }

  // ── Email toggles ──
  getEmailToggle(key: string): boolean {
    return this.emailToggles()[key] ?? false;
  }

  toggleEmail(key: string): void {
    if (!this.emailMasterOn()) return;
    const current = this.emailToggles();
    this.emailToggles.set({ ...current, [key]: !current[key] });
  }

  toggleEmailMaster(): void {
    const newVal = !this.emailMasterOn();
    this.emailMasterOn.set(newVal);
    if (!newVal) {
      this.emailToggles.set(Object.fromEntries(
        Object.keys(this.emailToggles()).map(k => [k, false])
      ));
    } else {
      this.emailToggles.set({ ...DEFAULT_EMAIL });
    }
  }

  // ── SMS toggles ──
  getSmsToggle(key: string): boolean {
    return this.smsToggles()[key] ?? false;
  }

  toggleSms(key: string): void {
    if (!this.smsMasterOn()) return;
    const current = this.smsToggles();
    this.smsToggles.set({ ...current, [key]: !current[key] });
  }

  toggleSmsMaster(): void {
    const newVal = !this.smsMasterOn();
    this.smsMasterOn.set(newVal);
    if (!newVal) {
      this.smsToggles.set(Object.fromEntries(
        Object.keys(this.smsToggles()).map(k => [k, false])
      ));
    } else {
      this.smsToggles.set({ ...DEFAULT_SMS, case_status: true, court_dates: true });
    }
  }

  // ── Push toggles ──
  getPushToggle(key: string): boolean {
    return this.pushToggles()[key] ?? false;
  }

  togglePush(key: string): void {
    const current = this.pushToggles();
    this.pushToggles.set({ ...current, [key]: !current[key] });
  }

  // ── Quiet hours ──
  isDayActive(day: string): boolean {
    return this.quietDays().has(day);
  }

  toggleDay(day: string): void {
    if (!this.quietHoursEnabled()) return;
    const current = this.quietDays();
    const next = new Set(current);
    if (next.has(day)) {
      next.delete(day);
    } else {
      next.add(day);
    }
    this.quietDays.set(next);
  }

  // ── Push permission ──
  checkPushPermission(): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.pushPermission.set('not-supported');
      return;
    }
    this.pushPermission.set(Notification.permission);
  }

  requestPushPermission(): Promise<void> {
    if (!('Notification' in window)) return Promise.resolve();
    return Notification.requestPermission().then(permission => {
      this.pushPermission.set(permission);
      if (permission === 'granted') {
        const token = `web_${Date.now()}`;
        this.preferencesService.savePushToken(token).subscribe();
      }
    }).catch(() => {
      this.pushPermission.set('denied');
    });
  }

  // ── Actions ──
  verifyPhone(): void {
    this.router.navigate(['/driver/profile']);
  }

  savePreferences(): void {
    this.saving.set(true);
    this.saveError.set(false);
    const smsValue = this.smsMasterOn() && (this.smsToggles()['case_status'] || this.smsToggles()['court_dates']);
    this.preferencesService.updateSmsOptIn(smsValue).subscribe({
      next: () => {
        this.saving.set(false);
        this.saveFlash.set(true);
        this.initialState = this.serializeState();
        this.flashTimer = setTimeout(() => this.saveFlash.set(false), 2200);
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set(true);
      },
    });
  }

  resetToDefaults(): void {
    this.emailMasterOn.set(true);
    this.emailToggles.set({ ...DEFAULT_EMAIL });
    this.smsMasterOn.set(false);
    this.smsToggles.set({ ...DEFAULT_SMS });
    this.pushToggles.set({ ...DEFAULT_PUSH });
    this.quietHoursEnabled.set(true);
    this.quietFrom.set('22:00');
    this.quietUntil.set('07:00');
    this.quietDays.set(new Set(ALL_DAYS));
  }

  // ── Helpers ──
  private formatTime(time24: string): string {
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}${m === 0 ? '' : ':' + String(m).padStart(2, '0')} ${ampm}`;
  }

  private serializeState(): string {
    return JSON.stringify({
      emailMaster: this.emailMasterOn(),
      email: this.emailToggles(),
      smsMaster: this.smsMasterOn(),
      sms: this.smsToggles(),
      push: this.pushToggles(),
      quietEnabled: this.quietHoursEnabled(),
      quietFrom: this.quietFrom(),
      quietUntil: this.quietUntil(),
      quietDays: [...this.quietDays()],
    });
  }
}
