/**
 * Tests for OperatorDashboardComponent — Sprint 003 Story 7.8
 */
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OperatorDashboardComponent } from './operator-dashboard.component';
import { CaseService } from '../../../core/services/case.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const MOCK_CASES_RESPONSE = {
  cases: [
    { id: 'c1', case_number: 'CDL-001', customer_name: 'John Doe',
      violation_type: 'speeding', state: 'CA', ageHours: 5, status: 'new' },
    { id: 'c2', case_number: 'CDL-002', customer_name: 'Jane Roe',
      violation_type: 'parking', state: 'TX', ageHours: 30, status: 'new' },
  ],
  summary: { newCount: 2, avgAgeHours: 17, assignedToday: 3 },
};

const MOCK_ATTORNEYS = {
  attorneys: [
    { id: 'a1', fullName: 'Alice Smith', email: 'alice@law.com', specializations: [], jurisdictions: [], activeCount: 2 },
    { id: 'a2', fullName: 'Bob Jones', email: 'bob@law.com', specializations: [], jurisdictions: [], activeCount: 0 },
  ],
};

describe('OperatorDashboardComponent', () => {
  let fixture: ComponentFixture<OperatorDashboardComponent>;
  let component: OperatorDashboardComponent;
  let caseServiceSpy: jest.Mocked<Partial<CaseService>>;
  let routerSpy: { navigate: jest.Mock };
  let snackBarSpy: { open: jest.Mock };

  beforeEach(async () => {
    caseServiceSpy = {
      getOperatorCases: jest.fn().mockReturnValue(of(MOCK_CASES_RESPONSE)),
      getAvailableAttorneys: jest.fn().mockReturnValue(of(MOCK_ATTORNEYS)),
      assignToAttorney: jest.fn().mockReturnValue(of({ message: 'Assigned' })),
    };

    routerSpy = { navigate: jest.fn() };
    snackBarSpy = { open: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [OperatorDashboardComponent, NoopAnimationsModule],
      providers: [
        { provide: CaseService, useValue: caseServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
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
    caseServiceSpy.getOperatorCases!.mockReturnValue(throwError(() => new Error('DB error')));
    component.load();
    expect(component.loading()).toBe(false);
  });

  // ----------------------------------------------------------------
  // openAssign / cancelAssign
  // ----------------------------------------------------------------
  it('openAssign() sets selectedCaseId and resets form', () => {
    component.selectedAttorneyId = 'old-id';
    component.attorneyPrice = '999';
    component.openAssign('case-1');

    expect(component.selectedCaseId()).toBe('case-1');
    expect(component.selectedAttorneyId).toBe('');
    expect(component.attorneyPrice).toBe('');
  });

  it('cancelAssign() clears selectedCaseId', () => {
    component.openAssign('case-1');
    component.cancelAssign();
    expect(component.selectedCaseId()).toBeNull();
  });

  // ----------------------------------------------------------------
  // confirmAssign()
  // ----------------------------------------------------------------
  it('confirmAssign() calls assignToAttorney and reloads on success', fakeAsync(() => {
    component.openAssign('case-1');
    component.selectedAttorneyId = 'a1';
    component.attorneyPrice = '450';

    component.confirmAssign();
    tick();

    expect(caseServiceSpy.assignToAttorney).toHaveBeenCalledWith('case-1', 'a1', 450);
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      expect.stringContaining('success'),
      expect.anything(),
      expect.any(Object)
    );
    expect(component.selectedCaseId()).toBeNull();
    expect(component.assigning()).toBe(false);
  }));

  it('confirmAssign() shows error snackbar on price invalid', () => {
    component.openAssign('case-1');
    component.selectedAttorneyId = 'a1';
    component.attorneyPrice = '-100';

    component.confirmAssign();

    expect(caseServiceSpy.assignToAttorney).not.toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      expect.stringContaining('fee'),
      expect.anything(),
      expect.any(Object)
    );
  });

  it('confirmAssign() does nothing when no case or attorney selected', () => {
    component.confirmAssign();
    expect(caseServiceSpy.assignToAttorney).not.toHaveBeenCalled();
  });

  it('confirmAssign() shows error snackbar when service fails', fakeAsync(() => {
    caseServiceSpy.assignToAttorney!.mockReturnValue(throwError(() => new Error('Failed')));
    component.openAssign('case-1');
    component.selectedAttorneyId = 'a1';
    component.attorneyPrice = '450';

    component.confirmAssign();
    tick();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed'),
      expect.anything(),
      expect.any(Object)
    );
    expect(component.assigning()).toBe(false);
  }));

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
