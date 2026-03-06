import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { LandingComponent } from './landing.component';
import { CaseService } from '../../core/services/case.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('LandingComponent', () => {
  let fixture: ComponentFixture<LandingComponent>;
  let component: LandingComponent;
  let caseService: { publicSubmit: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    caseService = { publicSubmit: vi.fn().mockReturnValue(of({})) };
    snackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        provideAnimationsAsync(),
        provideRouter([]),
        { provide: CaseService, useValue: caseService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: ActivatedRoute, useValue: { fragment: of(null) } },
      ],
    }).compileComponents();

    navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (component) component.ngOnDestroy();
  });

  it('initializes with drivers service view and slide index 0', () => {
    expect(component.currentServiceView()).toBe('drivers');
    expect(component.currentSlideIndex()).toBe(0);
  });

  it('nextSlide advances the slide index', () => {
    component.nextSlide();
    expect(component.currentSlideIndex()).toBe(1);
  });

  it('nextSlide wraps around at the end', () => {
    component.currentSlideIndex.set(component.heroSlides.length - 1);
    component.nextSlide();
    expect(component.currentSlideIndex()).toBe(0);
  });

  it('prevSlide wraps around from index 0', () => {
    component.currentSlideIndex.set(0);
    component.prevSlide();
    expect(component.currentSlideIndex()).toBe(component.heroSlides.length - 1);
  });

  it('activeServices returns driverServices when view is drivers', () => {
    component.currentServiceView.set('drivers');
    expect(component.activeServices()).toEqual(component.driverServices);
  });

  it('activeServices returns carrierServices when view is carriers', () => {
    component.currentServiceView.set('carriers');
    expect(component.activeServices()).toEqual(component.carrierServices);
  });

  it('visibleTestimonials returns first 4 testimonials on page 0', () => {
    component.currentTestimonialIndex.set(0);
    expect(component.visibleTestimonials().length).toBe(4);
    expect(component.visibleTestimonials()[0].name).toBe('Losta M.');
  });

  it('nextTestimonial advances to next page', () => {
    component.currentTestimonialIndex.set(0);
    component.nextTestimonial();
    expect(component.currentTestimonialIndex()).toBe(1);
  });

  it('toggleFaq opens an item', () => {
    component.toggleFaq(2);
    expect(component.openFaqIndex()).toBe(2);
  });

  it('toggleFaq closes already-open item', () => {
    component.toggleFaq(2);
    component.toggleFaq(2);
    expect(component.openFaqIndex()).toBeNull();
  });

  it('faqItems has 10 entries', () => {
    expect(component.faqItems.length).toBe(10);
  });

  it('onSubmitRequest shows snackBar and sets submitSuccess on success', () => {
    component.submitForm.setValue({
      customer_name: 'Test Driver',
      email: 'test@example.com',
      driver_phone: '5550001234',
      violation_details: 'Speeding on I-95',
    });
    component.onSubmitRequest();
    expect(caseService.publicSubmit).toHaveBeenCalled();
    expect(component.submitSuccess()).toBe(true);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Request submitted successfully! We will contact you within 1 hour.',
      'Close',
      { duration: 5000 }
    );
  });

  it('onSubmitRequest shows error snackBar on failure', () => {
    caseService.publicSubmit.mockReturnValue(throwError(() => ({ error: { message: 'Server error' } })));
    component.submitForm.setValue({
      customer_name: 'Test Driver',
      email: 'test@example.com',
      driver_phone: '5550001234',
      violation_details: 'Speeding on I-95',
    });
    component.onSubmitRequest();
    expect(component.submitSuccess()).toBe(false);
    expect(snackBar.open).toHaveBeenCalledWith('Server error', 'Close', { duration: 5000 });
  });

  it('onSubmitRequest marks form touched and does not call service when invalid', () => {
    component.onSubmitRequest();
    expect(caseService.publicSubmit).not.toHaveBeenCalled();
    expect(component.submitForm.touched).toBe(true);
  });

  it('getInitials returns two initials for full name', () => {
    expect(component.getInitials('Losta M.')).toBe('LM');
  });

  it('getInitials returns two chars for single word', () => {
    expect(component.getInitials('Juan')).toBe('JU');
  });

  it('getInitials returns ? for empty name', () => {
    expect(component.getInitials('')).toBe('?');
  });

  it('ngOnDestroy clears the slide interval', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    component.ngOnDestroy();
    expect(clearSpy).toHaveBeenCalled();
  });
});
