import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CaseEditFormComponent } from './case-edit-form.component';
import { CaseService } from '../../../core/services/case.service';

const MOCK_CASE = {
  id: 'c1',
  case_number: 'CDL-601',
  status: 'reviewed',
  violation_type: 'speeding',
  violation_date: '2026-02-15',
  violation_details: 'Going 75 in a 55 zone',
  state: 'TX',
  county: 'Harris',
  town: 'Houston',
  court_date: '2026-04-10',
  next_action_date: null,
  attorney_price: 350,
  court_fee: null,
  carrier: 'Fast Fleet',
  created_at: '2026-03-08T10:30:00Z',
};

describe('CaseEditFormComponent', () => {
  let fixture: ComponentFixture<CaseEditFormComponent>;
  let component: CaseEditFormComponent;
  let caseServiceSpy: { patchCase: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    TestBed.resetTestingModule();

    caseServiceSpy = {
      patchCase: vi.fn().mockReturnValue(of({ case: { ...MOCK_CASE, violation_type: 'dui' } })),
    };

    await TestBed.configureTestingModule({
      imports: [CaseEditFormComponent, NoopAnimationsModule],
      providers: [
        { provide: CaseService, useValue: caseServiceSpy },
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CaseEditFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('caseData', MOCK_CASE);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ----------------------------------------------------------------
  // View mode (default)
  // ----------------------------------------------------------------
  it('renders in view mode by default', () => {
    expect(component.editing()).toBe(false);
    expect(fixture.nativeElement.querySelector('.view-mode')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.edit-mode')).toBeFalsy();
  });

  it('shows edit button in view mode', () => {
    expect(fixture.nativeElement.querySelector('.edit-btn')).toBeTruthy();
  });

  it('displays case data values in view mode', () => {
    const values = fixture.nativeElement.querySelectorAll('.field-value');
    const texts = Array.from(values).map((el: any) => el.textContent.trim());
    expect(texts).toContain('speeding');
    expect(texts).toContain('TX');
  });

  it('shows locked fields with lock icon', () => {
    const locked = fixture.nativeElement.querySelectorAll('.locked');
    expect(locked.length).toBeGreaterThanOrEqual(2); // case_number + created_at
  });

  // ----------------------------------------------------------------
  // Edit mode
  // ----------------------------------------------------------------
  it('switches to edit mode when edit button is clicked', () => {
    component.startEditing();
    fixture.detectChanges();

    expect(component.editing()).toBe(true);
    expect(fixture.nativeElement.querySelector('.edit-mode')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.view-mode')).toBeFalsy();
  });

  it('populates form with current case data', () => {
    component.startEditing();
    expect(component.form.value.violation_type).toBe('speeding');
    expect(component.form.value.state).toBe('TX');
    expect(component.form.value.county).toBe('Harris');
    expect(component.form.value.attorney_price).toBe(350);
  });

  // ----------------------------------------------------------------
  // Validation
  // ----------------------------------------------------------------
  it('shows error when required field is empty', () => {
    component.startEditing();
    component.form.controls.violation_type.setValue('');
    component.form.controls.violation_type.markAsTouched();
    expect(component.form.controls.violation_type.hasError('required')).toBe(true);
  });

  it('form is invalid when required field is cleared', () => {
    component.startEditing();
    component.form.controls.state.setValue('');
    expect(component.form.valid).toBe(false);
  });

  // ----------------------------------------------------------------
  // Save
  // ----------------------------------------------------------------
  it('save calls patchCase with only changed fields', () => {
    component.startEditing();
    component.form.controls.violation_type.setValue('dui');
    fixture.detectChanges();

    component.save();

    expect(caseServiceSpy.patchCase).toHaveBeenCalledWith('c1', { violation_type: 'dui' });
  });

  it('save button disabled when form unchanged', () => {
    component.startEditing();
    fixture.detectChanges();

    expect(component.isDirty()).toBe(false);
  });

  it('emits saved event on successful save', () => {
    const savedSpy = vi.fn();
    component.saved.subscribe(savedSpy);

    component.startEditing();
    component.form.controls.violation_type.setValue('dui');
    component.save();

    expect(savedSpy).toHaveBeenCalled();
    expect(component.editing()).toBe(false);
  });

  it('stays in edit mode on save error', () => {
    caseServiceSpy.patchCase.mockReturnValue(throwError(() => ({
      error: { error: { message: 'Validation failed' } },
    })));

    component.startEditing();
    component.form.controls.violation_type.setValue('dui');
    component.save();

    expect(component.editing()).toBe(true);
    expect(component.error()).toBeTruthy();
  });

  // ----------------------------------------------------------------
  // Cancel
  // ----------------------------------------------------------------
  it('cancel resets form and returns to view mode', () => {
    component.startEditing();
    component.form.controls.violation_type.setValue('dui');
    component.cancel();

    expect(component.editing()).toBe(false);
    expect(component.form.value.violation_type).toBe('speeding');
  });

  // ----------------------------------------------------------------
  // Read-only mode
  // ----------------------------------------------------------------
  it('hides edit button when readonly is true', () => {
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.edit-btn')).toBeFalsy();
  });

  // ----------------------------------------------------------------
  // Dropdown options
  // ----------------------------------------------------------------
  it('has 51 US state options', () => {
    expect(component.usStates).toHaveLength(51);
  });

  it('has violation type options', () => {
    expect(component.violationTypes.length).toBeGreaterThan(0);
    expect(component.violationTypes).toContain('speeding');
  });
});
