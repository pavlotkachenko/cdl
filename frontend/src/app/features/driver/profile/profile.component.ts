import {
  Component, OnInit, OnDestroy, signal, computed, inject, ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationPreferencesService } from '../../../core/services/notification-preferences.service';

interface DriverStats {
  totalCases: number;
  successRate: number;
  avgDays: number | null;
}

interface NotificationToggle {
  key: string;
  emoji: string;
  title: string;
  description: string;
  enabled: boolean;
}

interface SectionLink {
  id: string;
  emoji: string;
  label: string;
}

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private notifService = inject(NotificationPreferencesService);
  private destroyRef = inject(DestroyRef);

  // ── State signals ──
  currentUser = signal<any>(null);
  editingProfile = signal(false);
  editingPassword = signal(false);
  savingProfile = signal(false);
  savingPassword = signal(false);
  uploadingAvatar = signal(false);
  showPasswordForm = signal(false);
  showDeleteModal = signal(false);
  deleteConfirmText = signal('');
  activeSection = signal('profile-information');
  loadingStats = signal(true);
  loadingPrefs = signal(true);

  driverStats = signal<DriverStats>({ totalCases: 0, successRate: 0, avgDays: null });
  notificationToggles = signal<NotificationToggle[]>([
    { key: 'case_updates', emoji: '📋', title: 'Case Updates', description: 'Get notified when your case status changes', enabled: true },
    { key: 'attorney_messages', emoji: '💬', title: 'Attorney Messages', description: 'Receive alerts for new messages from your attorney', enabled: true },
    { key: 'payment_billing', emoji: '💳', title: 'Payment & Billing', description: 'Notifications about payments, invoices, and billing', enabled: true },
    { key: 'court_reminders', emoji: '⚖️', title: 'Court Reminders', description: 'Reminders about upcoming court dates and deadlines', enabled: true },
    { key: 'marketing_tips', emoji: '📢', title: 'Marketing & Tips', description: 'Occasional tips, offers, and product updates', enabled: false },
  ]);

  passwordVisibility = signal<Record<string, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // ── Toast ──
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Computed signals ──
  fullName = computed(() => this.currentUser()?.name || 'Driver');
  avatarUrl = computed(() => this.currentUser()?.avatar_url || '');
  initials = computed(() => {
    const name = this.currentUser()?.name || '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts.length === 1 ? parts[0][0].toUpperCase() : 'D';
  });
  memberSince = computed(() => {
    const u = this.currentUser();
    const date = u?.created_at ?? u?.createdAt;
    if (!date) return 'Recently joined';
    return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });
  emailVerified = computed(() => this.currentUser()?.email_verified ?? false);

  bioCharCount = computed(() => {
    const val = this.profileForm?.get('bio')?.value || '';
    return val.length;
  });

  // ── Section navigation ──
  sectionLinks: SectionLink[] = [
    { id: 'profile-information', emoji: '👤', label: 'Profile Information' },
    { id: 'password-security', emoji: '🔒', label: 'Password & Security' },
    { id: 'notifications', emoji: '🔔', label: 'Notifications' },
    { id: 'linked-accounts', emoji: '🔗', label: 'Linked Accounts' },
    { id: 'danger-zone', emoji: '⚠️', label: 'Danger Zone' },
  ];

  // ── Forms ──
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      phone: [''],
      state: [''],
      cdlNumber: [''],
      bio: ['', Validators.maxLength(500)],
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });

    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
      this.currentUser.set(user);
      if (user) this.patchFormFromUser(user);
    });

    this.loadDriverStats();
    this.loadNotificationPrefs();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  private passwordMatchValidator(group: FormGroup) {
    const n = group.get('newPassword')?.value;
    const c = group.get('confirmPassword')?.value;
    return n === c ? null : { passwordMismatch: true };
  }

  // ── Data loading ──
  loadDriverStats(): void {
    this.loadingStats.set(true);
    this.http.get<any>('/api/drivers/me/analytics').subscribe({
      next: (data) => {
        this.driverStats.set({
          totalCases: data.totalCases ?? 0,
          successRate: data.successRate ?? 0,
          avgDays: data.avgDays ?? null,
        });
        this.loadingStats.set(false);
      },
      error: () => {
        this.loadingStats.set(false);
      },
    });
  }

  loadNotificationPrefs(): void {
    this.loadingPrefs.set(true);
    this.notifService.getPreferences().subscribe({
      next: (res) => {
        if (res.preferences) {
          this.notificationToggles.update(toggles =>
            toggles.map(t => ({
              ...t,
              enabled: res.preferences[t.key] ?? t.enabled,
            }))
          );
        }
        this.loadingPrefs.set(false);
      },
      error: () => {
        this.loadingPrefs.set(false);
      },
    });
  }

  // ── Avatar ──
  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.showToast('Image must be under 5 MB.', 'error');
      input.value = '';
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.showToast('Only JPG, PNG, GIF, or WebP images are allowed.', 'error');
      input.value = '';
      return;
    }

    this.uploadingAvatar.set(true);
    this.authService.uploadAvatar(file).subscribe({
      next: () => {
        this.uploadingAvatar.set(false);
        this.showToast('Profile photo updated.', 'success');
      },
      error: () => {
        this.uploadingAvatar.set(false);
        this.showToast('Failed to upload photo.', 'error');
      },
    });
    input.value = '';
  }

  // ── Profile edit ──
  toggleEditProfile(): void {
    const editing = !this.editingProfile();
    this.editingProfile.set(editing);
    if (!editing) this.resetProfileForm();
  }

  private resetProfileForm(): void {
    const u = this.currentUser();
    if (u) this.patchFormFromUser(u);
  }

  private patchFormFromUser(user: any): void {
    const nameParts = (user.name ?? '').split(' ');
    this.profileForm.patchValue({
      firstName: nameParts[0] ?? '',
      lastName: nameParts.slice(1).join(' '),
      email: user.email ?? '',
      phone: user.phone ?? '',
      state: user.cdl_state ?? '',
      cdlNumber: user.cdl_number ?? '',
      bio: user.bio ?? '',
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.showToast('Please fill in all required fields.', 'error');
      return;
    }
    const { firstName, lastName, phone, state, cdlNumber, bio } = this.profileForm.getRawValue();
    this.savingProfile.set(true);
    this.authService.updateProfile({
      name: `${firstName} ${lastName}`.trim(),
      phone,
      bio,
      cdl_number: cdlNumber,
      cdl_state: state,
    }).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.editingProfile.set(false);
        this.showToast('Profile updated successfully.', 'success');
      },
      error: () => {
        this.savingProfile.set(false);
        this.showToast('Failed to update profile.', 'error');
      },
    });
  }

  // ── Password ──
  togglePasswordForm(): void {
    this.showPasswordForm.update(v => !v);
    if (!this.showPasswordForm()) this.passwordForm.reset();
  }

  togglePasswordVisibility(field: string): void {
    this.passwordVisibility.update(v => ({ ...v, [field]: !v[field] }));
  }

  savePassword(): void {
    if (this.passwordForm.invalid) {
      const msg = this.passwordForm.hasError('passwordMismatch')
        ? 'Passwords do not match.'
        : 'Please fill in all fields correctly.';
      this.showToast(msg, 'error');
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.savingPassword.set(true);
    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.showPasswordForm.set(false);
        this.passwordForm.reset();
        this.showToast('Password changed successfully.', 'success');
      },
      error: () => {
        this.savingPassword.set(false);
        this.showToast('Failed to change password.', 'error');
      },
    });
  }

  // ── Notification toggles ──
  toggleNotification(index: number): void {
    const toggles = this.notificationToggles();
    const toggle = toggles[index];
    const newVal = !toggle.enabled;

    // Optimistic update
    this.notificationToggles.update(list =>
      list.map((t, i) => i === index ? { ...t, enabled: newVal } : t)
    );

    this.notifService.updatePreference(toggle.key, 'email', newVal).subscribe({
      error: () => {
        // Revert on failure
        this.notificationToggles.update(list =>
          list.map((t, i) => i === index ? { ...t, enabled: !newVal } : t)
        );
        this.showToast('Failed to update preference.', 'error');
      },
    });
  }

  onToggleKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleNotification(index);
    }
  }

  // ── Navigation ──
  scrollToSection(sectionId: string): void {
    this.activeSection.set(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }

  goToDashboard(): void {
    this.router.navigate(['/driver/dashboard']);
  }

  // ── Linked accounts ──
  connectGoogle(): void {
    this.authService.signInWithGoogle().subscribe();
  }

  connectFacebook(): void {
    this.authService.signInWithFacebook().subscribe();
  }

  // ── Delete account ──
  private deleteModalTrigger: HTMLElement | null = null;

  openDeleteModal(): void {
    this.deleteModalTrigger = document.activeElement as HTMLElement;
    this.showDeleteModal.set(true);
    this.deleteConfirmText.set('');
    setTimeout(() => {
      document.getElementById('deleteConfirm')?.focus();
    });
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deleteConfirmText.set('');
    this.deleteModalTrigger?.focus();
    this.deleteModalTrigger = null;
  }

  confirmDelete(): void {
    this.showDeleteModal.set(false);
    this.deleteConfirmText.set('');
    this.deleteModalTrigger?.focus();
    this.deleteModalTrigger = null;
    this.showToast('Account deletion request submitted. Our team will process this within 48 hours.', 'success');
  }

  onDeleteInput(event: Event): void {
    this.deleteConfirmText.set((event.target as HTMLInputElement).value);
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
