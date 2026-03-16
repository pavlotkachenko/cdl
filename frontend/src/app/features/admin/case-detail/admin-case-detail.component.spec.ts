import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';

import { AdminCaseDetailComponent } from './admin-case-detail.component';
import { AdminService } from '../../../core/services/admin.service';
import { CaseService } from '../../../core/services/case.service';
import { AuthService } from '../../../core/services/auth.service';
import { StatusWorkflowService } from '../../../core/services/status-workflow.service';
import { MatSnackBar } from '@angular/material/snack-bar';

// ── Mock data ──

const mockCase = {
  id: 'c1',
  case_number: 'CDL-2026-042',
  status: 'reviewed',
  state: 'TX',
  violation_type: 'Speeding',
  violation_date: '2026-01-15',
  customer_name: 'Miguel Santos',
  customer_email: 'miguel@test.com',
  county: 'Harris',
  attorney_price: 350,
  assigned_operator_id: 'op-1',
  assigned_attorney_id: 'att-1',
  attorney: { id: 'att-1', full_name: 'James H.', email: 'james@test.com' },
  driver: { id: 'd1', full_name: 'Miguel Santos', phone: '555-1234' },
  court_dates: [],
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-03-10T14:00:00Z',
};

const mockActivity = [
  { id: 'a1', action: 'status_change', details: { from: 'new', to: 'reviewed' }, created_at: '2026-03-10T14:00:00Z', user_name: 'Lisa M.' },
  { id: 'a2', action: 'case_created', details: {}, created_at: '2026-01-15T10:00:00Z', user_name: 'System' },
];

const mockOperators = [
  { id: 'op-1', name: 'Lisa M.', email: 'lisa@test.com', activeCaseCount: 12, totalCaseCount: 25 },
  { id: 'op-2', name: 'Alex T.', email: 'alex@test.com', activeCaseCount: 8, totalCaseCount: 15 },
];

const mockAttorneys = [
  { id: 'att-1', full_name: 'James H.', active_cases: 5 },
  { id: 'att-2', full_name: 'Sarah K.', active_cases: 3 },
];

