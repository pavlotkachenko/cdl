import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { OperatorKanbanComponent } from './operator-kanban.component';
import { StatusWorkflowService } from '../../../core/services/status-workflow.service';

const MOCK_CASES = [
  { id: 'c1', case_number: 'CDL-601', status: 'new', customer_name: 'Alice', violation_type: 'Speeding', ageHours: 12, priority: 'high' },
  { id: 'c2', case_number: 'CDL-602', status: 'reviewed', customer_name: 'Bob', violation_type: 'Overweight', ageHours: 30, priority: 'medium' },
  { id: 'c3', case_number: 'CDL-603', status: 'assigned_to_attorney', customer_name: 'Carol', violation_type: 'Logbook', ageHours: 6, priority: 'low' },
  { id: 'c4', case_number: 'CDL-604', status: 'waiting_for_driver', customer_name: 'Dave', violation_type: 'Lane Change', ageHours: 50, priority: 'critical' },
  { id: 'c5', case_number: 'CDL-605', status: 'closed', customer_name: 'Eve', violation_type: 'Equipment', ageHours: 100, priority: 'low' },
];

describe('OperatorKanbanComponent', () => {
  let fixture: ComponentFixture<OperatorKanbanComponent>;
  let component: OperatorKanbanComponent;
  let workflowSpy: {
    getNextStatuses: ReturnType<typeof vi.fn>;
    changeStatus: ReturnType<typeof vi.fn>;
  };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    TestBed.resetTestingModule();

    workflowSpy = {
      getNextStatuses: vi.fn().mockReturnValue(of({
        currentStatus: 'new',
        nextStatuses: ['reviewed', 'assigned_to_attorney'],
        requiresNote: {},
      })),
      changeStatus: vi.fn().mockReturnValue(of({ message: 'ok' })),
    };

    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [OperatorKanbanComponent, NoopAnimationsModule],
      providers: [
        { provide: StatusWorkflowService, useValue: workflowSpy },
        { provide: Router, useValue: routerSpy },
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorKanbanComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('cases', MOCK_CASES);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------
  it('renders 5 columns', () => {
    const columns = fixture.nativeElement.querySelectorAll('.kanban-column');
    expect(columns.length).toBe(5);
  });

  it('groups cases into correct columns', () => {
    const cols = component.columns();
    // intake: new + reviewed = 2
    expect(cols[0].cases.length).toBe(2);
    // assignment: assigned_to_attorney = 1
    expect(cols[1].cases.length).toBe(1);
    // processing: waiting_for_driver = 1
    expect(cols[2].cases.length).toBe(1);
    // payment: 0
    expect(cols[3].cases.length).toBe(0);
    // resolution: closed = 1
    expect(cols[4].cases.length).toBe(1);
  });

  it('shows count badges with correct numbers', () => {
    const badges = fixture.nativeElement.querySelectorAll('.col-count');
    expect(badges[0].textContent.trim()).toBe('2');
    expect(badges[1].textContent.trim()).toBe('1');
    expect(badges[2].textContent.trim()).toBe('1');
    expect(badges[3].textContent.trim()).toBe('0');
    expect(badges[4].textContent.trim()).toBe('1');
  });

  it('shows empty placeholder in payment column', () => {
    const empties = fixture.nativeElement.querySelectorAll('.col-empty');
    expect(empties.length).toBe(1); // only payment column is empty
  });

  it('renders case cards with case number and client name', () => {
    const cards = fixture.nativeElement.querySelectorAll('.kanban-card');
    expect(cards.length).toBe(5);
    expect(cards[0].querySelector('.card-number').textContent).toContain('CDL-601');
    expect(cards[0].querySelector('.card-client').textContent).toContain('Alice');
  });

  it('marks urgent age cards', () => {
    // c4 has ageHours=50 (>= 48) and c5 has 100
    const urgentAges = fixture.nativeElement.querySelectorAll('.card-age.urgent');
    expect(urgentAges.length).toBe(2);
  });

  // ----------------------------------------------------------------
  // Navigation
  // ----------------------------------------------------------------
  it('openCase navigates to case detail', () => {
    component.openCase('c1');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/operator/cases', 'c1']);
  });

  // ----------------------------------------------------------------
  // Drag-and-drop logic
  // ----------------------------------------------------------------
  it('onDrop with valid transition calls changeStatus', async () => {
    const sourceCol = { key: 'intake', statuses: ['new', 'reviewed'], cases: [] };
    const targetCol = { key: 'assignment', statuses: ['assigned_to_attorney'], cases: [] };
    const movedCase = MOCK_CASES[0]; // c1, status: new

    workflowSpy.getNextStatuses.mockReturnValue(of({
      currentStatus: 'new',
      nextStatuses: ['reviewed', 'assigned_to_attorney'],
      requiresNote: {},
    }));

    const event = {
      previousContainer: { data: sourceCol },
      container: { data: targetCol },
      item: { data: movedCase },
    };

    await component.onDrop(event as any);
    expect(workflowSpy.changeStatus).toHaveBeenCalledWith('c1', 'assigned_to_attorney', undefined);
  });

  it('onDrop with invalid transition shows error snackbar', async () => {
    const sourceCol = { key: 'processing', statuses: ['waiting_for_driver'], cases: [] };
    const targetCol = { key: 'intake', statuses: ['new', 'reviewed'], cases: [] };
    const movedCase = MOCK_CASES[3]; // c4, status: waiting_for_driver

    workflowSpy.getNextStatuses.mockReturnValue(of({
      currentStatus: 'waiting_for_driver',
      nextStatuses: ['call_court', 'check_with_manager'],
      requiresNote: { check_with_manager: true },
    }));

    const event = {
      previousContainer: { data: sourceCol },
      container: { data: targetCol },
      item: { data: movedCase },
    };

    await component.onDrop(event as any);
    // No valid target in intake column
    expect(workflowSpy.changeStatus).not.toHaveBeenCalled();
  });

  it('onDrop to same column does nothing', async () => {
    const col = { key: 'intake', statuses: ['new', 'reviewed'], cases: [] };
    const event = {
      previousContainer: { data: col },
      container: { data: col },
      item: { data: MOCK_CASES[0] },
    };

    await component.onDrop(event as any);
    expect(workflowSpy.getNextStatuses).not.toHaveBeenCalled();
  });

  it('onDrop to note-required status opens dialog', async () => {
    const sourceCol = { key: 'processing', statuses: ['waiting_for_driver'], cases: [] };
    const targetCol = { key: 'resolution', statuses: ['resolved', 'closed'], cases: [] };
    const movedCase = MOCK_CASES[3];

    workflowSpy.getNextStatuses.mockReturnValue(of({
      currentStatus: 'waiting_for_driver',
      nextStatuses: ['closed'],
      requiresNote: { closed: true },
    }));

    const dialog = fixture.debugElement.injector.get(MatDialog);
    const dialogSpy = vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of('My note for closing'),
    } as any);

    const event = {
      previousContainer: { data: sourceCol },
      container: { data: targetCol },
      item: { data: movedCase },
    };

    await component.onDrop(event as any);
    expect(dialogSpy).toHaveBeenCalled();
    expect(workflowSpy.changeStatus).toHaveBeenCalledWith('c4', 'closed', 'My note for closing');
  });

  it('handles API error on getNextStatuses gracefully', async () => {
    workflowSpy.getNextStatuses.mockReturnValue(throwError(() => new Error('Network error')));

    const sourceCol = { key: 'intake', statuses: ['new'], cases: [] };
    const targetCol = { key: 'assignment', statuses: ['assigned_to_attorney'], cases: [] };
    const event = {
      previousContainer: { data: sourceCol },
      container: { data: targetCol },
      item: { data: MOCK_CASES[0] },
    };

    await component.onDrop(event as any);
    expect(workflowSpy.changeStatus).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  it('formatAge formats hours correctly', () => {
    expect(component.formatAge(5)).toBe('5h');
    expect(component.formatAge(72)).toBe('3d 0h');
    expect(component.formatAge(50)).toBe('2d 2h');
  });

  it('columnKeys returns all 5 keys', () => {
    expect(component.columnKeys()).toEqual(['intake', 'assignment', 'processing', 'payment', 'resolution']);
  });
});
