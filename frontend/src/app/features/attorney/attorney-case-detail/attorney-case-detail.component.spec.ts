import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { AttorneyCaseDetailComponent } from './attorney-case-detail.component';
import { AttorneyService, AttorneyCase, CaseDocument, CaseNote, CourtDate } from '../../../core/services/attorney.service';
import { MatSnackBar } from '@angular/material/snack-bar';

const CASE_ID = 'c1';
const MOCK_CASE: AttorneyCase = {
  id: CASE_ID, case_number: 'CASE-001', status: 'assigned_to_attorney',
  violation_type: 'Speeding', state: 'TX', driver_name: 'Alice', created_at: '2026-01-01',
};
const MOCK_DOCS: CaseDocument[] = [
  { id: 'd1', file_name: 'ticket.pdf', file_type: 'application/pdf', file_size: 1024, uploaded_at: '2026-01-01' },
];
const MOCK_NOTES: CaseNote[] = [
  { id: 'n1', content: 'Initial review done.', created_at: '2026-01-02' },
];
const MOCK_COURT_DATE: CourtDate = { id: 'cd1', court_date: '2026-04-15', location: 'Travis County Court' };

function makeServiceSpy(caseData = MOCK_CASE) {
  return {
    getCaseById: vi.fn().mockReturnValue(of({ data: caseData })),
    getDocuments: vi.fn().mockReturnValue(of({ documents: MOCK_DOCS })),
    getCaseNotes: vi.fn().mockReturnValue(of({ notes: MOCK_NOTES })),
    getCourtDate: vi.fn().mockReturnValue(of({ court_date: MOCK_COURT_DATE })),
    acceptCase: vi.fn().mockReturnValue(of(null)),
    declineCase: vi.fn().mockReturnValue(of(null)),
    updateStatus: vi.fn().mockReturnValue(of(null)),
    addNote: vi.fn().mockReturnValue(of({ note: { id: 'n2', content: 'New note', created_at: '2026-02-01' } })),
    setCourtDate: vi.fn().mockReturnValue(of(null)),
    uploadDocument: vi.fn().mockReturnValue(of({ document: { id: 'd2', file_name: 'new.pdf', file_type: 'application/pdf', file_size: 512, uploaded_at: '2026-02-01' } })),
  };
}

