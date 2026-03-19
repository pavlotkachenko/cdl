import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { NotificationPreferencesComponent } from './notification-preferences.component';
import { UserPreferencesService } from '../../../../core/services/user-preferences.service';
import { AuthService } from '../../../../core/services/auth.service';

function makeSpy() {
  return {
    updateSmsOptIn: vi.fn().mockReturnValue(of({ preferences: { sms_opt_in: true } })),
    savePushToken: vi.fn().mockReturnValue(of({ success: true })),
  };
}

function makeAuthSpy(overrides: Record<string, any> = {}) {
  return {
    getCurrentUser: vi.fn().mockReturnValue({
      id: 'u1', email: 'driver@test.com', role: 'driver', name: 'Test Driver',
      phone: '', ...overrides,
    }),
  };
}

function makeRouter() {
  return { navigate: vi.fn() };
}

async function setup(
  permission: NotificationPermission = 'granted',
  spy = makeSpy(),
  router = makeRouter(),
  authSpy = makeAuthSpy(),
) {
  Object.defineProperty(window, 'Notification', {
    value: { permission, requestPermission: vi.fn().mockResolvedValue(permission) },
    configurable: true,
    writable: true,
  });

  await TestBed.configureTestingModule({
    imports: [NotificationPreferencesComponent],
    providers: [
      { provide: UserPreferencesService, useValue: spy },
      { provide: Router, useValue: router },
      { provide: AuthService, useValue: authSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(NotificationPreferencesComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, spy, router, authSpy, el: fixture.nativeElement as HTMLElement };
}

describe('NotificationPreferencesComponent', () => {
  beforeEach(() => localStorage.clear());

  // ── NP-1: Component Modernization ──
  it('renders without Angular Material', async () => {
    const { el } = await setup();
    expect(el.querySelector('mat-card')).toBeNull();
    expect(el.querySelector('mat-slide-toggle')).toBeNull();
    expect(el.querySelector('mat-icon')).toBeNull();
  });

  // ── NP-2: Page Header & Layout ──
  it('renders page header with title and subtitle', async () => {
    const { el } = await setup();
    expect(el.querySelector('h1')?.textContent).toContain('Notification Preferences');
    expect(el.textContent).toContain('Control how and when');
    expect(el.textContent).toContain('Alerts & Updates');
  });

  it('renders two-column layout', async () => {
    const { el } = await setup();
    expect(el.querySelector('.prefs-layout')).not.toBeNull();
    expect(el.querySelector('.left-col')).not.toBeNull();
    expect(el.querySelector('.right-col')).not.toBeNull();
  });

  // ── NP-3: Email Notifications Section ──
  it('renders email section with heading and 6 toggle rows', async () => {
    const { el } = await setup();
    expect(el.querySelector('#email-heading')?.textContent).toContain('Email Notifications');
    const emailCard = el.querySelector('[aria-labelledby="email-heading"]');
    const rows = emailCard?.querySelectorAll('.pref-row');
    expect(rows?.length).toBe(6);
  });

  it('renders email toggle labels', async () => {
    const { el } = await setup();
    expect(el.textContent).toContain('Case Status Updates');
    expect(el.textContent).toContain('Attorney Messages');
    expect(el.textContent).toContain('Payment Confirmations');
    expect(el.textContent).toContain('Court Date Reminders');
    expect(el.textContent).toContain('Document Requests');
    expect(el.textContent).toContain('Marketing & News');
  });

  it('renders Urgent and Recommended badges', async () => {
    const { el } = await setup();
    const urgentBadges = el.querySelectorAll('.badge-urgent');
    const recBadges = el.querySelectorAll('.badge-recommended');
    expect(urgentBadges.length).toBeGreaterThanOrEqual(2);
    expect(recBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('email master toggle cascades to disable children', async () => {
    const { fixture, component, el } = await setup();
    expect(component.emailMasterOn()).toBe(true);
    component.toggleEmailMaster();
    fixture.detectChanges();
    const emailCard = el.querySelector('[aria-labelledby="email-heading"]');
    const disabledRows = emailCard?.querySelectorAll('.pref-row.disabled');
    expect(disabledRows?.length).toBe(6);
    expect(component.emailEnabledCount()).toBe(0);
  });

  it('email master ON restores defaults', async () => {
    const { component } = await setup();
    component.toggleEmailMaster(); // OFF
    component.toggleEmailMaster(); // ON
    expect(component.emailToggles()['marketing']).toBe(false); // marketing defaults off
    expect(component.emailToggles()['case_status']).toBe(true);
  });

  it('toggleEmail flips individual toggle', async () => {
    const { component } = await setup();
    expect(component.getEmailToggle('marketing')).toBe(false);
    component.toggleEmail('marketing');
    expect(component.getEmailToggle('marketing')).toBe(true);
  });

  it('toggleEmail does nothing when master is off', async () => {
    const { component } = await setup();
    component.toggleEmailMaster(); // OFF
    component.toggleEmail('case_status');
    expect(component.getEmailToggle('case_status')).toBe(false);
  });

  // ── NP-4: SMS Notifications Section ──
  it('renders SMS section with 2 toggle rows', async () => {
    const { el } = await setup();
    expect(el.querySelector('#sms-heading')?.textContent).toContain('SMS Notifications');
    const smsCard = el.querySelector('[aria-labelledby="sms-heading"]');
    const rows = smsCard?.querySelectorAll('.pref-row');
    expect(rows?.length).toBe(2);
  });

  it('SMS rows are disabled when master is off', async () => {
    const { el } = await setup();
    const smsCard = el.querySelector('[aria-labelledby="sms-heading"]');
    const disabledRows = smsCard?.querySelectorAll('.pref-row.disabled');
    expect(disabledRows?.length).toBe(2);
  });

  it('SMS master toggle enables child rows', async () => {
    const { fixture, component, el } = await setup();
    component.toggleSmsMaster();
    fixture.detectChanges();
    const smsCard = el.querySelector('[aria-labelledby="sms-heading"]');
    const disabledRows = smsCard?.querySelectorAll('.pref-row.disabled');
    expect(disabledRows?.length).toBe(0);
  });

  it('renders phone verification banner when not verified', async () => {
    const { el } = await setup();
    expect(el.querySelector('.verify-banner')).not.toBeNull();
    expect(el.textContent).toContain('Phone number not verified');
    expect(el.textContent).toContain('Verify Now');
  });

  it('hides verification banner when phone is present', async () => {
    const { el } = await setup('granted', makeSpy(), makeRouter(), makeAuthSpy({ phone: '+15551234567' }));
    expect(el.querySelector('.verify-banner')).toBeNull();
  });

  it('verify phone navigates to profile', async () => {
    const { component, router } = await setup();
    component.verifyPhone();
    expect(router.navigate).toHaveBeenCalledWith(['/driver/profile']);
  });

  it('shows "Not verified" text in SMS subtitle when no phone', async () => {
    const { el } = await setup();
    expect(el.textContent).toContain('Not verified');
  });

  // ── NP-5: Push Notifications Section ──
  it('renders push section with 3 toggle rows', async () => {
    const { el } = await setup();
    expect(el.querySelector('#push-heading')?.textContent).toContain('Push Notifications');
    const pushCard = el.querySelector('[aria-labelledby="push-heading"]');
    const rows = pushCard?.querySelectorAll('.pref-row');
    expect(rows?.length).toBe(3);
  });

  it('shows "Permission Granted" when push is granted', async () => {
    const { el } = await setup('granted');
    expect(el.querySelector('.push-status.granted')).not.toBeNull();
    expect(el.textContent).toContain('Permission Granted');
  });

  it('shows "Enable Push" button when permission is default', async () => {
    const { el } = await setup('default');
    expect(el.querySelector('.push-status.pending')).not.toBeNull();
    expect(el.textContent).toContain('Enable Push');
  });

  it('shows "Permission Denied" when push is denied', async () => {
    const { el } = await setup('denied');
    expect(el.querySelector('.push-status.denied')).not.toBeNull();
    expect(el.textContent).toContain('Permission Denied');
  });

  it('requestPushPermission returns Promise and calls savePushToken on granted', async () => {
    const spy = makeSpy();
    const { component } = await setup('default', spy);
    (window as any).Notification.requestPermission = vi.fn().mockResolvedValue('granted');
    await component.requestPushPermission();
    expect(spy.savePushToken).toHaveBeenCalled();
    expect(component.pushPermission()).toBe('granted');
  });

  it('requestPushPermission catches errors gracefully', async () => {
    const { component } = await setup('default');
    (window as any).Notification.requestPermission = vi.fn().mockRejectedValue(new Error('blocked'));
    await component.requestPushPermission();
    expect(component.pushPermission()).toBe('denied');
  });

  it('togglePush flips individual push toggle', async () => {
    const { component } = await setup();
    expect(component.getPushToggle('payment')).toBe(false);
    component.togglePush('payment');
    expect(component.getPushToggle('payment')).toBe(true);
  });

  it('renders New badge on push messages', async () => {
    const { el } = await setup();
    expect(el.querySelector('.badge-new')).not.toBeNull();
    expect(el.textContent).toContain('New');
  });

  // ── NP-6: Quiet Hours Section ──
  it('renders quiet hours section with time inputs', async () => {
    const { el } = await setup();
    expect(el.querySelector('#quiet-heading')?.textContent).toContain('Quiet Hours');
    expect(el.querySelector('#quiet-from')).not.toBeNull();
    expect(el.querySelector('#quiet-until')).not.toBeNull();
  });

  it('renders 7 day chips', async () => {
    const { el } = await setup();
    const chips = el.querySelectorAll('.day-chip');
    expect(chips.length).toBe(7);
  });

  it('day chips are all active by default', async () => {
    const { el } = await setup();
    const activeChips = el.querySelectorAll('.day-chip.active');
    expect(activeChips.length).toBe(7);
  });

  it('toggleDay toggles a day chip', async () => {
    const { fixture, component, el } = await setup();
    component.toggleDay('Sa');
    fixture.detectChanges();
    expect(component.isDayActive('Sa')).toBe(false);
    const activeChips = el.querySelectorAll('.day-chip.active');
    expect(activeChips.length).toBe(6);
  });

  it('toggleDay does nothing when quiet hours disabled', async () => {
    const { component } = await setup();
    component.quietHoursEnabled.set(false);
    component.toggleDay('Mo');
    expect(component.isDayActive('Mo')).toBe(true);
  });

  it('renders urgent bypass info note', async () => {
    const { el } = await setup();
    expect(el.textContent).toContain('Urgent alerts');
    expect(el.textContent).toContain('always delivered regardless of quiet hours');
  });

  it('quiet hours disabled dims the row', async () => {
    const { fixture, component, el } = await setup();
    component.quietHoursEnabled.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.quiet-row.disabled')).not.toBeNull();
  });

  // ── NP-7: Right Sidebar Cards ──
  it('renders channel status card with 4 rows', async () => {
    const { el } = await setup();
    expect(el.querySelector('#cs-heading')?.textContent).toContain('Channel Status');
    const rows = el.querySelector('[aria-labelledby="cs-heading"]')?.querySelectorAll('.cs-row');
    expect(rows?.length).toBe(4);
  });

  it('channel status shows email active when master is on', async () => {
    const { el } = await setup();
    const rows = el.querySelectorAll('.cs-row');
    expect(rows[0]?.textContent).toContain('Active');
  });

  it('channel status shows SMS setup needed when not verified', async () => {
    const { el } = await setup();
    expect(el.textContent).toContain('Setup needed');
  });

  it('renders active notifications summary', async () => {
    const { el } = await setup();
    expect(el.querySelector('#summary-heading')?.textContent).toContain('Active Notifications');
    expect(el.textContent).toContain('Email alerts');
    expect(el.textContent).toContain('SMS alerts');
    expect(el.textContent).toContain('Push alerts');
  });

  it('summary shows correct email count', async () => {
    const { component } = await setup();
    expect(component.emailEnabledCount()).toBe(5);
  });

  it('summary shows correct push count', async () => {
    const { component } = await setup();
    expect(component.pushEnabledCount()).toBe(2);
  });

  it('renders recommendations card', async () => {
    const { el } = await setup();
    expect(el.querySelector('#tips-heading')?.textContent).toContain('Recommendations');
    const tips = el.querySelectorAll('.tip-item');
    expect(tips.length).toBe(4);
  });

  // ── NP-8: Save Bar & Dirty State ──
  it('renders save bar with buttons', async () => {
    const { el } = await setup();
    expect(el.querySelector('.save-bar')).not.toBeNull();
    expect(el.textContent).toContain('Changes are not saved');
    expect(el.textContent).toContain('Reset to Defaults');
    expect(el.textContent).toContain('Save Preferences');
  });

  it('savePreferences calls updateSmsOptIn', async () => {
    const spy = makeSpy();
    const { component } = await setup('granted', spy);
    component.savePreferences();
    expect(spy.updateSmsOptIn).toHaveBeenCalled();
  });

  it('savePreferences sets saveFlash on success', async () => {
    const { component } = await setup();
    component.savePreferences();
    expect(component.saveFlash()).toBe(true);
  });

  it('savePreferences sets saveError on failure', async () => {
    const spy = makeSpy();
    spy.updateSmsOptIn.mockReturnValue(throwError(() => new Error('fail')));
    const { component } = await setup('granted', spy);
    component.savePreferences();
    expect(component.saving()).toBe(false);
    expect(component.saveError()).toBe(true);
  });

  it('save error displays error message in template', async () => {
    const spy = makeSpy();
    spy.updateSmsOptIn.mockReturnValue(throwError(() => new Error('fail')));
    const { fixture, component, el } = await setup('granted', spy);
    component.savePreferences();
    fixture.detectChanges();
    expect(el.querySelector('.save-error')).not.toBeNull();
    expect(el.textContent).toContain('Failed to save preferences');
  });

  it('resetToDefaults restores initial toggle values', async () => {
    const { component } = await setup();
    component.toggleEmail('case_status');
    component.toggleEmail('marketing');
    component.resetToDefaults();
    expect(component.getEmailToggle('case_status')).toBe(true);
    expect(component.getEmailToggle('marketing')).toBe(false);
    expect(component.quietHoursEnabled()).toBe(true);
  });

  // ── NP-9: Design System & A11y ──
  it('all toggles have role=switch', async () => {
    const { el } = await setup();
    const toggles = el.querySelectorAll('.toggle[role="switch"]');
    expect(toggles.length).toBeGreaterThanOrEqual(12);
  });

  it('all toggles have aria-checked', async () => {
    const { el } = await setup();
    const toggles = el.querySelectorAll('.toggle[role="switch"]');
    toggles.forEach((t: Element) => {
      expect(t.getAttribute('aria-checked')).toBeTruthy();
    });
  });

  it('all toggles have aria-label', async () => {
    const { el } = await setup();
    const toggles = el.querySelectorAll('.toggle[role="switch"]');
    toggles.forEach((t: Element) => {
      expect(t.getAttribute('aria-label')).toBeTruthy();
    });
  });

  it('emoji icons are aria-hidden', async () => {
    const { el } = await setup();
    const emojiSpans = el.querySelectorAll('[aria-hidden="true"]');
    expect(emojiSpans.length).toBeGreaterThan(10);
  });

  it('has semantic headings h1 through h3', async () => {
    const { el } = await setup();
    expect(el.querySelector('h1')).not.toBeNull();
    expect(el.querySelectorAll('h2').length).toBe(4);
    expect(el.querySelectorAll('h3').length).toBe(3);
  });

  it('day chips have aria-pressed', async () => {
    const { el } = await setup();
    const chips = el.querySelectorAll('.day-chip');
    chips.forEach((chip: Element) => {
      expect(chip.getAttribute('aria-pressed')).toBeTruthy();
    });
  });

  it('time inputs have labels', async () => {
    const { el } = await setup();
    expect(el.querySelector('label[for="quiet-from"]')).not.toBeNull();
    expect(el.querySelector('label[for="quiet-until"]')).not.toBeNull();
  });

  // ── User info from AuthService ──
  it('loads user email from AuthService', async () => {
    const { component } = await setup();
    expect(component.userEmail()).toBe('driver@test.com');
  });

  it('loads phone verified status from AuthService', async () => {
    const auth = makeAuthSpy({ phone: '+15551234567' });
    const { component } = await setup('granted', makeSpy(), makeRouter(), auth);
    expect(component.phoneVerified()).toBe(true);
  });

  // ── Computed signals ──
  it('emailEnabledCount returns 0 when master off', async () => {
    const { component } = await setup();
    component.toggleEmailMaster();
    expect(component.emailEnabledCount()).toBe(0);
  });

  it('smsEnabledCount returns 0 when master off', async () => {
    const { component } = await setup();
    expect(component.smsEnabledCount()).toBe(0);
  });

  it('quietFromDisplay formats time correctly', async () => {
    const { component } = await setup();
    expect(component.quietFromDisplay()).toBe('10 PM');
  });

  it('quietUntilDisplay formats time correctly', async () => {
    const { component } = await setup();
    expect(component.quietUntilDisplay()).toBe('7 AM');
  });

  // ── ngOnDestroy cleanup ──
  it('clears flash timer on destroy', async () => {
    const { component } = await setup();
    component.savePreferences();
    expect(component.saveFlash()).toBe(true);
    component.ngOnDestroy();
    // No error thrown — timer was cleared
  });
});
