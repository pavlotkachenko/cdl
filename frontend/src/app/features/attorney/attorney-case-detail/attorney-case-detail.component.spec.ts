import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { AttorneyCaseDetailComponent } from './attorney-case-detail.component';
import { AttorneyService, AttorneyCase, CaseDocument } from '../../../core/services/attorney.service';
import { MatSnackBar } from '@angular/material/snack-bar';

const CASE_ID = 'c1';
const MOCK_CASE: AttorneyCase = {
  id: CASE_ID, case_number: 'CASE-001', status: 'assigned_to_attorney',
  violation_type: 'Speeding', state: 'TX', driver_name: 'Alice', created_at: '2026-01-01',
};
const MOCK_DOCS: CaseDocument[] = [
  { id: 'd1', file_name: 'ticket.pdf', file_type: 'application/pdf', file_size: 1024, uploaded_at: '2026-01-01' },
];

function makeServiceSpy(caseData = MOCK_CASE) {
  return {
    getCaseById: vi.fn().mockReturnValue(of({ data: caseData })),
    getDocuments: vi.fn().mockReturnValue(of({ documents: MOCK_DOCS })),
    acceptCase: vi.fn().mockReturnValue(of(null)),
    declineCase: vi.fn().mockReturnValue(of(null)),
    updateStatus: vi.fn().mockReturnValue(of(null)),
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
  it('loads case and documents on init', async () => {
    const { component } = await setup();
    expect(component.caseData()?.case_number).toBe('CASE-001');
    expect(component.documents().length).toBe(1);
  });

  it('shows Accept/Decline buttons when status is assigned_to_attorney', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Accept Case');
    expect(el.textContent).toContain('Decline');
  });

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
});
