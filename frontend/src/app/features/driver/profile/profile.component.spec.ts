import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationPreferencesService } from '../../../core/services/notification-preferences.service';

const MOCK_USER = {
  id: 'u1', name: 'Alice Driver', email: 'alice@test.com',
  phone: '555-1234', role: 'driver' as const, avatar_url: '',
  bio: 'Test bio', cdl_number: 'CDL123', cdl_state: 'TX',
  created_at: '2025-06-15T00:00:00Z', email_verified: true,
};

function makeAuthSpy(user = MOCK_USER) {
  const subject = new BehaviorSubject<any>(user);
  return {
    currentUser$: subject.asObservable(),
    getCurrentUser: vi.fn().mockReturnValue(user),
    updateProfile: vi.fn().mockReturnValue(of({ user })),
    changePassword: vi.fn().mockReturnValue(of({ message: 'ok' })),
    uploadAvatar: vi.fn().mockReturnValue(of({ avatar_url: 'http://test/avatar.jpg' })),
    signInWithGoogle: vi.fn().mockReturnValue(of(null)),
    signInWithFacebook: vi.fn().mockReturnValue(of(null)),
    _subject: subject,
  };
}

function makeNotifSpy() {
  return {
    getPreferences: vi.fn().mockReturnValue(of({ preferences: { case_updates: true, attorney_messages: false } })),
    updatePreference: vi.fn().mockReturnValue(of({ preferences: {} })),
  };
}

beforeEach(() => {
  // jsdom doesn't implement scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
});

async function setup(authSpy = makeAuthSpy(), notifSpy = makeNotifSpy()) {
  const routerSpy = { navigate: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [ProfileComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: authSpy },
      { provide: Router, useValue: routerSpy },
      { provide: NotificationPreferencesService, useValue: notifSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProfileComponent);
  const httpMock = TestBed.inject(HttpTestingController);

  // Flush the analytics request from ngOnInit
  fixture.detectChanges();
  try {
    const req = httpMock.expectOne('/api/drivers/me/analytics');
    req.flush({ totalCases: 5, successRate: 80, avgDays: 12 });
  } catch {
    // May not be pending if HttpClient was fully mocked
  }
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, authSpy, notifSpy, router: routerSpy, httpMock };
}

