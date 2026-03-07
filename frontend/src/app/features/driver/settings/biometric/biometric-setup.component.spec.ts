/**
 * BiometricSetupComponent tests — Sprint 037 BIO-3
 */
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { BiometricSetupComponent } from './biometric-setup.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';

const snackBarSpy = { open: vi.fn() };

async function setup() {
  await TestBed.configureTestingModule({
    imports: [BiometricSetupComponent, NoopAnimationsModule, HttpClientTestingModule],
    providers: [{ provide: MatSnackBar, useValue: snackBarSpy }],
  }).compileComponents();

  const fixture = TestBed.createComponent(BiometricSetupComponent);
  fixture.detectChanges();
  const http = TestBed.inject(HttpTestingController);
  return { fixture, component: fixture.componentInstance, http };
}

describe('BiometricSetupComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('shows "Enable Biometric Login" button when not enrolled', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Enable Biometric Login');
  });

  it('shows enrolled status when webauthn_enrolled is set in localStorage', async () => {
    localStorage.setItem('webauthn_enrolled', 'true');
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Biometric login is enabled');
  });

  it('remove() clears localStorage and updates enrolled signal', async () => {
    localStorage.setItem('webauthn_enrolled', 'true');
    const { component } = await setup();
    expect(component.enrolled()).toBe(true);
    component.remove();
    expect(component.enrolled()).toBe(false);
    expect(localStorage.getItem('webauthn_enrolled')).toBeNull();
  });

  it('enrolled() reflects localStorage webauthn_enrolled flag', async () => {
    localStorage.setItem('webauthn_enrolled', 'true');
    const { component } = await setup();
    expect(component.enrolled()).toBe(true);
  });
});
