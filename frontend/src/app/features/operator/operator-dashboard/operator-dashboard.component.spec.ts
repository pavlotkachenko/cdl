/**
 * Tests for OperatorDashboardComponent — Sprint 003 Story 7.8 + Sprint 016
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { OperatorDashboardComponent } from './operator-dashboard.component';
import { CaseService } from '../../../core/services/case.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const MOCK_CASES_RESPONSE = {
  cases: [
    { id: 'c1', case_number: 'CDL-001', customer_name: 'John Doe',
      violation_type: 'speeding', state: 'CA', age_hours: 5, status: 'new' },
    { id: 'c2', case_number: 'CDL-002', customer_name: 'Jane Roe',
      violation_type: 'parking', state: 'TX', age_hours: 50, status: 'new' },
  ],
  summary: { newCount: 2, avgAgeHours: 17, assignedToday: 3 },
};

const MOCK_ATTORNEYS = {
  attorneys: [
    { id: 'a1', full_name: 'Alice Smith', email: 'alice@law.com' },
    { id: 'a2', full_name: 'Bob Jones', email: 'bob@law.com' },
  ],
};

describe('OperatorDashboardComponent', () => {
  let fixture: ComponentFixture<OperatorDashboardComponent>;
  let component: OperatorDashboardComponent;
  let caseServiceSpy: {
    getOperatorCases: ReturnType<typeof vi.fn>;
    getAvailableAttorneys: ReturnType<typeof vi.fn>;
    assignToAttorney: ReturnType<typeof vi.fn>;
  };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    caseServiceSpy = {
      getOperatorCases: vi.fn().mockReturnValue(of(MOCK_CASES_RESPONSE)),
      getAvailableAttorneys: vi.fn().mockReturnValue(of(MOCK_ATTORNEYS)),
      assignToAttorney: vi.fn().mockReturnValue(of({ message: 'Assigned' })),
    };

    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [OperatorDashboardComponent, NoopAnimationsModule],
      providers: [
        { provide: CaseService, useValue: caseServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorDashboardComponent);
    component = fixture.componentInstance;

    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    snackBarSpy = vi.spyOn(snackBar, 'open').mockReturnValue(null as any);

    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ----------------------------------------------------------------
  // Initialisation
  // ----------------------------------------------------------------
  it('loads cases and attorneys on init', () => {
    expect(caseServiceSpy.getOperatorCases).toHaveBeenCalledWith('new');
    expect(caseServiceSpy.getAvailableAttorneys).toHaveBeenCalled();
    expect(component.cases()).toHaveLength(2);
    expect(component.attorneys()).toHaveLength(2);
  });

  it('populates summary metrics', () => {
    const s = component.summary();
    expect(s.newCount).toBe(2);
    expect(s.avgAgeHours).toBe(17);
    expect(s.assignedToday).toBe(3);
  });

  it('sets loading to false after data loads', () => {
    expect(component.loading()).toBe(false);
  });

  // ----------------------------------------------------------------
  // load()
  // ----------------------------------------------------------------
  it('load() calls getOperatorCases again on refresh', () => {
    component.load();
    expect(caseServiceSpy.getOperatorCases).toHaveBeenCalledTimes(2);
  });

  it('load() handles errors gracefully', () => {
    caseServiceSpy.getOperatorCases.mockReturnValue(throwError(() => new Error('DB error')));
    component.load();
    expect(component.loading()).toBe(false);
  });

  // ----------------------------------------------------------------
  // Status filter
  // ----------------------------------------------------------------
  it('setStatusFilter updates statusFilter and reloads', () => {
    component.setStatusFilter('under_review');
    expect(component.statusFilter()).toBe('under_review');
    expect(caseServiceSpy.getOperatorCases).toHaveBeenCalledWith('under_review');
  });

  it('setStatusFilter clears selection', () => {
    component.toggleSelect('c1');
    component.setStatusFilter('waiting_for_driver');
    expect(component.selectedCount()).toBe(0);
  });

  // ----------------------------------------------------------------
  // openAssign / cancelAssign
  // ----------------------------------------------------------------
  it('openAssign() sets selectedCaseId and resets form', () => {
    component.selectedAttorneyId.set('old-id');
    component.attorneyPrice.set('999');
    component.openAssign('case-1');

    expect(component.selectedCaseId()).toBe('case-1');
    expect(component.selectedAttorneyId()).toBe('');
    expect(component.attorneyPrice()).toBe('');
  });

  it('cancelAssign() clears selectedCaseId', () => {
    component.openAssign('case-1');
    component.cancelAssign();
    expect(component.selectedCaseId()).toBeNull();
  });

  // ----------------------------------------------------------------
  // confirmAssign()
  // ----------------------------------------------------------------
  it('confirmAssign() calls assignToAttorney and reloads on success', () => {
    component.openAssign('case-1');
    component.selectedAttorneyId.set('a1');
    component.attorneyPrice.set('450');

    component.confirmAssign();

    expect(caseServiceSpy.assignToAttorney).toHaveBeenCalledWith('case-1', 'a1', 450);
    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining('success'),
      expect.anything(),
      expect.any(Object)
    );
    expect(component.selectedCaseId()).toBeNull();
    expect(component.assigning()).toBe(false);
  });

  it('confirmAssign() shows error snackbar on price invalid', () => {
    component.openAssign('case-1');
    component.selectedAttorneyId.set('a1');
    component.attorneyPrice.set('-100');

    component.confirmAssign();

    expect(caseServiceSpy.assignToAttorney).not.toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining('fee'),
      expect.anything(),
      expect.any(Object)
    );
  });

  it('confirmAssign() does nothing when no case or attorney selected', () => {
    component.confirmAssign();
    expect(caseServiceSpy.assignToAttorney).not.toHaveBeenCalled();
  });

  it('confirmAssign() shows error snackbar when service fails', () => {
    caseServiceSpy.assignToAttorney.mockReturnValue(throwError(() => new Error('Failed')));
    component.openAssign('case-1');
    component.selectedAttorneyId.set('a1');
    component.attorneyPrice.set('450');

    component.confirmAssign();

    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed'),
      expect.anything(),
      expect.any(Object)
    );
    expect(component.assigning()).toBe(false);
  });

  // ----------------------------------------------------------------
  // Bulk selection
  // ----------------------------------------------------------------
  it('toggleSelect adds a case to selection', () => {
    component.toggleSelect('c1');
    expect(component.selectedCaseIds().has('c1')).toBe(true);
    expect(component.selectedCount()).toBe(1);
  });

  it('toggleSelect removes an already-selected case', () => {
    component.toggleSelect('c1');
    component.toggleSelect('c1');
    expect(component.selectedCaseIds().has('c1')).toBe(false);
    expect(component.selectedCount()).toBe(0);
  });

  it('toggleAll selects all loaded cases', () => {
    component.toggleAll();
    expect(component.allSelected()).toBe(true);
    expect(component.selectedCount()).toBe(2);
  });

  it('toggleAll deselects all when all are already selected', () => {
    component.toggleAll(); // select all
    component.toggleAll(); // deselect all
    expect(component.selectedCount()).toBe(0);
    expect(component.allSelected()).toBe(false);
  });

  it('someSelected is true when a subset is selected', () => {
    component.toggleSelect('c1');
    expect(component.someSelected()).toBe(true);
    expect(component.allSelected()).toBe(false);
  });

  it('clearSelection deselects all', () => {
    component.toggleAll();
    component.clearSelection();
    expect(component.selectedCount()).toBe(0);
  });

  // ----------------------------------------------------------------
  // Bulk assign
  // ----------------------------------------------------------------
  it('bulkAssign calls assignToAttorney for each selected case', () => {
    component.toggleAll();
    component.bulkAttorneyId.set('a1');
    component.bulkPrice.set('350');

    component.bulkAssign();

    expect(caseServiceSpy.assignToAttorney).toHaveBeenCalledTimes(2);
    expect(caseServiceSpy.assignToAttorney).toHaveBeenCalledWith('c1', 'a1', 350);
    expect(caseServiceSpy.assignToAttorney).toHaveBeenCalledWith('c2', 'a1', 350);
  });

  it('bulkAssign clears selection and resets form on success', () => {
    component.toggleAll();
    component.bulkAttorneyId.set('a1');
    component.bulkPrice.set('350');

    component.bulkAssign();

    expect(component.selectedCount()).toBe(0);
    expect(component.bulkAttorneyId()).toBe('');
    expect(component.bulkPrice()).toBe('');
    expect(component.bulkAssigning()).toBe(false);
  });

  it('bulkAssign shows success snackBar with count', () => {
    component.toggleAll();
    component.bulkAttorneyId.set('a1');
    component.bulkPrice.set('350');

    component.bulkAssign();

    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining('2 case(s)'),
      expect.anything(),
      expect.any(Object)
    );
  });

  it('bulkAssign shows error snackbar on invalid price', () => {
    component.toggleSelect('c1');
    component.bulkAttorneyId.set('a1');
    component.bulkPrice.set('0');

    component.bulkAssign();

    expect(caseServiceSpy.assignToAttorney).not.toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining('fee'),
      expect.anything(),
      expect.any(Object)
    );
  });

  it('bulkAssign does nothing when no cases are selected', () => {
    component.bulkAttorneyId.set('a1');
    component.bulkPrice.set('350');
    component.bulkAssign();
    expect(caseServiceSpy.assignToAttorney).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // Priority badges
  // ----------------------------------------------------------------
  it('getAgePriority returns urgent for 48+ hours', () => {
    expect(component.getAgePriority(48)).toBe('urgent');
    expect(component.getAgePriority(72)).toBe('urgent');
  });

  it('getAgePriority returns warning for 24-47 hours', () => {
    expect(component.getAgePriority(24)).toBe('warning');
    expect(component.getAgePriority(47)).toBe('warning');
  });

  it('getAgePriority returns empty string for under 24 hours', () => {
    expect(component.getAgePriority(5)).toBe('');
    expect(component.getAgePriority(0)).toBe('');
  });

  // ----------------------------------------------------------------
  // formatAge()
  // ----------------------------------------------------------------
  it('formatAge formats hours under 24 as hours', () => {
    expect(component.formatAge(5)).toBe('5h');
    expect(component.formatAge(0)).toBe('0h');
  });

  it('formatAge formats hours 24+ as days and hours', () => {
    expect(component.formatAge(25)).toBe('1d 1h');
    expect(component.formatAge(48)).toBe('2d 0h');
    expect(component.formatAge(50)).toBe('2d 2h');
  });
});
