import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { OnboardingOverlayComponent, OnboardingStep } from './onboarding-overlay.component';
import { OnboardingService } from '../../../core/services/onboarding.service';

const DRIVER_STEPS: OnboardingStep[] = [
  { title: 'Welcome!', text: 'This is your Driver Dashboard.', icon: 'dashboard' },
  { title: 'Submit a Ticket', text: 'Tap the Submit button to start.', icon: 'add_circle' },
  { title: 'Track Your Cases', text: 'View all your active cases here.', icon: 'folder' },
  { title: 'Attorney Matching', text: 'We match you with the best attorney.', icon: 'gavel' },
  { title: 'Notifications', text: 'Get SMS and email updates.', icon: 'notifications' },
];

// ─── OnboardingService (unit) ─────────────────────────────────────────────────

describe('OnboardingService', () => {
  let service: OnboardingService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(OnboardingService);
  });

  afterEach(() => localStorage.clear());

  it('isComplete() returns false when tour has not been completed', () => {
    expect(service.isComplete('driver')).toBe(false);
  });

  it('isComplete() returns true after markComplete()', () => {
    service.markComplete('driver');
    expect(service.isComplete('driver')).toBe(true);
  });

  it('resetTour() clears completion so isComplete() returns false again', () => {
    service.markComplete('driver');
    service.resetTour('driver');
    expect(service.isComplete('driver')).toBe(false);
  });

  it('getCurrentStep() returns 0 when no step has been saved', () => {
    expect(service.getCurrentStep('driver')).toBe(0);
  });

  it('saveStep() + getCurrentStep() persists the step correctly', () => {
    service.saveStep('driver', 3);
    expect(service.getCurrentStep('driver')).toBe(3);
  });
});

// ─── OnboardingOverlayComponent (driver tour) ─────────────────────────────────

describe('OnboardingOverlayComponent — driver tour', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  async function setup(steps = DRIVER_STEPS, complete = false) {
    if (complete) {
      localStorage.setItem('cdl_onboarding_driver', 'complete');
    }
    await TestBed.configureTestingModule({
      imports: [OnboardingOverlayComponent, NoopAnimationsModule],
    }).compileComponents();

    const fixture = TestBed.createComponent(OnboardingOverlayComponent);
    fixture.componentRef.setInput('tourId', 'driver');
    fixture.componentRef.setInput('steps', steps);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('shows first step title and "Next" button on initial load', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Welcome!');
    expect(el.textContent).toContain('Next');
  });
});
