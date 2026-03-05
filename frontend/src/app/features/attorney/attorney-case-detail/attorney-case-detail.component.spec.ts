/**
 * Tests for AttorneyCaseDetailComponent — Sprint 003 Story 7.7
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AttorneyCaseDetailComponent } from './attorney-case-detail.component';
import { CaseService } from '../../../core/services/case.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

function makeCaseData(overrides = {}) {
  return {
    id: 'case-1',
    case_number: 'CDL-001',
    status: 'assigned_to_attorney',
    violation_type: 'speeding',
    state: 'CA',
    violation_date: '2026-01-15',
    court_date: null,
    attorney_price: 350,
    created_at: '2026-01-01',
    violation_details: 'Going 85 in a 65',
    driver: { id: 'driver-1', full_name: 'John Doe', phone: '***-***-4567', email: 'john@example.com' },
    files: [],
    ...overrides,
  };
}

describe('AttorneyCaseDetailComponent', () => {
  let fixture: ComponentFixture<AttorneyCaseDetailComponent>;
  let component: AttorneyCaseDetailComponent;
  let caseServiceSpy: { getCaseById: ReturnType<typeof vi.fn>; listDocuments: ReturnType<typeof vi.fn>; acceptCase: ReturnType<typeof vi.fn>; declineCase: ReturnType<typeof vi.fn>; updateStatus: ReturnType<typeof vi.fn> };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    caseServiceSpy = {
      getCaseById: vi.fn().mockReturnValue(of({ data: makeCaseData() })),
      listDocuments: vi.fn().mockReturnValue(of({ documents: [] })),
      acceptCase: vi.fn().mockReturnValue(of({ message: 'Accepted' })),
      declineCase: vi.fn().mockReturnValue(of({ message: 'Declined' })),
      updateStatus: vi.fn().mockReturnValue(of({ message: 'Updated' })),
    };

    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AttorneyCaseDetailComponent, NoopAnimationsModule],
      providers: [
        { provide: CaseService, useValue: caseServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { params: of({ caseId: 'case-1' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AttorneyCaseDetailComponent);
    component = fixture.componentInstance;

    // Spy on the actual MatSnackBar instance used by the component
    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    snackBarSpy = vi.spyOn(snackBar, 'open').mockReturnValue(null as any);

    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  // ----------------------------------------------------------------
  // Initialisation
  // ----------------------------------------------------------------
  it('loads case and documents on init', () => {
    expect(caseServiceSpy.getCaseById).toHaveBeenCalledWith('case-1');
    expect(caseServiceSpy.listDocuments).toHaveBeenCalledWith('case-1');
    expect(component.caseData()?.case_number).toBe('CDL-001');
    expect(component.loading()).toBe(false);
  });

  it('sets caseId signal from route params', () => {
    expect(component.caseId()).toBe('case-1');
  });

  // ----------------------------------------------------------------
  // accept()
  // ----------------------------------------------------------------
  it('accept() calls caseService.acceptCase and reloads case', () => {
    component.accept();

    expect(caseServiceSpy.acceptCase).toHaveBeenCalledWith('case-1');
    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining('accept'),
      expect.anything(),
      expect.any(Object)
    );
    // Should reload case after acceptance
    expect(caseServiceSpy.getCaseById).toHaveBeenCalledTimes(2);
    expect(component.processing()).toBe(false);
  });

  it('accept() shows error snackbar when service fails', () => {
    caseServiceSpy.acceptCase.mockReturnValue(throwError(() => new Error('Failed')));
    component.accept();

    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed'),
      expect.anything(),
      expect.any(Object)
    );
    expect(component.processing()).toBe(false);
  });

  // ----------------------------------------------------------------
  // decline()
  // ----------------------------------------------------------------
  it('decline() calls caseService.declineCase and navigates to dashboard', () => {
    component.decline();

    expect(caseServiceSpy.declineCase).toHaveBeenCalledWith('case-1');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/attorney/dashboard']);
  });

  it('decline() shows error when service fails', () => {
    caseServiceSpy.declineCase.mockReturnValue(throwError(() => new Error('error')));
    component.decline();

    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(component.processing()).toBe(false);
  });

  // ----------------------------------------------------------------
  // updateStatus()
  // ----------------------------------------------------------------
  it('updateStatus() does nothing when no status selected', () => {
    component.selectedStatus = '';
    component.updateStatus();
    expect(caseServiceSpy.updateStatus).not.toHaveBeenCalled();
  });

  it('updateStatus() calls caseService.updateStatus with selected status', () => {
    component.selectedStatus = 'send_info_to_attorney';
    component.updateStatus();

    expect(caseServiceSpy.updateStatus).toHaveBeenCalledWith('case-1', 'send_info_to_attorney');
    expect(component.selectedStatus).toBe('');
    expect(component.processing()).toBe(false);
  });

  // ----------------------------------------------------------------
  // getStatusLabel()
  // ----------------------------------------------------------------
  it('getStatusLabel returns human-readable label', () => {
    expect(component.getStatusLabel('assigned_to_attorney')).toBe('Pending Acceptance');
    expect(component.getStatusLabel('send_info_to_attorney')).toBe('Active');
    expect(component.getStatusLabel('closed')).toBe('Closed');
    expect(component.getStatusLabel('unknown_status')).toBe('unknown_status');
  });

  // ----------------------------------------------------------------
  // getFileIcon()
  // ----------------------------------------------------------------
  it('getFileIcon returns correct icon for file types', () => {
    expect(component.getFileIcon('application/pdf')).toBe('picture_as_pdf');
    expect(component.getFileIcon('image/jpeg')).toBe('image');
    expect(component.getFileIcon('text/plain')).toBe('insert_drive_file');
  });

  // ----------------------------------------------------------------
  // goBack()
  // ----------------------------------------------------------------
  it('goBack() navigates to attorney dashboard', () => {
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/attorney/dashboard']);
  });
});
