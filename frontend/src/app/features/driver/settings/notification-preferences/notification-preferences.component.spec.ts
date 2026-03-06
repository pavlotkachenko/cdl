import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { NotificationPreferencesComponent } from './notification-preferences.component';
import { UserPreferencesService } from '../../../../core/services/user-preferences.service';
import { MatSnackBar } from '@angular/material/snack-bar';

function makeSpy() {
  return {
    updateSmsOptIn: vi.fn().mockReturnValue(of({ preferences: { sms_opt_in: true } })),
    savePushToken: vi.fn().mockReturnValue(of({ success: true })),
  };
}

async function setup(
  permission: NotificationPermission = 'default',
  spy = makeSpy(),
) {
  Object.defineProperty(window, 'Notification', {
    value: { permission, requestPermission: vi.fn().mockResolvedValue(permission) },
    configurable: true,
    writable: true,
  });

  await TestBed.configureTestingModule({
    imports: [NotificationPreferencesComponent, NoopAnimationsModule],
    providers: [{ provide: UserPreferencesService, useValue: spy }],
  }).compileComponents();

  const fixture = TestBed.createComponent(NotificationPreferencesComponent);
  fixture.detectChanges();
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  return { fixture, component: fixture.componentInstance, spy, snackBar };
}

describe('NotificationPreferencesComponent (PN-5)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('renders the preferences form', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Notification Preferences');
    expect(el.textContent).toContain('SMS Notifications');
    expect(el.textContent).toContain('Push Notifications');
  });

  it('shows "Enable" button when push permission is "default"', async () => {
    const { fixture } = await setup('default');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Enable');
  });

  it('shows check icon when push permission is already "granted"', async () => {
    const { fixture } = await setup('granted');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.granted-icon')).not.toBeNull();
  });

  it('save() calls updateSmsOptIn with form value', async () => {
    const { component, spy } = await setup();
    component.form.setValue({ smsOptIn: true });
    component.save();
    expect(spy.updateSmsOptIn).toHaveBeenCalledWith(true);
  });

  it('shows snackbar success after save', async () => {
    const { component, snackBar } = await setup();
    component.save();
    expect(snackBar.open).toHaveBeenCalledWith('Preferences saved!', 'Close', { duration: 3000 });
  });

  it('enablePush() calls savePushToken and shows snackbar on granted', async () => {
    const spy = makeSpy();
    const { component, snackBar } = await setup('default', spy);
    (window as any).Notification.requestPermission = vi.fn().mockResolvedValue('granted');
    await component.enablePush();
    expect(spy.savePushToken).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Push notifications enabled!', 'Close', { duration: 3000 });
  });

  it('enablePush() shows denied message when permission not granted', async () => {
    const { component, snackBar } = await setup('default');
    (window as any).Notification.requestPermission = vi.fn().mockResolvedValue('denied');
    await component.enablePush();
    expect(snackBar.open).toHaveBeenCalledWith('Push notifications were not enabled.', 'Close', { duration: 3000 });
  });
});