async function setup(spy = makeServiceSpy()) {
  const routerSpy = { navigate: vi.fn().mockResolvedValue(true) };

  await TestBed.configureTestingModule({
    imports: [AttorneyCaseDetailComponent, NoopAnimationsModule],
    providers: [
      { provide: AttorneyService, useValue: spy },
      { provide: ActivatedRoute, useValue: { snapshot: { params: { caseId: CASE_ID } } } },
      { provide: Router, useValue: routerSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AttorneyCaseDetailComponent);
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, spy, snackBar, router: routerSpy };
}

describe('AttorneyCaseDetailComponent', () => {
  // ----------------------------------------------------------------
  // Init
  // ----------------------------------------------------------------
  it('loads case, documents, notes and court date on init', async () => {
    const { component, spy } = await setup();
    expect(component.caseData()?.case_number).toBe('CASE-001');
    expect(component.documents().length).toBe(1);
    expect(component.notes().length).toBe(1);
    expect(component.courtDate()?.court_date).toBe('2026-04-15');
    expect(spy.getCaseNotes).toHaveBeenCalledWith(CASE_ID);
    expect(spy.getCourtDate).toHaveBeenCalledWith(CASE_ID);
  });

  it('shows Accept/Decline buttons when status is assigned_to_attorney', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Accept Case');
    expect(el.textContent).toContain('Decline');
  });

  // ----------------------------------------------------------------
  // Accept / Decline / Status
  // ----------------------------------------------------------------
  it('accept() calls AttorneyService.acceptCase and shows snackBar', async () => {
    const { component, spy, snackBar } = await setup();
    component.accept();
    expect(spy.acceptCase).toHaveBeenCalledWith(CASE_ID);
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('accept'), 'Close', expect.any(Object),
    );
  });

  it('decline() calls service and navigates to dashboard', async () => {
    const { component, spy, router } = await setup();
    component.decline();
    expect(spy.declineCase).toHaveBeenCalledWith(CASE_ID);
    expect(router.navigate).toHaveBeenCalledWith(['/attorney/dashboard']);
  });

  it('updateStatus() calls service with selected status and clears selection', async () => {
    const activeCaseSpy = makeServiceSpy({ ...MOCK_CASE, status: 'send_info_to_attorney' });
    const { component, spy } = await setup(activeCaseSpy);
    component.selectedStatus.set('call_court');
    component.updateStatus();
    expect(spy.updateStatus).toHaveBeenCalledWith(CASE_ID, 'call_court');
    expect(component.selectedStatus()).toBe('');
  });

  it('goBack() navigates to /attorney/dashboard', async () => {
    const { component, router } = await setup();
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/attorney/dashboard']);
  });

  it('getStatusLabel() maps status codes to human labels', async () => {
    const { component } = await setup();
    expect(component.getStatusLabel('assigned_to_attorney')).toBe('Pending Acceptance');
    expect(component.getStatusLabel('send_info_to_attorney')).toBe('Active');
    expect(component.getStatusLabel('closed')).toBe('Closed');
  });

  // ----------------------------------------------------------------
  // Case notes
  // ----------------------------------------------------------------
  it('saveNote() calls addNote and prepends note to list', async () => {
    const { component, spy } = await setup();
    component.newNote.set('Reviewed evidence.');
    component.saveNote();
    expect(spy.addNote).toHaveBeenCalledWith(CASE_ID, 'Reviewed evidence.');
    expect(component.notes()[0].content).toBe('New note');
    expect(component.newNote()).toBe('');
    expect(component.addingNote()).toBe(false);
  });

  it('saveNote() does nothing when note content is blank', async () => {
    const { component, spy } = await setup();
    component.newNote.set('   ');
    component.saveNote();
    expect(spy.addNote).not.toHaveBeenCalled();
  });

  it('saveNote() shows error snackBar when service fails', async () => {
    const spy = makeServiceSpy();
    spy.addNote.mockReturnValue(throwError(() => new Error('fail')));
    const { component, snackBar } = await setup(spy);
    component.newNote.set('Test note');
    component.saveNote();
    expect(snackBar.open).toHaveBeenCalledWith(expect.stringContaining('Failed'), 'Close', expect.any(Object));
  });

  // ----------------------------------------------------------------
  // Court date
  // ----------------------------------------------------------------
  it('saveCourtDate() calls setCourtDate with date and location', async () => {
    const { component, spy, snackBar } = await setup();
    component.courtDateInput.set('2026-06-01');
    component.courtLocation.set('Travis County');
    component.saveCourtDate();
    expect(spy.setCourtDate).toHaveBeenCalledWith(CASE_ID, '2026-06-01', 'Travis County');
    expect(component.courtDate()?.court_date).toBe('2026-06-01');
    expect(snackBar.open).toHaveBeenCalledWith(expect.stringContaining('saved'), 'Close', expect.any(Object));
  });

  it('saveCourtDate() does nothing when date input is empty', async () => {
    const { component, spy } = await setup();
    component.courtDateInput.set('');
    component.saveCourtDate();
    expect(spy.setCourtDate).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // Document upload
  // ----------------------------------------------------------------
  it('onFileSelected() calls uploadDocument and appends to documents list', async () => {
    const { component, spy } = await setup();
    const file = new File(['data'], 'evidence.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file], value: '' } } as any;
    component.onFileSelected(event);
    expect(spy.uploadDocument).toHaveBeenCalledWith(CASE_ID, file);
    expect(component.documents().some(d => d.file_name === 'new.pdf')).toBe(true);
    expect(component.uploading()).toBe(false);
  });

  it('onFileSelected() does nothing when no file is selected', async () => {
    const { component, spy } = await setup();
    component.onFileSelected({ target: { files: [] } } as any);
    expect(spy.uploadDocument).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // formatDate
  // ----------------------------------------------------------------
  it('formatDate() formats ISO date string to a non-empty readable string', async () => {
    const { component } = await setup();
    const result = component.formatDate('2026-04-15');
    expect(result).toContain('2026');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formatDate() returns empty string for falsy input', async () => {
    const { component } = await setup();
    expect(component.formatDate('')).toBe('');
  });
});
