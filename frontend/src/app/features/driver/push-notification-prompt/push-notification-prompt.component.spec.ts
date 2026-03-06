import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { PushNotificationPromptComponent } from './push-notification-prompt.component';
import { UserPreferencesService } from '../../../core/services/user-preferences.service';

const DISMISSED_KEY = 'cdl_push_prompt_dismissed';

function makePrefsSpy() {
  return {
    savePushToken: vi.fn().mockReturnValue(of({ success: true })),
    updateSmsOptIn: vi.fn().mockReturnValue(of({ preferences: { sms_opt_in: true } })),
  };
}

async function setup(
  permission: NotificationPermission = 'default',
  dismissed = false,
) {
  if (dismissed) localStorage.setItem(DISMISSED_KEY, '1');

  // Mock Notification API
  Object.defineProperty(window, 'Notification', {
    value: { permission, requestPermission: vi.fn() },
    configurable: true,
    writable: true,
  });

  await TestBed.configureTestingModule({
    imports: [PushNotificationPromptComponent, NoopAnimationsModule],
    providers: [{ provide: UserPreferencesService, useValue: makePrefsSpy() }],
  }).compileComponents();

  const fixture = TestBed.createComponent(PushNotificationPromptComponent);
  fixture.detectChanges();
  const spy = fixture.debugElement.injector.get(UserPreferencesService) as unknown as ReturnType<typeof makePrefsSpy>;
  return { fixture, component: fixture.componentInstance, spy };
}

describe('PushNotificationPromptComponent (PN-4)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('shows the prompt banner when permission is "default"', async () => {
    const { fixture } = await setup('default');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.prompt-banner')).not.toBeNull();
    expect(el.textContent).toContain('Enable push notifications');
  });

  it('hides the prompt when notification permission is already "granted"', async () => {
    const { fixture } = await setup('granted');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.prompt-banner')).toBeNull();
  });

  it('hides the prompt when user previously dismissed it', async () => {
    const { fixture } = await setup('default', true);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.prompt-banner')).toBeNull();
  });

  it('dismiss() hides the banner and sets localStorage key', async () => {
    const { component } = await setup('default');
    component.dismiss();
    expect(component.visible()).toBe(false);
    expect(localStorage.getItem(DISMISSED_KEY)).toBe('1');
  });

  it('enable() calls savePushToken and hides banner on granted permission', async () => {
    const { component, spy } = await setup('default');
    (window as any).Notification.requestPermission = vi.fn().mockResolvedValue('granted');
    await component.enable();
    expect(spy.savePushToken).toHaveBeenCalled();
    expect(component.visible()).toBe(false);
  });

  it('enable() does not call savePushToken when permission is denied', async () => {
    const { component, spy } = await setup('default');
    (window as any).Notification.requestPermission = vi.fn().mockResolvedValue('denied');
    await component.enable();
    expect(spy.savePushToken).not.toHaveBeenCalled();
    expect(component.visible()).toBe(true);
  });
});