describe('AdminCaseDetailComponent', () => {
  let component: AdminCaseDetailComponent;
  let fixture: ComponentFixture<AdminCaseDetailComponent>;
  let adminServiceMock: {
    getAdminCaseDetail: ReturnType<typeof vi.fn>;
    getOperators: ReturnType<typeof vi.fn>;
    assignOperator: ReturnType<typeof vi.fn>;
    assignAttorney: ReturnType<typeof vi.fn>;
  };
  let caseServiceMock: {
    getAvailableAttorneys: ReturnType<typeof vi.fn>;
    listDocuments: ReturnType<typeof vi.fn>;
    uploadDocument: ReturnType<typeof vi.fn>;
    deleteDocument: ReturnType<typeof vi.fn>;
    patchCase: ReturnType<typeof vi.fn>;
  };
  let workflowServiceMock: {
    getPhases: ReturnType<typeof vi.fn>;
    getPhaseIndex: ReturnType<typeof vi.fn>;
    getPhaseForStatus: ReturnType<typeof vi.fn>;
    getStatusConfig: ReturnType<typeof vi.fn>;
    getNextStatuses: ReturnType<typeof vi.fn>;
    changeStatus: ReturnType<typeof vi.fn>;
  };
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    adminServiceMock = {
      getAdminCaseDetail: vi.fn().mockReturnValue(of({
        case: mockCase,
        activity: mockActivity,
        operator_name: 'Lisa M.',
        attorney_name: 'James H.',
      })),
      getOperators: vi.fn().mockReturnValue(of({ operators: mockOperators })),
      assignOperator: vi.fn().mockReturnValue(of({ success: true })),
      assignAttorney: vi.fn().mockReturnValue(of({ success: true })),
    };
    caseServiceMock = {
      getAvailableAttorneys: vi.fn().mockReturnValue(of({ attorneys: mockAttorneys })),
      listDocuments: vi.fn().mockReturnValue(of({ documents: [] })),
      uploadDocument: vi.fn().mockReturnValue(of({})),
      deleteDocument: vi.fn().mockReturnValue(of({})),
      patchCase: vi.fn().mockReturnValue(of({})),
    };
    const PHASES = [
      { key: 'intake', label: 'OPR.PHASE_INTAKE', statuses: ['new', 'reviewed'] },
      { key: 'assignment', label: 'OPR.PHASE_ASSIGNMENT', statuses: ['assigned_to_attorney'] },
      { key: 'processing', label: 'OPR.PHASE_PROCESSING', statuses: ['send_info_to_attorney', 'waiting_for_driver', 'call_court', 'check_with_manager'] },
      { key: 'payment', label: 'OPR.PHASE_PAYMENT', statuses: ['pay_attorney', 'attorney_paid'] },
      { key: 'resolution', label: 'OPR.PHASE_RESOLUTION', statuses: ['resolved', 'closed'] },
    ];
    workflowServiceMock = {
      getPhases: vi.fn().mockReturnValue(PHASES),
      getPhaseIndex: vi.fn().mockReturnValue(0),
      getPhaseForStatus: vi.fn().mockReturnValue(PHASES[0]),
      getStatusConfig: vi.fn().mockReturnValue({ label: 'OPR.STATUS_REVIEWED', color: '#e8eaf6', icon: 'rate_review' }),
      getNextStatuses: vi.fn().mockReturnValue(of({ currentStatus: 'reviewed', nextStatuses: ['assigned_to_attorney'], requiresNote: {} })),
      changeStatus: vi.fn().mockReturnValue(of({ message: 'ok' })),
    };
    await TestBed.configureTestingModule({
      imports: [AdminCaseDetailComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'c1' } } } },
        { provide: AdminService, useValue: adminServiceMock },
        { provide: CaseService, useValue: caseServiceMock },
        { provide: AuthService, useValue: { currentUserValue: { id: 'admin-1', role: 'admin', full_name: 'Admin User' } } },
        { provide: StatusWorkflowService, useValue: workflowServiceMock },
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCaseDetailComponent);
    component = fixture.componentInstance;

    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    snackBarSpy = vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reads caseId from route params and calls getAdminCaseDetail', () => {
    fixture.detectChanges();
    expect(component.caseId()).toBe('c1');
    expect(adminServiceMock.getAdminCaseDetail).toHaveBeenCalledWith('c1');
  });

  it('loads operators and attorneys on init', () => {
    fixture.detectChanges();
    expect(adminServiceMock.getOperators).toHaveBeenCalled();
    expect(caseServiceMock.getAvailableAttorneys).toHaveBeenCalled();
    expect(component.operators()).toHaveLength(2);
    expect(component.attorneys()).toHaveLength(2);
  });

  it('populates caseData signal after loading', () => {
    fixture.detectChanges();
    expect(component.caseData()).toBeTruthy();
    expect(component.caseData()!.case_number).toBe('CDL-2026-042');
    expect(component.loading()).toBe(false);
  });

  it('populates activity log', () => {
    fixture.detectChanges();
    expect(component.activity()).toHaveLength(2);
    expect(component.activity()[0].user_name).toBe('Lisa M.');
  });

  it('starts with loading true before init', () => {
    // Before detectChanges triggers ngOnInit, loading is true
    expect(component.loading()).toBe(true);
    // After init, synchronous observables resolve immediately
    fixture.detectChanges();
    expect(component.loading()).toBe(false);
  });

  it('shows error message on fetch failure', () => {
    adminServiceMock.getAdminCaseDetail.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    expect(component.error()).toBeTruthy();
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
  });

  it('renders case number in header', () => {
    fixture.detectChanges();
    fixture.detectChanges(); // second CD for @if to render
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('CDL-2026-042');
  });

  it('renders StatusPipelineComponent', () => {
    fixture.detectChanges();
    fixture.detectChanges();
    const pipeline = fixture.nativeElement.querySelector('app-status-pipeline');
    expect(pipeline).toBeTruthy();
  });

  it('renders CaseEditFormComponent', () => {
    fixture.detectChanges();
    fixture.detectChanges();
    const editForm = fixture.nativeElement.querySelector('app-case-edit-form');
    expect(editForm).toBeTruthy();
  });

  it('renders FileManagerComponent', () => {
    fixture.detectChanges();
    fixture.detectChanges();
    const fileManager = fixture.nativeElement.querySelector('app-file-manager');
    expect(fileManager).toBeTruthy();
  });

  it('onStatusChanged reloads case data', () => {
    fixture.detectChanges();
    adminServiceMock.getAdminCaseDetail.mockClear();
    component.onStatusChanged('assigned_to_attorney');
    expect(adminServiceMock.getAdminCaseDetail).toHaveBeenCalledWith('c1');
  });

  it('onCaseSaved updates caseData signal and shows snackbar', () => {
    fixture.detectChanges();
    const updated = { ...mockCase, violation_type: 'DUI' };
    component.onCaseSaved(updated);
    expect(component.caseData()!.violation_type).toBe('DUI');
    expect(snackBarSpy).toHaveBeenCalledWith('ADMIN.CASE_DETAIL.CASE_UPDATED', 'ADMIN.CASE_DETAIL.CLOSE', expect.any(Object));
  });

  it('onOperatorChanged calls assignOperator and shows snackbar', () => {
    fixture.detectChanges();
    adminServiceMock.getAdminCaseDetail.mockClear();
    component.onOperatorChanged('op-2');
    expect(adminServiceMock.assignOperator).toHaveBeenCalledWith('c1', 'op-2');
    expect(snackBarSpy).toHaveBeenCalledWith('ADMIN.CASE_DETAIL.OPERATOR_UPDATED', 'ADMIN.CASE_DETAIL.CLOSE', expect.any(Object));
  });

  it('onAttorneyChanged calls assignAttorney and shows snackbar', () => {
    fixture.detectChanges();
    adminServiceMock.getAdminCaseDetail.mockClear();
    component.onAttorneyChanged('att-2');
    expect(adminServiceMock.assignAttorney).toHaveBeenCalledWith('c1', 'att-2');
    expect(snackBarSpy).toHaveBeenCalledWith('ADMIN.CASE_DETAIL.ATTORNEY_UPDATED', 'ADMIN.CASE_DETAIL.CLOSE', expect.any(Object));
  });

  it('back button links to /admin/cases', () => {
    fixture.detectChanges();
    fixture.detectChanges();
    const backLink = fixture.nativeElement.querySelector('a.back-link');
    expect(backLink).toBeTruthy();
  });

  it('formatAction maps known actions to human-readable labels', () => {
    expect(component.formatAction('status_change')).toBe('ADMIN.CASE_DETAIL.ACTION_STATUS_CHANGE');
    expect(component.formatAction('admin_status_override')).toBe('ADMIN.CASE_DETAIL.ACTION_ADMIN_OVERRIDE');
    expect(component.formatAction('unknown_action')).toBe('unknown action');
  });

  it('currentUserId computed returns auth user id', () => {
    expect(component.currentUserId()).toBe('admin-1');
  });

  it('empty activity shows empty message', () => {
    adminServiceMock.getAdminCaseDetail.mockReturnValue(of({
      case: mockCase, activity: [], operator_name: null, attorney_name: null,
    }));
    fixture.detectChanges();
    fixture.detectChanges();
    const activitySection = fixture.nativeElement.querySelector('[aria-label="ADMIN.CASE_DETAIL.ACTIVITY_LOG"]');
    expect(activitySection).toBeTruthy();
    const emptyText = activitySection.querySelector('.empty-text');
    expect(emptyText).toBeTruthy();
    expect(emptyText.textContent).toContain('ADMIN.CASE_DETAIL.ACTIVITY_EMPTY');
  });
});
