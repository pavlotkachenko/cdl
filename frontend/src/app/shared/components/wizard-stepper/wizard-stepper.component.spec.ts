import { TestBed, ComponentFixture } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { WizardStepperComponent, WizardStep } from './wizard-stepper.component';

const STEPS: WizardStep[] = [
  { label: 'Scan' },
  { label: 'Type' },
  { label: 'Details' },
  { label: 'Review' },
];

describe('WizardStepperComponent', () => {
  let fixture: ComponentFixture<WizardStepperComponent>;
  let component: WizardStepperComponent;

  async function setup(currentStep = 0) {
    await TestBed.configureTestingModule({
      imports: [WizardStepperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WizardStepperComponent);
    fixture.componentRef.setInput('steps', STEPS);
    fixture.componentRef.setInput('currentStep', currentStep);
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('renders correct number of steps', async () => {
    await setup();
    const items = fixture.nativeElement.querySelectorAll('.stepper-item');
    expect(items.length).toBe(4);
  });

  it('marks steps before current as done', async () => {
    await setup(2);
    const items = fixture.nativeElement.querySelectorAll('.stepper-item');
    expect(items[0].classList.contains('done')).toBe(true);
    expect(items[1].classList.contains('done')).toBe(true);
    expect(items[2].classList.contains('current')).toBe(true);
    expect(items[3].classList.contains('todo')).toBe(true);
  });

  it('sets aria-current on current step', async () => {
    await setup(1);
    const items = fixture.nativeElement.querySelectorAll('.stepper-item');
    expect(items[1].getAttribute('aria-current')).toBe('step');
    expect(items[0].getAttribute('aria-current')).toBeNull();
  });

  it('shows checkmark SVG for completed steps', async () => {
    await setup(2);
    const doneCircles = fixture.nativeElement.querySelectorAll('.stepper-item.done .check-icon');
    expect(doneCircles.length).toBe(2);
  });

  it('shows step number for current and todo steps', async () => {
    await setup(1);
    const currentNumber = fixture.nativeElement.querySelector('.stepper-item.current .step-number');
    expect(currentNumber?.textContent?.trim()).toBe('2');
  });

  it('has navigation role and aria-label', async () => {
    await setup();
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav.getAttribute('role')).toBe('navigation');
    expect(nav.getAttribute('aria-label')).toBe('Form progress');
  });

  it('renders step labels', async () => {
    await setup();
    const labels = fixture.nativeElement.querySelectorAll('.step-label');
    expect(labels[0].textContent.trim()).toBe('Scan');
    expect(labels[3].textContent.trim()).toBe('Review');
  });

  it('renders connectors between steps (not after last)', async () => {
    await setup();
    const connectors = fixture.nativeElement.querySelectorAll('.step-connector');
    expect(connectors.length).toBe(3); // 4 steps - 1
  });

  it('stepAriaLabel returns correct label for each state', async () => {
    await setup(1);
    expect(component.stepAriaLabel(0, 'Scan')).toContain('completed');
    expect(component.stepAriaLabel(1, 'Type')).toContain('current step');
    expect(component.stepAriaLabel(2, 'Details')).toContain('upcoming');
  });
});
