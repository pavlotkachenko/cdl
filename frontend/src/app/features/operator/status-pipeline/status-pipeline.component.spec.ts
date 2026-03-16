import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';

import { StatusPipelineComponent } from './status-pipeline.component';
import { StatusWorkflowService, NextStatusesResponse } from '../../../core/services/status-workflow.service';

const MOCK_NEXT_STATUSES: NextStatusesResponse = {
  currentStatus: 'assigned_to_attorney',
  nextStatuses: ['send_info_to_attorney', 'waiting_for_driver', 'call_court', 'check_with_manager', 'closed'],
  requiresNote: { closed: true, check_with_manager: true },
};

describe('StatusPipelineComponent', () => {
  let fixture: ComponentFixture<StatusPipelineComponent>;
  let component: StatusPipelineComponent;
  let dialogSpy: { open: ReturnType<typeof vi.fn> };
  let workflowSpy: {
    getNextStatuses: ReturnType<typeof vi.fn>;
    changeStatus: ReturnType<typeof vi.fn>;
    getPhaseForStatus: ReturnType<typeof vi.fn>;
    getPhaseIndex: ReturnType<typeof vi.fn>;
    getPhases: ReturnType<typeof vi.fn>;
    getStatusConfig: ReturnType<typeof vi.fn>;
  };

  const PHASES = [
    { key: 'intake', label: 'OPR.PHASE_INTAKE', statuses: ['new', 'reviewed'] },
    { key: 'assignment', label: 'OPR.PHASE_ASSIGNMENT', statuses: ['assigned_to_attorney'] },
    { key: 'processing', label: 'OPR.PHASE_PROCESSING', statuses: ['send_info_to_attorney', 'waiting_for_driver', 'call_court', 'check_with_manager'] },
    { key: 'payment', label: 'OPR.PHASE_PAYMENT', statuses: ['pay_attorney', 'attorney_paid'] },
    { key: 'resolution', label: 'OPR.PHASE_RESOLUTION', statuses: ['resolved', 'closed'] },
  ];

  beforeEach(async () => {
    TestBed.resetTestingModule();

    workflowSpy = {
      getNextStatuses: vi.fn().mockReturnValue(of(MOCK_NEXT_STATUSES)),
      changeStatus: vi.fn().mockReturnValue(of({ message: 'ok' })),
      getPhaseForStatus: vi.fn().mockReturnValue(PHASES[1]),
      getPhaseIndex: vi.fn().mockReturnValue(1),
      getPhases: vi.fn().mockReturnValue(PHASES),
      getStatusConfig: vi.fn().mockImplementation((status: string) => ({
        label: `OPR.STATUS_${status.toUpperCase()}`,
        color: '#e3f2fd',
        icon: 'fiber_new',
      })),
    };

    await TestBed.configureTestingModule({
      imports: [StatusPipelineComponent, NoopAnimationsModule],
      providers: [
        { provide: StatusWorkflowService, useValue: workflowSpy },
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusPipelineComponent);
    component = fixture.componentInstance;

    // Spy on the real MatDialog injected into the component
    const dialog = fixture.debugElement.injector.get(MatDialog);
    dialogSpy = { open: vi.spyOn(dialog, 'open').mockReturnValue({ afterClosed: () => of(undefined) } as any) };

    fixture.componentRef.setInput('currentStatus', 'assigned_to_attorney');
    fixture.componentRef.setInput('caseId', 'case-1');
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------
  it('renders 5 phase circles', () => {
    const circles = fixture.nativeElement.querySelectorAll('.phase-circle');
    expect(circles.length).toBe(5);
  });

  it('marks the current phase as phase-current', () => {
    const steps = fixture.nativeElement.querySelectorAll('.phase-step');
    // index 1 should be current (assignment phase)
    expect(steps[1].classList.contains('phase-current')).toBe(true);
  });

  it('marks past phases as phase-complete', () => {
    const steps = fixture.nativeElement.querySelectorAll('.phase-step');
    // index 0 is past (intake)
    expect(steps[0].classList.contains('phase-complete')).toBe(true);
  });

  it('marks future phases as phase-future', () => {
    const steps = fixture.nativeElement.querySelectorAll('.phase-step');
    // indices 2,3,4 are future
    expect(steps[2].classList.contains('phase-future')).toBe(true);
    expect(steps[3].classList.contains('phase-future')).toBe(true);
    expect(steps[4].classList.contains('phase-future')).toBe(true);
  });

  // ----------------------------------------------------------------
  // Action buttons
  // ----------------------------------------------------------------
  it('renders action buttons matching nextStatuses', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.action-btn');
    expect(buttons.length).toBe(5);
  });

  it('loads next statuses on init', () => {
    expect(workflowSpy.getNextStatuses).toHaveBeenCalledWith('case-1');
    expect(component.nextStatuses()).toEqual(MOCK_NEXT_STATUSES.nextStatuses);
  });

  // ----------------------------------------------------------------
  // Transition logic
  // ----------------------------------------------------------------
  it('calls changeStatus when clicking a non-note-required action', () => {
    // send_info_to_attorney does not require a note
    component.onAction('send_info_to_attorney');
    expect(workflowSpy.changeStatus).toHaveBeenCalledWith('case-1', 'send_info_to_attorney', undefined);
  });

  it('opens note dialog when clicking a note-required action', () => {
    dialogSpy.open.mockReturnValue({
      afterClosed: () => of('My important note here'),
    });

    component.onAction('closed');

    expect(dialogSpy.open).toHaveBeenCalled();
    // After dialog closes with note, should call changeStatus
    expect(workflowSpy.changeStatus).toHaveBeenCalledWith('case-1', 'closed', 'My important note here');
  });

  // ----------------------------------------------------------------
  // Terminal status
  // ----------------------------------------------------------------
  it('shows no action buttons when status is closed (terminal)', async () => {
    workflowSpy.getNextStatuses.mockReturnValue(of({
      currentStatus: 'closed',
      nextStatuses: [],
      requiresNote: {},
    }));
    workflowSpy.getPhaseIndex.mockReturnValue(4);

    fixture.componentRef.setInput('currentStatus', 'closed');
    component.ngOnInit();
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.action-btn');
    expect(buttons.length).toBe(0);
    expect(fixture.nativeElement.querySelector('.terminal-msg')).toBeTruthy();
  });

  // ----------------------------------------------------------------
  // Phase helpers
  // ----------------------------------------------------------------
  it('isForward returns true for a target in a later phase', () => {
    workflowSpy.getPhaseIndex.mockReturnValue(2); // processing
    expect(component.isForward('pay_attorney')).toBe(true);
  });

  it('isLateral returns true for a target in the same or earlier phase', () => {
    workflowSpy.getPhaseIndex.mockReturnValue(1); // same phase as current (1)
    expect(component.isLateral('waiting_for_driver')).toBe(true);
  });
});