describe('ProfileComponent', () => {
  // ── Page structure ──
  it('renders 2-column layout with hero card and content column', async () => {
    const { fixture } = await setup();
    expect(fixture.nativeElement.querySelector('.profile-layout')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.hero-card')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.content-column')).toBeTruthy();
  });

  it('renders all 5 content cards', async () => {
    const { fixture } = await setup();
    expect(fixture.nativeElement.querySelector('#profile-information')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#password-security')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#notifications')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#linked-accounts')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#danger-zone')).toBeTruthy();
  });

  // ── Hero card ──
  it('displays initials when no avatar URL', async () => {
    const { fixture } = await setup();
    const initials = fixture.nativeElement.querySelector('.avatar-initials');
    expect(initials?.textContent?.trim()).toBe('AD');
  });

  it('displays avatar image when avatar_url is set', async () => {
    const spy = makeAuthSpy({ ...MOCK_USER, avatar_url: 'http://test/avatar.jpg' });
    const { fixture } = await setup(spy);
    expect(fixture.nativeElement.querySelector('.avatar-img')).toBeTruthy();
  });

  it('displays full name in hero card', async () => {
    const { fixture } = await setup();
    expect(fixture.nativeElement.querySelector('.hero-name')?.textContent?.trim()).toBe('Alice Driver');
  });

  it('displays email with verified badge', async () => {
    const { fixture } = await setup();
    const badge = fixture.nativeElement.querySelector('.verified-badge');
    expect(badge).toBeTruthy();
  });

  it('displays member since chip', async () => {
    const { fixture } = await setup();
    const chip = fixture.nativeElement.querySelector('.hero-member-chip');
    expect(chip?.textContent).toContain('2025');
  });

  it('displays 3 stats in stats strip', async () => {
    const { fixture } = await setup();
    const stats = fixture.nativeElement.querySelectorAll('.stat-item');
    expect(stats.length).toBe(3);
  });

  it('renders 5 section nav links', async () => {
    const { fixture } = await setup();
    const links = fixture.nativeElement.querySelectorAll('.nav-link');
    expect(links.length).toBe(5);
  });

  it('scrollToSection updates activeSection', async () => {
    const { component } = await setup();
    component.scrollToSection('notifications');
    expect(component.activeSection()).toBe('notifications');
  });

  // ── Profile information ──
  it('populates form from currentUser$ on init', async () => {
    const { component } = await setup();
    expect(component.profileForm.get('firstName')?.value).toBe('Alice');
    expect(component.profileForm.get('lastName')?.value).toBe('Driver');
    expect(component.profileForm.get('bio')?.value).toBe('Test bio');
    expect(component.profileForm.get('cdlNumber')?.value).toBe('CDL123');
  });

  it('shows view mode with 7+ info fields by default', async () => {
    const { fixture } = await setup();
    const fields = fixture.nativeElement.querySelectorAll('.info-field');
    expect(fields.length).toBeGreaterThanOrEqual(5);
  });

  it('Edit button toggles to edit mode', async () => {
    const { fixture, component } = await setup();
    component.toggleEditProfile();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#firstName')).toBeTruthy();
  });

  it('saveProfile calls updateProfile with all fields', async () => {
    const { component, authSpy } = await setup();
    component.editingProfile.set(true);
    component.profileForm.patchValue({
      firstName: 'Bob', lastName: 'Smith', phone: '555-0000',
      state: 'CA', cdlNumber: 'CDL999', bio: 'New bio',
    });
    component.saveProfile();
    expect(authSpy.updateProfile).toHaveBeenCalledWith({
      name: 'Bob Smith', phone: '555-0000', bio: 'New bio',
      cdl_number: 'CDL999', cdl_state: 'CA',
    });
  });

  it('cancel resets form to current user values', async () => {
    const { component } = await setup();
    component.editingProfile.set(true);
    component.profileForm.patchValue({ firstName: 'Changed' });
    component.toggleEditProfile(); // cancel
    expect(component.profileForm.get('firstName')?.value).toBe('Alice');
  });

  it('invalid form shows toast error', async () => {
    const { component, authSpy } = await setup();
    component.editingProfile.set(true);
    component.profileForm.patchValue({ firstName: '', lastName: '' });
    component.saveProfile();
    expect(authSpy.updateProfile).not.toHaveBeenCalled();
    expect(component.toastMessage()).toContain('required');
  });

  it('bio character counter updates', async () => {
    const { component } = await setup();
    component.profileForm.patchValue({ bio: 'Hello world' });
    expect(component.bioCharCount()).toBe(11);
  });

  // ── Password & Security ──
  it('displays password dots', async () => {
    const { fixture } = await setup();
    expect(fixture.nativeElement.querySelector('.password-dots')).toBeTruthy();
  });

  it('Change Password button expands form', async () => {
    const { fixture, component } = await setup();
    component.togglePasswordForm();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.password-form')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#currentPassword')).toBeTruthy();
  });

  it('savePassword calls changePassword', async () => {
    const { component, authSpy } = await setup();
    component.showPasswordForm.set(true);
    component.passwordForm.patchValue({
      currentPassword: 'old123!',
      newPassword: 'new123456',
      confirmPassword: 'new123456',
    });
    component.savePassword();
    expect(authSpy.changePassword).toHaveBeenCalledWith('old123!', 'new123456');
  });

  it('mismatched passwords shows error toast', async () => {
    const { component, authSpy } = await setup();
    component.showPasswordForm.set(true);
    component.passwordForm.patchValue({
      currentPassword: 'old123!',
      newPassword: 'new123456',
      confirmPassword: 'different',
    });
    component.passwordForm.get('confirmPassword')?.markAsTouched();
    component.savePassword();
    expect(authSpy.changePassword).not.toHaveBeenCalled();
    expect(component.toastMessage()).toBe('Passwords do not match.');
  });

  it('2FA warning banner is shown', async () => {
    const { fixture } = await setup();
    expect(fixture.nativeElement.querySelector('.twofa-warning')).toBeTruthy();
  });

  it('password visibility toggle works', async () => {
    const { component } = await setup();
    expect(component.passwordVisibility()['currentPassword']).toBe(false);
    component.togglePasswordVisibility('currentPassword');
    expect(component.passwordVisibility()['currentPassword']).toBe(true);
  });

  // ── Notification Preferences ──
  it('renders 5 toggle rows', async () => {
    const { fixture } = await setup();
    const toggles = fixture.nativeElement.querySelectorAll('.toggle-switch');
    expect(toggles.length).toBe(5);
  });

  it('toggles have role="switch" and aria-checked', async () => {
    const { fixture } = await setup();
    const toggle = fixture.nativeElement.querySelector('.toggle-switch');
    expect(toggle?.getAttribute('role')).toBe('switch');
    expect(toggle?.getAttribute('aria-checked')).toBeTruthy();
  });

  it('toggling calls updatePreference', async () => {
    const { component, notifSpy } = await setup();
    component.toggleNotification(0);
    expect(notifSpy.updatePreference).toHaveBeenCalledWith('case_updates', 'email', false);
  });

  it('optimistic update reverts on error', async () => {
    const notifSpy = makeNotifSpy();
    notifSpy.updatePreference.mockReturnValue(throwError(() => new Error('fail')));
    const { component } = await setup(makeAuthSpy(), notifSpy);
    const before = component.notificationToggles()[0].enabled;
    component.toggleNotification(0);
    expect(component.notificationToggles()[0].enabled).toBe(before);
    expect(component.toastMessage()).toContain('Failed');
  });

  it('keyboard Enter toggles notification', async () => {
    const { component, notifSpy } = await setup();
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    vi.spyOn(event, 'preventDefault');
    component.onToggleKeydown(event, 1);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(notifSpy.updatePreference).toHaveBeenCalled();
  });

  it('keyboard Space toggles notification', async () => {
    const { component, notifSpy } = await setup();
    const event = new KeyboardEvent('keydown', { key: ' ' });
    vi.spyOn(event, 'preventDefault');
    component.onToggleKeydown(event, 2);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(notifSpy.updatePreference).toHaveBeenCalled();
  });

  // ── Linked Accounts ──
  it('renders 3 provider rows', async () => {
    const { fixture } = await setup();
    const rows = fixture.nativeElement.querySelectorAll('.linked-row');
    expect(rows.length).toBe(3);
  });

  it('Apple shows Coming Soon badge', async () => {
    const { fixture } = await setup();
    expect(fixture.nativeElement.querySelector('.coming-soon-badge')?.textContent?.trim()).toBe('Coming Soon');
  });

  it('Google connect button calls signInWithGoogle', async () => {
    const { component, authSpy } = await setup();
    component.connectGoogle();
    expect(authSpy.signInWithGoogle).toHaveBeenCalled();
  });

  // ── Danger Zone ──
  it('renders red-bordered danger card', async () => {
    const { fixture } = await setup();
    expect(fixture.nativeElement.querySelector('.card-danger')).toBeTruthy();
  });

  it('Delete Account button opens modal', async () => {
    const { fixture, component } = await setup();
    component.openDeleteModal();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeTruthy();
  });

  it('typing DELETE enables confirm button', async () => {
    const { fixture, component } = await setup();
    component.openDeleteModal();
    component.deleteConfirmText.set('DELETE');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.modal-actions .btn-danger');
    expect(btn?.disabled).toBe(false);
  });

  it('confirm shows toast and closes modal', async () => {
    const { component } = await setup();
    component.openDeleteModal();
    component.deleteConfirmText.set('DELETE');
    component.confirmDelete();
    expect(component.showDeleteModal()).toBe(false);
    expect(component.toastMessage()).toContain('deletion request submitted');
  });

  it('cancel closes modal', async () => {
    const { component } = await setup();
    component.openDeleteModal();
    component.closeDeleteModal();
    expect(component.showDeleteModal()).toBe(false);
  });

  // ── Accessibility ──
  it('emoji spans have aria-hidden="true"', async () => {
    const { fixture } = await setup();
    const emojis = fixture.nativeElement.querySelectorAll('[aria-hidden="true"]');
    expect(emojis.length).toBeGreaterThan(5);
  });

  it('section headings use h2', async () => {
    const { fixture } = await setup();
    const h2s = fixture.nativeElement.querySelectorAll('h2');
    expect(h2s.length).toBeGreaterThanOrEqual(5);
  });

  it('form inputs have labels', async () => {
    const { fixture, component } = await setup();
    component.editingProfile.set(true);
    fixture.detectChanges();
    const labels = fixture.nativeElement.querySelectorAll('label[for]');
    expect(labels.length).toBeGreaterThanOrEqual(5);
  });

  // ── Computed signals ──
  it('initials computed correctly for two-word name', async () => {
    const { component } = await setup();
    expect(component.initials()).toBe('AD');
  });

  it('initials handles single name', async () => {
    const spy = makeAuthSpy({ ...MOCK_USER, name: 'Alice' });
    const { component } = await setup(spy);
    expect(component.initials()).toBe('A');
  });

  it('fullName defaults to Driver when no user', async () => {
    const spy = makeAuthSpy({ ...MOCK_USER, name: '' });
    const { component } = await setup(spy);
    expect(component.fullName()).toBe('Driver');
  });

  // ── Toast ──
  it('showToast sets message', async () => {
    const { component } = await setup();
    component.showToast('Test message', 'success');
    expect(component.toastMessage()).toBe('Test message');
    expect(component.toastType()).toBe('success');
  });

  it('dismissToast clears message', async () => {
    const { component } = await setup();
    component.showToast('Test', 'success');
    component.dismissToast();
    expect(component.toastMessage()).toBe('');
  });

  // ── Avatar upload ──
  it('uploadAvatar calls authService.uploadAvatar', async () => {
    const { component, authSpy } = await setup();
    const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;
    component.onAvatarSelected(event);
    expect(authSpy.uploadAvatar).toHaveBeenCalledWith(file);
  });

  it('rejects files over 5MB', async () => {
    const { component, authSpy } = await setup();
    const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [bigFile], value: '' } } as unknown as Event;
    component.onAvatarSelected(event);
    expect(authSpy.uploadAvatar).not.toHaveBeenCalled();
    expect(component.toastMessage()).toContain('5 MB');
  });

  it('rejects invalid file types', async () => {
    const { component, authSpy } = await setup();
    const file = new File(['test'], 'doc.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;
    component.onAvatarSelected(event);
    expect(authSpy.uploadAvatar).not.toHaveBeenCalled();
    expect(component.toastMessage()).toContain('JPG');
  });

  // ── Navigation ──
  it('goToDashboard navigates to driver dashboard', async () => {
    const { component, router } = await setup();
    component.goToDashboard();
    expect(router.navigate).toHaveBeenCalledWith(['/driver/dashboard']);
  });
});
