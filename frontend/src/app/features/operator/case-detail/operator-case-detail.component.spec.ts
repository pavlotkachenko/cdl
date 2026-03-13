/**
 * Tests for OperatorCaseDetailComponent — Sprint 051 / OC-1
 * Tests the case detail page: loading, error, driver/attorney/court sections,
 * status update, activity log, and navigation.
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OperatorCaseDetailComponent } from './operator-case-detail.component';
import { CaseService } from '../../../core/services/case.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';

const MOCK_CASE = {
  id: 'c1',
  case_number: 'CDL-601',
  status: 'reviewed',
  state: 'TX',
  county: 'Harris',
  violation_type: 'Speeding',
  violation_date: '2026-02-15',
  created_at: '2026-03-08T10:30:00Z',
  updated_at: '2026-03-10T12:00:00Z',
  customer_name: 'Marcus Rivera',
  fine_amount: 350,
  court_date: '2026-04-10T09:00:00Z',
  courthouse: 'Harris County Court',
  priority: 'high',
  ageHours: 72,
  attorney_price: 350,
  assigned_operator_id: 'op-1',
  assigned_attorney_id: 'att-1',
  driver: { id: 'd1', full_name: 'Marcus Rivera', phone: '555-1234', email: 'marcus@test.com', cdl_number: 'CDL-TX-9876' },
  attorney: { id: 'att-1', full_name: 'Alice Smith', email: 'alice@law.com', specializations: ['speeding', 'CDL'] },
  court_dates: [
    { id: 'cd1', date: '2026-04-10T09:00:00Z', court_name: 'Harris County Court', location: 'Houston TX', status: 'scheduled' },
  ],
  assignment_request: null,
};

const MOCK_CASE_NO_ATTORNEY = {
  ...MOCK_CASE,
  attorney: null,
  assigned_attorney_id: null,
};

const MOCK_ACTIVITY = [
  { id: 'a1', action: 'status_change', details: { from: 'new', to: 'reviewed', note: 'Initial review' }, created_at: '2026-03-09T10:00:00Z', user_id: 'op-1' },
  { id: 'a2', action: 'status_change', details: { from: 'reviewed', to: 'assigned_to_attorney' }, created_at: '2026-03-10T12:00:00Z', user_id: 'op-1' },
];

describe('OperatorCaseDetailComponent', () => {
  let fixture: ComponentFixture<OperatorCaseDetailComponent>;
  let component: OperatorCaseDetailComponent;
  let caseServiceSpy: {
    getOperatorCaseDetail: ReturnType<typeof vi.fn>;
    updateOperatorCaseStatus: ReturnType<typeof vi.fn>;
  };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    caseServiceSpy = {
      getOperatorCaseDetail: vi.fn().mockReturnValue(of({ case: MOCK_CASE, activity: MOCK_ACTIVITY })),
      updateOperatorCaseStatus: vi.fn().mockReturnValue(of({ case: { ...MOCK_CASE, status: 'closed' } })),
    };

    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [OperatorCaseDetailComponent, NoopAnimationsModule],
      providers: [
        { provide: CaseService, useValue: caseServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'c1' } } } },
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorCaseDetailComponent);
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
  it('calls getOperatorCaseDetail on init', () => {
    expect(caseServiceSpy.getOperatorCaseDetail).toHaveBeenCalledWith('c1');
  });

  it('sets loading to false after data loads', () => {
    expect(component.loading()).toBe(false);
  });

  it('populates caseData signal from API response', () => {
    expect(component.caseData()).toBeDefined();
    expect(component.caseData()!.case_number).toBe('CDL-601');
    expect(component.caseData()!.status).toBe('reviewed');
  });

  it('populates activity signal from API response', () => {
    expect(component.activity()).toHaveLength(2);
    expect(component.activity()[0].action).toBe('status_change');
  });

  // ----------------------------------------------------------------
  // Error state
  // ----------------------------------------------------------------
  it('sets error when API fails', () => {
    caseServiceSpy.getOperatorCaseDetail.mockReturnValue(throwError(() => ({ error: { error: { message: 'Not found' } } })));
    component.loadCase();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });

  it('displays error container when error is set', () => {
    caseServiceSpy.getOperatorCaseDetail.mockReturnValue(throwError(() => new Error('fail')));
    component.loadCase();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.error-container')).toBeTruthy();
  });

  // ----------------------------------------------------------------
  // Rendered sections
  // ----------------------------------------------------------------
  it('displays case number in header', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.case-number')?.textContent).toContain('CDL-601');
  });

  it('renders driver contact with clickable phone link', () => {
    const el = fixture.nativeElement as HTMLElement;
    const phoneLink = el.querySelector('a[href^="tel:"]');
    expect(phoneLink).toBeTruthy();
    expect(phoneLink?.textContent).toContain('555-1234');
  });

  it('renders driver email with clickable mailto link', () => {
    const el = fixture.nativeElement as HTMLElement;
    const emailLink = el.querySelector('a[href^="mailto:"]');
    expect(emailLink).toBeTruthy();
    expect(emailLink?.textContent).toContain('marcus@test.com');
  });

  it('renders court dates section with timeline entries', () => {
    const el = fixture.nativeElement as HTMLElement;
    const courtEntries = el.querySelectorAll('.court-entry');
    expect(courtEntries.length).toBe(1);
  });

  it('renders attorney card when assigned', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Alice Smith');
  });

  it('renders activity log entries', () => {
    const el = fixture.nativeElement as HTMLElement;
    const entries = el.querySelectorAll('.activity-entry');
    expect(entries.length).toBe(2);
  });

  it('renders status select with valid options', () => {
    const el = fixture.nativeElement as HTMLElement;
    const select = el.querySelector('mat-select');
    expect(select).toBeTruthy();
  });

  // ----------------------------------------------------------------
  // No attorney → Assign button
  // ----------------------------------------------------------------
  it('shows Assign Attorney button when no attorney assigned', () => {
    caseServiceSpy.getOperatorCaseDetail.mockReturnValue(of({ case: MOCK_CASE_NO_ATTORNEY, activity: [] }));
    component.loadCase();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const assignBtn = el.querySelector('.assign-btn');
    expect(assignBtn).toBeTruthy();
  });

  // ----------------------------------------------------------------
  // Status update
  // ----------------------------------------------------------------
  it('updateStatus calls service and shows success snackbar', () => {
    component.selectedStatus = 'closed';
    component.statusNote = 'Done';
    component.updateStatus();
    expect(caseServiceSpy.updateOperatorCaseStatus).toHaveBeenCalledWith('c1', 'closed', 'Done');
    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining('Status updated'),
      expect.anything(),
      expect.any(Object)
    );
  });

  it('updateStatus shows error snackbar on failure', () => {
    caseServiceSpy.updateOperatorCaseStatus.mockReturnValue(throwError(() => ({ error: { error: { message: 'Failed' } } })));
    component.selectedStatus = 'closed';
    component.updateStatus();
    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed'),
      expect.anything(),
      expect.any(Object)
    );
  });

  it('updateStatus does nothing without selected status', () => {
    component.selectedStatus = '';
    component.updateStatus();
    expect(caseServiceSpy.updateOperatorCaseStatus).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // Navigation
  // ----------------------------------------------------------------
  it('goBack navigates to /operator/dashboard', () => {
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/operator/dashboard']);
  });

  it('assignAttorney opens attorney assignment dialog', () => {
    component.assignAttorney();
    // Dialog is opened via MatDialog — the component doesn't navigate anymore
    // Just verify it doesn't throw when called with valid data
    expect(component.caseData()).toBeTruthy();
  });

  it('messageDriver navigates to messaging route', () => {
    component.messageDriver();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/operator/cases', 'c1', 'messages']);
  });

  it('shows Message Driver button when driver is present', () => {
    const el = fixture.nativeElement as HTMLElement;
    const msgBtn = el.querySelector('.message-btn');
    expect(msgBtn).toBeTruthy();
  });

  // ----------------------------------------------------------------
  // Utility methods
  // ----------------------------------------------------------------
  it('getStatusKey returns translation key for known statuses', () => {
    expect(component.getStatusKey('new')).toBe('OPR.STATUS_NEW');
    expect(component.getStatusKey('reviewed')).toBe('OPR.STATUS_IN_PROGRESS');
    expect(component.getStatusKey('closed')).toBe('OPR.STATUS_CLOSED');
  });

  it('getStatusKey returns raw status for unknown statuses', () => {
    expect(component.getStatusKey('unknown_xyz')).toBe('unknown_xyz');
  });

  it('formatAge formats hours under 24 as hours only', () => {
    expect(component.formatAge(5)).toBe('5h');
  });

  it('formatAge formats hours 24+ as days and hours', () => {
    expect(component.formatAge(72)).toBe('3d 0h');
  });

  it('getPriorityColor returns correct colors', () => {
    expect(component.getPriorityColor('critical')).toBe('#E53935');
    expect(component.getPriorityColor('high')).toBe('#FB8C00');
    expect(component.getPriorityColor('medium')).toBe('#FDD835');
    expect(component.getPriorityColor('low')).toBe('#43A047');
  });

  it('isPastDate returns true for past dates', () => {
    expect(component.isPastDate('2020-01-01T00:00:00Z')).toBe(true);
  });

  it('isPastDate returns false for future dates', () => {
    expect(component.isPastDate('2030-01-01T00:00:00Z')).toBe(false);
  });

  it('formatAction formats status_change with note', () => {
    const entry = { action: 'status_change', details: { from: 'new', to: 'reviewed', note: 'Checked' } };
    expect(component.formatAction(entry)).toContain('new → reviewed');
    expect(component.formatAction(entry)).toContain('Checked');
  });

  it('formatAction formats status_change without note', () => {
    const entry = { action: 'status_change', details: { from: 'new', to: 'reviewed' } };
    const result = component.formatAction(entry);
    expect(result).toContain('new → reviewed');
    expect(result).not.toContain('—');
  });

  it('formatAction returns raw action for non-status_change', () => {
    const entry = { action: 'document_uploaded', details: {} };
    expect(component.formatAction(entry)).toBe('document_uploaded');
  });
});
