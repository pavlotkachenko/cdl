/**
 * Tests for AttorneyAssignmentComponent — Sprint 051 / OC-2
 * Tests the attorney assignment dialog: loading, ranked list, auto-assign,
 * manual selection, empty state, and error handling.
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AttorneyAssignmentComponent } from './attorney-assignment.component';
import { CaseService } from '../../../core/services/case.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';

const MOCK_ATTORNEYS = [
  {
    userId: 'a1', firstName: 'Alice', lastName: 'Smith', email: 'alice@law.com',
    specializations: ['speeding', 'CDL'], stateLicenses: ['TX', 'CA'],
    currentCases: 3, availabilityStatus: 'available', score: 87.5,
    scoreBreakdown: { specialization: 100, stateLicense: 100, workload: 94, successRate: 75, availability: 100 },
  },
  {
    userId: 'a2', firstName: 'Bob', lastName: 'Jones', email: 'bob@law.com',
    specializations: ['overweight'], stateLicenses: ['TX'],
    currentCases: 8, availabilityStatus: 'limited', score: 62.3,
    scoreBreakdown: { specialization: 50, stateLicense: 100, workload: 84, successRate: 50, availability: 60 },
  },
];

const MOCK_DIALOG_DATA = { caseId: 'c1', caseNumber: 'CDL-601' };

describe('AttorneyAssignmentComponent', () => {
  let fixture: ComponentFixture<AttorneyAssignmentComponent>;
  let component: AttorneyAssignmentComponent;
  let caseServiceSpy: {
    getRankedAttorneys: ReturnType<typeof vi.fn>;
    autoAssignCase: ReturnType<typeof vi.fn>;
    manualAssignCase: ReturnType<typeof vi.fn>;
  };
  let dialogRefSpy: { close: ReturnType<typeof vi.fn> };
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    caseServiceSpy = {
      getRankedAttorneys: vi.fn().mockReturnValue(of({ success: true, data: { attorneys: MOCK_ATTORNEYS, total: 2 } })),
      autoAssignCase: vi.fn().mockReturnValue(of({ success: true, data: { assignedAttorney: { name: 'Alice Smith' } } })),
      manualAssignCase: vi.fn().mockReturnValue(of({ success: true, data: { assignedAttorney: { name: 'Bob Jones' } } })),
    };

    dialogRefSpy = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AttorneyAssignmentComponent, NoopAnimationsModule],
      providers: [
        { provide: CaseService, useValue: caseServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: MOCK_DIALOG_DATA },
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AttorneyAssignmentComponent);
    component = fixture.componentInstance;

    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    snackBarSpy = vi.spyOn(snackBar, 'open').mockReturnValue(null as any);

    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ----------------------------------------------------------------
  // Loading & Data
  // ----------------------------------------------------------------
  it('loads ranked attorneys on init', () => {
    expect(caseServiceSpy.getRankedAttorneys).toHaveBeenCalledWith('c1');
  });

  it('sets loading to false after data loads', () => {
    expect(component.loading()).toBe(false);
  });

  it('populates attorneys signal with ranked list', () => {
    expect(component.attorneys()).toHaveLength(2);
    expect(component.attorneys()[0].userId).toBe('a1');
    expect(component.attorneys()[0].score).toBe(87.5);
  });

  // ----------------------------------------------------------------
  // Rendered list
  // ----------------------------------------------------------------
  it('renders attorney rows with name and score', () => {
    const el = fixture.nativeElement as HTMLElement;
    const rows = el.querySelectorAll('.attorney-row');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Alice');
    expect(rows[0].textContent).toContain('Smith');
  });

  it('renders rank badges', () => {
    const el = fixture.nativeElement as HTMLElement;
    const badges = el.querySelectorAll('.rank-badge');
    expect(badges.length).toBe(2);
    expect(badges[0].textContent).toContain('#1');
    expect(badges[1].textContent).toContain('#2');
  });

  it('renders specialization chips', () => {
    const el = fixture.nativeElement as HTMLElement;
    const chips = el.querySelectorAll('.spec-chip');
    expect(chips.length).toBeGreaterThanOrEqual(2); // Alice has 2 specs
  });

  it('renders auto-assign button', () => {
    const el = fixture.nativeElement as HTMLElement;
    const autoBtn = el.querySelector('.auto-btn');
    expect(autoBtn).toBeTruthy();
  });

  // ----------------------------------------------------------------
  // Score styling
  // ----------------------------------------------------------------
  it('getScoreClass returns correct class based on score', () => {
    expect(component.getScoreClass(87)).toBe('score-high');
    expect(component.getScoreClass(55)).toBe('score-medium');
    expect(component.getScoreClass(25)).toBe('score-low');
  });

  it('getScoreTooltip returns breakdown string', () => {
    const tooltip = component.getScoreTooltip(MOCK_ATTORNEYS[0]);
    expect(tooltip).toContain('Specialization');
    expect(tooltip).toContain('State License');
    expect(tooltip).toContain('Workload');
  });

  // ----------------------------------------------------------------
  // Selection
  // ----------------------------------------------------------------
  it('selectAttorney sets selectedAttorneyId', () => {
    component.selectAttorney('a2');
    expect(component.selectedAttorneyId()).toBe('a2');
  });

  it('getSelectedAttorneyName returns correct name', () => {
    component.selectAttorney('a1');
    expect(component.getSelectedAttorneyName()).toContain('Alice');
  });

  // ----------------------------------------------------------------
  // Auto-assign
  // ----------------------------------------------------------------
  it('autoAssign calls service and closes dialog on success', () => {
    component.autoAssign();
    expect(caseServiceSpy.autoAssignCase).toHaveBeenCalledWith('c1');
    expect(dialogRefSpy.close).toHaveBeenCalledWith(
      expect.objectContaining({ assigned: true, attorneyName: 'Alice Smith' })
    );
  });

  it('autoAssign shows snackbar on success', () => {
    component.autoAssign();
    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining('Alice Smith'),
      expect.anything(),
      expect.any(Object)
    );
  });

  it('autoAssign shows no-attorneys message on 404', () => {
    caseServiceSpy.autoAssignCase.mockReturnValue(throwError(() => ({ error: { error: 'No attorneys available at this time' } })));
    component.autoAssign();
    expect(component.noAttorneys()).toBe(true);
  });

  it('autoAssign shows error snackbar on generic failure', () => {
    caseServiceSpy.autoAssignCase.mockReturnValue(throwError(() => ({ error: { error: 'Server error' } })));
    component.autoAssign();
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Server error',
      expect.anything(),
      expect.any(Object)
    );
  });

  // ----------------------------------------------------------------
  // Manual assign
  // ----------------------------------------------------------------
  it('confirmManualAssign calls service with selected attorney', () => {
    component.selectAttorney('a2');
    component.confirmManualAssign();
    expect(caseServiceSpy.manualAssignCase).toHaveBeenCalledWith('c1', 'a2');
  });

  it('confirmManualAssign closes dialog on success', () => {
    component.selectAttorney('a2');
    component.confirmManualAssign();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(
      expect.objectContaining({ assigned: true, attorneyName: 'Bob Jones' })
    );
  });

  it('confirmManualAssign does nothing without selection', () => {
    component.confirmManualAssign();
    expect(caseServiceSpy.manualAssignCase).not.toHaveBeenCalled();
  });

  it('confirmManualAssign shows error snackbar on failure', () => {
    caseServiceSpy.manualAssignCase.mockReturnValue(throwError(() => ({ error: { error: 'Attorney is not active' } })));
    component.selectAttorney('a2');
    component.confirmManualAssign();
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Attorney is not active',
      expect.anything(),
      expect.any(Object)
    );
  });

  // ----------------------------------------------------------------
  // Empty state
  // ----------------------------------------------------------------
  it('shows empty state when no attorneys returned', () => {
    caseServiceSpy.getRankedAttorneys.mockReturnValue(of({ success: true, data: { attorneys: [], total: 0 } }));
    component.loadAttorneys();
    fixture.detectChanges();
    expect(component.noAttorneys()).toBe(true);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty-state')).toBeTruthy();
  });

  // ----------------------------------------------------------------
  // Error state
  // ----------------------------------------------------------------
  it('sets error when loadAttorneys API fails', () => {
    caseServiceSpy.getRankedAttorneys.mockReturnValue(throwError(() => ({ error: { error: 'Network error' } })));
    component.loadAttorneys();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });

  it('displays error container when error is set', () => {
    caseServiceSpy.getRankedAttorneys.mockReturnValue(throwError(() => new Error('fail')));
    component.loadAttorneys();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.error-container')).toBeTruthy();
  });
});
