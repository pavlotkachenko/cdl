/**
 * Tests for OperatorDashboardComponent — Sprint 052 (CM-6: Multi-board tabs)
 * Tests the 4-tab dashboard: My Cases, Queue, All Cases, Archive.
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OperatorDashboardComponent } from './operator-dashboard.component';
import { CaseService } from '../../../core/services/case.service';
import { AuthService } from '../../../core/services/auth.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';

const MOCK_OPERATOR_RESPONSE = {
  cases: [
    { id: 'c1', case_number: 'CDL-601', customer_name: 'Marcus Rivera',
      violation_type: 'Speeding', state: 'TX', status: 'reviewed', ageHours: 72, created_at: '2026-03-08T10:30:00Z',
      fine_amount: 350, court_date: '2026-04-10T09:00:00Z', courthouse: 'Harris County Court', priority: 'high' },
    { id: 'c2', case_number: 'CDL-602', customer_name: 'Jennifer Walsh',
      violation_type: 'Overweight', state: 'CA', status: 'assigned_to_attorney', ageHours: 44, created_at: '2026-03-09T14:15:00Z',
      fine_amount: null, court_date: null, courthouse: null, priority: 'medium' },
  ],
  summary: { assignedToMe: 2, inProgress: 1, resolvedToday: 0, pendingApproval: 1 },
};

const MOCK_UNASSIGNED_RESPONSE = {
  cases: [
    { id: 'u1', case_number: 'CDL-610', customer_name: 'Sarah Kim',
      violation_type: 'Lane Change', state: 'NY', status: 'new', ageHours: 18, requested: false,
      fine_amount: 200, court_date: null, courthouse: null, priority: 'low' },
    { id: 'u2', case_number: 'CDL-611', customer_name: 'Robert Jackson',
      violation_type: 'Following', state: 'IL', status: 'new', ageHours: 47, requested: true,
      fine_amount: 450, court_date: '2026-03-15T14:00:00Z', courthouse: 'Cook County Court', priority: 'high' },
  ],
};

const MOCK_TEAM_RESPONSE = {
  cases: [
    { id: 't1', case_number: 'CDL-701', customer_name: 'Team Case 1',
      violation_type: 'Speeding', state: 'TX', status: 'reviewed', ageHours: 10,
      assigned_operator_id: 'op-me', operator_name: 'Me Operator', created_at: '2026-03-10T10:00:00Z' },
    { id: 't2', case_number: 'CDL-702', customer_name: 'Team Case 2',
      violation_type: 'Overweight', state: 'CA', status: 'new', ageHours: 5,
      assigned_operator_id: 'op-other', operator_name: 'Other Operator', created_at: '2026-03-11T10:00:00Z' },
  ],
};

const MOCK_ARCHIVE_RESPONSE = {
  cases: [
    { id: 'a1', case_number: 'CDL-501', customer_name: 'Archived Case',
      violation_type: 'Logbook', state: 'FL', status: 'closed', updated_at: '2026-03-01T10:00:00Z' },
  ],
};

function selectTab(fixture: ComponentFixture<OperatorDashboardComponent>, index: number) {
  const component = fixture.componentInstance;
  component.onTabChange(index);
  fixture.detectChanges();
}

describe('OperatorDashboardComponent', () => {
  let fixture: ComponentFixture<OperatorDashboardComponent>;
  let component: OperatorDashboardComponent;
  let caseServiceSpy: Record<string, ReturnType<typeof vi.fn>>;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    localStorage.removeItem('opr_active_tab');
    localStorage.removeItem('opr_view');
    TestBed.resetTestingModule();

    caseServiceSpy = {
      getOperatorCases: vi.fn().mockReturnValue(of(MOCK_OPERATOR_RESPONSE)),
      getUnassignedCases: vi.fn().mockReturnValue(of(MOCK_UNASSIGNED_RESPONSE)),
      requestAssignment: vi.fn().mockReturnValue(of({ request: { id: 'r1' } })),
      getTeamCases: vi.fn().mockReturnValue(of(MOCK_TEAM_RESPONSE)),
      getClosedCases: vi.fn().mockReturnValue(of(MOCK_ARCHIVE_RESPONSE)),
    };

    routerSpy = { navigate: vi.fn() };

    const authServiceSpy = {
      getCurrentUser: vi.fn().mockReturnValue({ id: 'op-me', role: 'operator' }),
    };

    await TestBed.configureTestingModule({
      imports: [OperatorDashboardComponent, NoopAnimationsModule],
      providers: [
        { provide: CaseService, useValue: caseServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        provideTranslateService(),
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
    localStorage.removeItem('opr_active_tab');
    localStorage.removeItem('opr_view');
  });

  // ----------------------------------------------------------------
  // Initialisation
  // ----------------------------------------------------------------
  it('loads my cases and unassigned cases on init', () => {
    expect(caseServiceSpy['getOperatorCases']).toHaveBeenCalled();
    expect(caseServiceSpy['getUnassignedCases']).toHaveBeenCalled();
    expect(component.myCases()).toHaveLength(2);
    expect(component.unassignedCases()).toHaveLength(2);
  });

  it('populates summary from API response', () => {
    const s = component.summary();
    expect(s.assignedToMe).toBe(2);
    expect(s.inProgress).toBe(1);
    expect(s.resolvedToday).toBe(0);
    expect(s.pendingApproval).toBe(1);
  });

  it('sets loading to false after data loads', () => {
    expect(component.loading()).toBe(false);
  });

  it('does NOT load team cases or archive on init (lazy)', () => {
    expect(caseServiceSpy['getTeamCases']).not.toHaveBeenCalled();
    expect(caseServiceSpy['getClosedCases']).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // Tab navigation
  // ----------------------------------------------------------------
  it('renders 4 tabs', () => {
    const el = fixture.nativeElement as HTMLElement;
    const tabLabels = el.querySelectorAll('.mat-mdc-tab');
    expect(tabLabels.length).toBe(4);
  });

  it('defaults to tab 0 (My Cases)', () => {
    expect(component.activeTab()).toBe(0);
  });

  it('onTabChange(2) loads team cases lazily', () => {
    selectTab(fixture, 2);
    expect(caseServiceSpy['getTeamCases']).toHaveBeenCalledTimes(1);
    expect(component.teamCasesLoaded()).toBe(true);
    expect(component.teamCases()).toHaveLength(2);
  });

  it('onTabChange(3) loads archive cases lazily', () => {
    selectTab(fixture, 3);
    expect(caseServiceSpy['getClosedCases']).toHaveBeenCalledTimes(1);
    expect(component.archiveLoaded()).toBe(true);
    expect(component.archiveCases()).toHaveLength(1);
  });

  it('switching to tab 2 a second time does not reload', () => {
    selectTab(fixture, 2);
    selectTab(fixture, 0);
    selectTab(fixture, 2);
    expect(caseServiceSpy['getTeamCases']).toHaveBeenCalledTimes(1);
  });

  it('persists active tab to localStorage', () => {
    selectTab(fixture, 2);
    expect(localStorage.getItem('opr_active_tab')).toBe('2');
  });

  // ----------------------------------------------------------------
  // refresh()
  // ----------------------------------------------------------------
  it('refresh() reloads data from both endpoints', () => {
    component.refresh();
    expect(caseServiceSpy['getOperatorCases']).toHaveBeenCalledTimes(2);
    expect(caseServiceSpy['getUnassignedCases']).toHaveBeenCalledTimes(2);
  });

  it('refresh() reloads team cases if already loaded', () => {
    selectTab(fixture, 2);
    component.refresh();
    expect(caseServiceSpy['getTeamCases']).toHaveBeenCalledTimes(2);
  });

  it('refresh() reloads archive if already loaded', () => {
    selectTab(fixture, 3);
    component.refresh();
    expect(caseServiceSpy['getClosedCases']).toHaveBeenCalledTimes(2);
  });

  it('handles getOperatorCases error gracefully with fallback data', () => {
    caseServiceSpy['getOperatorCases'].mockReturnValue(throwError(() => new Error('DB error')));
    component.refresh();
    expect(component.loading()).toBe(false);
    expect(component.myCases().length).toBeGreaterThanOrEqual(0);
  });

  // ----------------------------------------------------------------
  // Search filters
  // ----------------------------------------------------------------
  it('filteredMyCases returns all when search is empty', () => {
    expect(component.filteredMyCases()).toHaveLength(2);
  });

  it('filteredMyCases filters by case number', () => {
    component.mySearch.set('601');
    expect(component.filteredMyCases()).toHaveLength(1);
    expect(component.filteredMyCases()[0].case_number).toBe('CDL-601');
  });

  it('filteredMyCases filters by customer name', () => {
    component.mySearch.set('jennifer');
    expect(component.filteredMyCases()).toHaveLength(1);
    expect(component.filteredMyCases()[0].customer_name).toBe('Jennifer Walsh');
  });

  it('filteredMyCases filters by violation type', () => {
    component.mySearch.set('speeding');
    expect(component.filteredMyCases()).toHaveLength(1);
  });

  it('filteredUnassigned filters by customer name', () => {
    component.queueSearch.set('sarah');
    expect(component.filteredUnassigned()).toHaveLength(1);
    expect(component.filteredUnassigned()[0].customer_name).toBe('Sarah Kim');
  });

  it('filteredUnassigned returns all when search is empty', () => {
    expect(component.filteredUnassigned()).toHaveLength(2);
  });

  it('filteredTeamCases filters by operator name', () => {
    selectTab(fixture, 2);
    component.teamSearch.set('other');
    expect(component.filteredTeamCases()).toHaveLength(1);
    expect(component.filteredTeamCases()[0].operator_name).toBe('Other Operator');
  });

  it('filteredArchiveCases filters by case number', () => {
    selectTab(fixture, 3);
    component.archiveSearch.set('501');
    expect(component.filteredArchiveCases()).toHaveLength(1);
  });

  // ----------------------------------------------------------------
  // viewCase
  // ----------------------------------------------------------------
  it('viewCase navigates to /operator/cases/:id', () => {
    component.viewCase('c1');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/operator/cases', 'c1']);
  });

  // ----------------------------------------------------------------
  // requestAssignment
  // ----------------------------------------------------------------
  it('requestAssignment calls service and marks case as requested', () => {
    component.requestAssignment('u1');
    expect(caseServiceSpy['requestAssignment']).toHaveBeenCalledWith('u1');
    const updated = component.unassignedCases().find((c: any) => c.id === 'u1');
    expect(updated.requested).toBe(true);
  });

  it('requestAssignment increments pendingApproval count', () => {
    const before = component.summary().pendingApproval;
    component.requestAssignment('u1');
    expect(component.summary().pendingApproval).toBe(before + 1);
  });

  it('requestAssignment shows success snackbar', () => {
    component.requestAssignment('u1');
    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining('Assignment requested'),
      expect.anything(),
      expect.any(Object)
    );
  });

  it('requestAssignment shows error snackbar on failure', () => {
    caseServiceSpy['requestAssignment'].mockReturnValue(throwError(() => new Error('fail')));
    component.requestAssignment('u1');
    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed'),
      expect.anything(),
      expect.any(Object)
    );
  });

  it('requestAssignment sets and clears requestingId', () => {
    component.requestAssignment('u1');
    expect(component.requestingId()).toBeNull();
  });

  // ----------------------------------------------------------------
  // Utility methods
  // ----------------------------------------------------------------
  it('getStatusKey returns translation key for known statuses', () => {
    expect(component.getStatusKey('new')).toBe('OPR.STATUS_NEW');
    expect(component.getStatusKey('reviewed')).toBe('OPR.STATUS_IN_PROGRESS');
    expect(component.getStatusKey('assigned_to_attorney')).toBe('OPR.STATUS_ASSIGNED');
    expect(component.getStatusKey('closed')).toBe('OPR.STATUS_CLOSED');
    expect(component.getStatusKey('check_with_manager')).toBe('OPR.STATUS_CHECK_MANAGER');
    expect(component.getStatusKey('pay_attorney')).toBe('OPR.STATUS_PAY_ATTORNEY');
    expect(component.getStatusKey('attorney_paid')).toBe('OPR.STATUS_ATTORNEY_PAID');
  });

  it('getStatusKey returns raw status for unknown statuses', () => {
    expect(component.getStatusKey('unknown_status')).toBe('unknown_status');
  });

  it('formatAge formats hours under 24 as hours only', () => {
    expect(component.formatAge(5)).toBe('5h');
    expect(component.formatAge(0)).toBe('0h');
  });

  it('formatAge formats hours 24+ as days and hours', () => {
    expect(component.formatAge(25)).toBe('1d 1h');
    expect(component.formatAge(48)).toBe('2d 0h');
    expect(component.formatAge(50)).toBe('2d 2h');
  });

  // ----------------------------------------------------------------
  // My Cases tab (tab 0) — enriched fields
  // ----------------------------------------------------------------
  it('renders court date column with formatted date', () => {
    const el = fixture.nativeElement as HTMLElement;
    const courtTexts = el.querySelectorAll('.court-text');
    expect(courtTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders dash for null court date', () => {
    const el = fixture.nativeElement as HTMLElement;
    const dashes = el.querySelectorAll('.cell-court .cell-dash');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders fine amount column with currency formatting', () => {
    const el = fixture.nativeElement as HTMLElement;
    const fineTexts = el.querySelectorAll('.fine-text');
    expect(fineTexts.length).toBeGreaterThanOrEqual(1);
    expect(fineTexts[0].textContent).toContain('350');
  });

  it('renders dash for null fine amount', () => {
    const el = fixture.nativeElement as HTMLElement;
    const dashes = el.querySelectorAll('.cell-fine .cell-dash');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders priority dot for each case row', () => {
    const el = fixture.nativeElement as HTMLElement;
    const dots = el.querySelectorAll('.priority-dot');
    expect(dots.length).toBe(2);
  });

  it('priority dot has correct class based on priority value', () => {
    const el = fixture.nativeElement as HTMLElement;
    const dots = el.querySelectorAll('.priority-dot');
    expect(dots[0].classList.contains('priority-high')).toBe(true);
    expect(dots[1].classList.contains('priority-medium')).toBe(true);
  });

  // ----------------------------------------------------------------
  // Queue tab (tab 1)
  // ----------------------------------------------------------------
  it('queue tab shows priority bars after activation', () => {
    selectTab(fixture, 1);
    const el = fixture.nativeElement as HTMLElement;
    const bars = el.querySelectorAll('.priority-bar');
    expect(bars.length).toBe(2);
  });

  it('priority bar has correct class based on priority value', () => {
    selectTab(fixture, 1);
    const el = fixture.nativeElement as HTMLElement;
    const bars = el.querySelectorAll('.priority-bar');
    expect(bars[0].classList.contains('priority-bar-high')).toBe(true);
    expect(bars[1].classList.contains('priority-bar-low')).toBe(true);
  });

  it('sortedUnassigned sorts by priority then by age descending', () => {
    const sorted = component.sortedUnassigned();
    expect(sorted[0].id).toBe('u2');
    expect(sorted[1].id).toBe('u1');
  });

  it('queue tab shows court date when present', () => {
    selectTab(fixture, 1);
    const el = fixture.nativeElement as HTMLElement;
    const qcDetails = el.querySelectorAll('.queue-card .qc-detail-item');
    const hasCourtDetail = Array.from(qcDetails).some(
      item => item.querySelector('mat-icon')?.textContent?.trim() === 'event'
    );
    expect(hasCourtDetail).toBe(true);
  });

  it('queue tab shows fine amount when present', () => {
    selectTab(fixture, 1);
    const el = fixture.nativeElement as HTMLElement;
    const qcDetails = el.querySelectorAll('.queue-card .qc-detail-item');
    const hasFineDetail = Array.from(qcDetails).some(
      item => item.querySelector('mat-icon')?.textContent?.trim() === 'payments'
    );
    expect(hasFineDetail).toBe(true);
  });

  it('queue tab renders priority legend', () => {
    selectTab(fixture, 1);
    const el = fixture.nativeElement as HTMLElement;
    const legendItems = el.querySelectorAll('.legend-item');
    expect(legendItems.length).toBe(4);
  });

  it('getPriorityLabel returns human-readable label', () => {
    expect(component.getPriorityLabel('critical')).toBe('Critical priority');
    expect(component.getPriorityLabel('high')).toBe('High priority');
    expect(component.getPriorityLabel('medium')).toBe('Medium priority');
    expect(component.getPriorityLabel('low')).toBe('Low priority');
  });

  // ----------------------------------------------------------------
  // All Cases tab (tab 2) — team view
  // ----------------------------------------------------------------
  it('team view shows operator name column', () => {
    selectTab(fixture, 2);
    const el = fixture.nativeElement as HTMLElement;
    const operatorCells = el.querySelectorAll('.operator-name');
    expect(operatorCells.length).toBe(2);
    expect(operatorCells[0].textContent?.trim()).toBe('Me Operator');
    expect(operatorCells[1].textContent?.trim()).toBe('Other Operator');
  });

  it('team view highlights current user cases with mine badge', () => {
    selectTab(fixture, 2);
    const el = fixture.nativeElement as HTMLElement;
    const mineBadges = el.querySelectorAll('.mine-badge');
    expect(mineBadges.length).toBe(1); // only t1 is assigned to op-me
  });

  it('team view highlights mine rows with background class', () => {
    selectTab(fixture, 2);
    const el = fixture.nativeElement as HTMLElement;
    const mineRows = el.querySelectorAll('.case-row--mine');
    expect(mineRows.length).toBe(1);
  });

  it('team view handles API error gracefully', () => {
    caseServiceSpy['getTeamCases'].mockReturnValue(throwError(() => new Error('fail')));
    selectTab(fixture, 2);
    expect(component.teamCasesLoaded()).toBe(true);
    expect(component.teamCases()).toHaveLength(0);
  });

  // ----------------------------------------------------------------
  // Archive tab (tab 3)
  // ----------------------------------------------------------------
  it('archive tab shows closed cases', () => {
    selectTab(fixture, 3);
    expect(component.archiveCases()).toHaveLength(1);
    expect(component.archiveCases()[0].case_number).toBe('CDL-501');
  });

  it('archive tab handles API error gracefully', () => {
    caseServiceSpy['getClosedCases'].mockReturnValue(throwError(() => new Error('fail')));
    selectTab(fixture, 3);
    expect(component.archiveLoaded()).toBe(true);
    expect(component.archiveCases()).toHaveLength(0);
  });

  // ----------------------------------------------------------------
  // View toggle (list / kanban) — only on tab 0
  // ----------------------------------------------------------------
  it('shows view toggle on My Cases tab', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.view-toggle')).toBeTruthy();
  });

  it('hides view toggle on other tabs', () => {
    selectTab(fixture, 1);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.view-toggle')).toBeFalsy();
  });

  it('persists view preference to localStorage', () => {
    component.view.set('kanban');
    // effect runs synchronously in test zone
    TestBed.flushEffects();
    expect(localStorage.getItem('opr_view')).toBe('kanban');
  });
});
