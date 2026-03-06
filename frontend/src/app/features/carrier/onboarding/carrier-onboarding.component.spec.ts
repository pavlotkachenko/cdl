/**
 * OB-2 — Carrier Onboarding Overlay
 * Uses the shared OnboardingOverlayComponent with carrier-specific steps.
 */
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  OnboardingOverlayComponent, OnboardingStep,
} from '../../../shared/components/onboarding-overlay/onboarding-overlay.component';
import { OnboardingService } from '../../../core/services/onboarding.service';

const CARRIER_STEPS: OnboardingStep[] = [
  { title: 'Fleet Dashboard', text: 'View all your drivers and their cases.', icon: 'local_shipping' },
  { title: 'Add Drivers', text: 'Invite drivers to join your fleet.', icon: 'person_add' },
  { title: 'Monitor Cases', text: 'Track every ticket in real time.', icon: 'analytics' },
  { title: 'Analytics', text: 'See performance insights for your fleet.', icon: 'bar_chart' },
];

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

async function setup(steps = CARRIER_STEPS, complete = false) {
  if (complete) {
    localStorage.setItem('cdl_onboarding_carrier', 'complete');
  }
  await TestBed.configureTestingModule({
    imports: [OnboardingOverlayComponent, NoopAnimationsModule],
  }).compileComponents();

  const fixture = TestBed.createComponent(OnboardingOverlayComponent);
  fixture.componentRef.setInput('tourId', 'carrier');
  fixture.componentRef.setInput('steps', steps);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('OnboardingOverlay — carrier tour (OB-2)', () => {
  it('is not visible when carrier tour is already complete', async () => {
    const { fixture } = await setup(CARRIER_STEPS, true);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.ob-backdrop')).toBeNull();
  });

  it('shows carrier-specific first step title', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Fleet Dashboard');
  });

  it('skip() marks carrier tour complete and hides overlay', async () => {
    const { component } = await setup();
    const service = TestBed.inject(OnboardingService);
    component.skip();
    expect(service.isComplete('carrier')).toBe(true);
    expect(component.visible()).toBe(false);
  });

  it('shows "Done" button on the last step', async () => {
    const { fixture, component } = await setup();
    // advance to last step
    component.currentStep.set(CARRIER_STEPS.length - 1);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Done');
  });
});
