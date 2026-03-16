import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AdminOperatorKanbanComponent, OperatorColumn } from './admin-operator-kanban.component';
import { AdminService } from '../../../core/services/admin.service';
import { CaseService } from '../../../core/services/case.service';

// ── Mock data ──

const MOCK_OPERATORS = [
  { id: 'op-1', name: 'Lisa M.', activeCaseCount: 2, capacity: 20 },
  { id: 'op-2', name: 'Alex T.', activeCaseCount: 1, capacity: 20 },
  { id: 'op-3', name: 'Rachel A.', activeCaseCount: 0, capacity: 5 },
];

const MOCK_CASES = [
  { id: 'c1', case_number: 'CDL-001', customer_name: 'Alice', violation_type: 'Speeding', state: 'TX', status: 'new', assigned_operator_id: null, ageHours: 12 },
  { id: 'c2', case_number: 'CDL-002', customer_name: 'Bob', violation_type: 'Logbook', state: 'CA', status: 'reviewed', assigned_operator_id: 'op-1', ageHours: 30 },
  { id: 'c3', case_number: 'CDL-003', customer_name: 'Carol', violation_type: 'DUI', state: 'NY', status: 'assigned_to_attorney', assigned_operator_id: 'op-1', ageHours: 50 },
  { id: 'c4', case_number: 'CDL-004', customer_name: 'Dave', violation_type: 'Equipment', state: 'FL', status: 'new', assigned_operator_id: 'op-2', ageHours: 6 },
  { id: 'c5', case_number: 'CDL-005', customer_name: 'Eve', violation_type: 'Red Light', state: 'TX', status: 'reviewed', assigned_operator_id: null, ageHours: 80 },
];

function makeAdminServiceSpy() {
  return {
    getOperators: vi.fn().mockReturnValue(of({ operators: MOCK_OPERATORS })),
    getAllCases: vi.fn().mockReturnValue(of({ cases: MOCK_CASES, total: 5 })),
    assignOperator: vi.fn().mockReturnValue(of({ success: true })),
  };
}

function makeCaseServiceSpy() {
  return {
    getAvailableAttorneys: vi.fn().mockReturnValue(of({ attorneys: [] })),
  };
}

describe('AdminOperatorKanbanComponent', () => {
  let fixture: ComponentFixture<AdminOperatorKanbanComponent>;
  let component: AdminOperatorKanbanComponent;
  let adminSpy: ReturnType<typeof makeAdminServiceSpy>;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    adminSpy = makeAdminServiceSpy();
    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AdminOperatorKanbanComponent, NoopAnimationsModule],
      providers: [
        provideTranslateService(),
        { provide: AdminService, useValue: adminSpy },
        { provide: CaseService, useValue: makeCaseServiceSpy() },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminOperatorKanbanComponent);
    component = fixture.componentInstance;

    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    snackBarSpy = vi.spyOn(snackBar, 'open').mockReturnValue(null as any);

    fixture.detectChanges();
  });

  // ── Loading & data ──

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads operators and cases on init', () => {
    expect(adminSpy.getOperators).toHaveBeenCalled();
    expect(adminSpy.getAllCases).toHaveBeenCalledWith({ limit: 500 });
    expect(component.loading()).toBe(false);
  });

  it('creates unassigned column + one column per operator', () => {
    const cols = component.columns();
    // 1 unassigned + 3 operators = 4
    expect(cols.length).toBe(4);
    expect(cols[0].key).toBe('unassigned');
    expect(cols[0].operatorId).toBeNull();
    expect(cols[1].key).toBe('op-1');
    expect(cols[2].key).toBe('op-2');
    expect(cols[3].key).toBe('op-3');
  });

  it('groups cases by assigned_operator_id', () => {
    const cols = component.columns();
    // unassigned: c1, c5
    expect(cols[0].cases.length).toBe(2);
    expect(cols[0].cases.map((c: any) => c.id)).toContain('c1');
    expect(cols[0].cases.map((c: any) => c.id)).toContain('c5');
    // op-1: c2, c3
    expect(cols[1].cases.length).toBe(2);
    // op-2: c4
    expect(cols[2].cases.length).toBe(1);
    // op-3: none
    expect(cols[3].cases.length).toBe(0);
  });

  it('operator columns show capacity', () => {
    const cols = component.columns();
    expect(cols[1].capacity).toBe(20);
    expect(cols[3].capacity).toBe(5);
  });

  it('unassigned column has capacity 0', () => {
    expect(component.columns()[0].capacity).toBe(0);
  });

  it('columnKeys returns all column keys', () => {
    expect(component.columnKeys()).toEqual(['unassigned', 'op-1', 'op-2', 'op-3']);
  });

  // ── Rendering ──

  it('renders one column per operator + unassigned', () => {
    fixture.detectChanges();
    const columns = fixture.nativeElement.querySelectorAll('.kanban-column');
    expect(columns.length).toBe(4);
  });

  it('renders case cards with case number and client name', () => {
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.kanban-card');
    expect(cards.length).toBe(5);
    const firstCard = cards[0];
    expect(firstCard.querySelector('.card-number').textContent).toContain('CDL-');
    expect(firstCard.querySelector('.card-client')).toBeTruthy();
  });

  it('shows empty placeholder in operator column with no cases', () => {
    fixture.detectChanges();
    const empties = fixture.nativeElement.querySelectorAll('.col-empty');
    expect(empties.length).toBe(1); // op-3 has no cases
  });

  it('marks urgent age cards (>= 48h)', () => {
    fixture.detectChanges();
    const urgentAges = fixture.nativeElement.querySelectorAll('.card-age.urgent');
    // c3 has 50h, c5 has 80h
    expect(urgentAges.length).toBe(2);
  });

  // ── Utilization ──

  it('computes utilization correctly', () => {
    const cols = component.columns();
    // op-1: 2/20 = 10%
    expect(component.utilization(cols[1])).toBeCloseTo(10);
    // op-3: 0/5 = 0%
    expect(component.utilization(cols[3])).toBe(0);
  });

  // ── Drag-and-drop ──

  it('onDrop from unassigned to operator calls assignOperator', () => {
    const cols = component.columns();
    const sourceCol = cols[0]; // unassigned
    const targetCol = cols[2]; // op-2
    const movedCase = MOCK_CASES[0]; // c1, unassigned

    const event = {
      previousContainer: { data: sourceCol },
      container: { data: targetCol },
      item: { data: movedCase },
    };

    component.onDrop(event as any);
    expect(adminSpy.assignOperator).toHaveBeenCalledWith('c1', 'op-2');
  });

  it('onDrop between operators calls assignOperator with new ID', () => {
    const cols = component.columns();
    const sourceCol = cols[1]; // op-1
    const targetCol = cols[2]; // op-2
    const movedCase = MOCK_CASES[1]; // c2, assigned to op-1

    const event = {
      previousContainer: { data: sourceCol },
      container: { data: targetCol },
      item: { data: movedCase },
    };

    component.onDrop(event as any);
    expect(adminSpy.assignOperator).toHaveBeenCalledWith('c2', 'op-2');
  });

  it('onDrop to unassigned calls assignOperator with null', () => {
    const cols = component.columns();
    const sourceCol = cols[1]; // op-1
    const targetCol = cols[0]; // unassigned
    const movedCase = MOCK_CASES[1]; // c2

    const event = {
      previousContainer: { data: sourceCol },
      container: { data: targetCol },
      item: { data: movedCase },
    };

    component.onDrop(event as any);
    expect(adminSpy.assignOperator).toHaveBeenCalledWith('c2', null);
  });

  it('onDrop to same column does nothing', () => {
    const col = component.columns()[0];
    const event = {
      previousContainer: { data: col },
      container: { data: col },
      item: { data: MOCK_CASES[0] },
    };

    component.onDrop(event as any);
    expect(adminSpy.assignOperator).not.toHaveBeenCalled();
  });

  it('shows capacity warning when target operator is at capacity', () => {
    // Make op-3 (capacity 5) have 5 cases to be at capacity
    const atCapacityCol: OperatorColumn = {
      key: 'op-3', label: 'Rachel A.', operatorId: 'op-3',
      cases: [{}, {}, {}, {}, {}] as any[],
      activeCaseCount: 5, capacity: 5,
    };

    const sourceCol = component.columns()[0]; // unassigned
    const event = {
      previousContainer: { data: sourceCol },
      container: { data: atCapacityCol },
      item: { data: MOCK_CASES[0] },
    };

    component.onDrop(event as any);
    // Should NOT call assignOperator yet
    expect(adminSpy.assignOperator).not.toHaveBeenCalled();
    // Should show confirm dialog
    expect(component.confirmDialog()).toBeTruthy();
    expect(component.confirmDialog()!.operatorName).toBe('Rachel A.');
  });

  it('cancelOverCapacity clears dialog without assigning', () => {
    component.confirmDialog.set({
      caseId: 'c1', operatorId: 'op-3', operatorName: 'Rachel A.',
      currentCount: 5, capacity: 5,
    });
    component.cancelOverCapacity();
    expect(component.confirmDialog()).toBeNull();
    expect(adminSpy.assignOperator).not.toHaveBeenCalled();
  });

  it('confirmOverCapacity proceeds with assignment', () => {
    // Simulate a pending drop
    const sourceCol = component.columns()[0];
    const atCapacityCol: OperatorColumn = {
      key: 'op-3', label: 'Rachel A.', operatorId: 'op-3',
      cases: [{}, {}, {}, {}, {}] as any[],
      activeCaseCount: 5, capacity: 5,
    };
    const event = {
      previousContainer: { data: sourceCol },
      container: { data: atCapacityCol },
      item: { data: MOCK_CASES[0] },
    };
    component.onDrop(event as any);
    expect(adminSpy.assignOperator).not.toHaveBeenCalled();

    component.confirmOverCapacity();
    expect(adminSpy.assignOperator).toHaveBeenCalledWith('c1', 'op-3');
    expect(component.confirmDialog()).toBeNull();
  });

  it('shows success snackbar on successful assignment', () => {
    const cols = component.columns();
    const event = {
      previousContainer: { data: cols[0] },
      container: { data: cols[2] },
      item: { data: MOCK_CASES[0] },
    };

    component.onDrop(event as any);
    expect(snackBarSpy).toHaveBeenCalled();
  });

  it('reverts and shows error snackbar on assignment failure', () => {
    adminSpy.assignOperator.mockReturnValue(throwError(() => new Error('fail')));

    const cols = component.columns();
    const event = {
      previousContainer: { data: cols[0] },
      container: { data: cols[2] },
      item: { data: MOCK_CASES[0] },
    };

    component.onDrop(event as any);
    // loadData should be called on error (revert)
    expect(adminSpy.getOperators).toHaveBeenCalledTimes(2); // initial + revert
  });

  // ── Navigation ──

  it('openCase navigates to /admin/cases/:id', () => {
    component.openCase('c1');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/cases', 'c1']);
  });

  // ── Helpers ──

  it('formatAge formats hours correctly', () => {
    expect(component.formatAge(5)).toBe('5h');
    expect(component.formatAge(72)).toBe('3d 0h');
    expect(component.formatAge(50)).toBe('2d 2h');
  });

  it('formatStatus maps known statuses', () => {
    expect(component.formatStatus('new')).toBe('New');
    expect(component.formatStatus('reviewed')).toBe('Reviewed');
    expect(component.formatStatus('assigned_to_attorney')).toBe('Assigned');
    expect(component.formatStatus('unknown')).toBe('unknown');
  });

  // ── Error state ──

  it('shows error when data load fails', () => {
    adminSpy.getOperators.mockReturnValue(throwError(() => new Error('fail')));
    component.loadData();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });

  // ── Optimistic update ──

  it('optimistically moves case to new operator on assignment', () => {
    const cols = component.columns();
    const event = {
      previousContainer: { data: cols[0] },
      container: { data: cols[2] }, // op-2
      item: { data: MOCK_CASES[0] }, // c1, unassigned
    };

    component.onDrop(event as any);
    // After optimistic update, c1 should now be in op-2's column
    const updatedCols = component.columns();
    const op2Cases = updatedCols[2].cases.map((c: any) => c.id);
    expect(op2Cases).toContain('c1');
  });
});
