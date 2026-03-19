import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { CaseDetailComponent } from './case-detail.component';

const CASE_ID = 'case-42';

const MOCK_CASE = {
  id: CASE_ID,
  case_number: 'CASE-2026-000847',
  ticketNumber: 'CASE-2026-000847',
  violation_type: 'speeding',
  type: 'speeding',
  status: 'assigned_to_attorney',
  citationNumber: 'CT-SPD-789456',
  violationDate: '2026-03-01',
  location: 'I-35 North, Texas',
  state: 'TX',
  description: 'Speeding 15 mph over limit',
  courtDate: '2099-06-15',
  created_at: '2026-03-05T14:30:00Z',
  attorney: {
    id: 'att-1',
    full_name: 'Sarah Johnson',
    email: 'sarah@law.com',
    phone: '555-1234',
    win_rate: 92,
    years_experience: 8,
    cases_won: 340,
  },
  attorney_price: 450,
  statusHistory: [
    { status: 'new', changed_by: 'System', changed_at: '2026-03-05T14:30:00Z', notes: 'Case submitted' },
    { status: 'reviewed', changed_by: 'Jane Operator', changed_at: '2026-03-06T09:00:00Z', notes: 'Reviewed' },
    { status: 'assigned_to_attorney', changed_by: 'Jane Operator', changed_at: '2026-03-07T11:00:00Z', notes: 'Assigned to Sarah' },
  ],
  documents: [],
};

const MOCK_MESSAGES = [
  { id: 'msg-1', content: 'Hello, I have a question about my case', sender_name: 'Miguel Driver', sender_role: 'driver', created_at: '2026-03-08T10:00:00Z' },
  { id: 'msg-2', content: 'Sure, I will look into it right away for you', sender_name: 'Sarah Johnson', sender_role: 'attorney', created_at: '2026-03-08T11:00:00Z' },
];

const MOCK_ACTIVITY = [
  { id: 'act-1', action: 'Case submitted', user_name: 'Miguel Driver', created_at: '2026-03-05T14:30:00Z' },
  { id: 'act-2', action: 'Status changed to Under Review', user_name: 'Jane Operator', created_at: '2026-03-06T09:00:00Z' },
  { id: 'act-3', action: 'Attorney assigned', user_name: 'Jane Operator', created_at: '2026-03-07T11:00:00Z' },
  { id: 'act-4', action: 'Document uploaded', user_name: 'Miguel Driver', created_at: '2026-03-07T12:00:00Z' },
  { id: 'act-5', action: 'Message sent', user_name: 'Miguel Driver', created_at: '2026-03-08T10:00:00Z' },
  { id: 'act-6', action: 'Message sent', user_name: 'Sarah Johnson', created_at: '2026-03-08T11:00:00Z' },
];

function makeSpies() {
  return {
    caseService: {
      getCaseById: vi.fn().mockReturnValue(of({ data: MOCK_CASE })),
      listDocuments: vi.fn().mockReturnValue(of({ documents: [] })),
      uploadDocument: vi.fn().mockReturnValue(of({ id: 'doc-1', fileName: 'test.pdf' })),
      deleteDocument: vi.fn().mockReturnValue(of({})),
      getCaseMessagesForDriver: vi.fn().mockReturnValue(of({ data: { messages: [] } })),
      sendCaseMessageForDriver: vi.fn().mockReturnValue(of({ data: { id: 'msg-new', content: 'Test' } })),
      getCaseActivity: vi.fn().mockReturnValue(of({ activities: [] })),
      updateCase: vi.fn().mockReturnValue(of({ data: MOCK_CASE })),
    },
    pdfService: { generateCasePdf: vi.fn() },
    socketService: {
      connect: vi.fn(),
      joinCase: vi.fn(),
      leaveCase: vi.fn(),
      onCaseStatusUpdate: vi.fn().mockReturnValue(new Subject()),
    },
    router: { navigate: vi.fn() },
  };
}

async function setup(overrides?: {
  caseResponse?: any;
  docsResponse?: any;
  messagesResponse?: any;
  activityResponse?: any;
}) {
  const spies = makeSpies();

  if (overrides?.caseResponse) {
    spies.caseService.getCaseById.mockReturnValue(overrides.caseResponse);
  }
  if (overrides?.docsResponse) {
    spies.caseService.listDocuments.mockReturnValue(overrides.docsResponse);
  }
  if (overrides?.messagesResponse) {
    spies.caseService.getCaseMessagesForDriver.mockReturnValue(overrides.messagesResponse);
  }
  if (overrides?.activityResponse) {
    spies.caseService.getCaseActivity.mockReturnValue(overrides.activityResponse);
  }

  await TestBed.configureTestingModule({
    imports: [CaseDetailComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { params: of({ caseId: CASE_ID }) } },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<CaseDetailComponent> = TestBed.createComponent(CaseDetailComponent);
  const component = fixture.componentInstance;

  // Override injected services with spies
  (component as any).caseService = spies.caseService;
  (component as any).pdfGeneratorService = spies.pdfService;
  (component as any).socketService = spies.socketService;

  // Spy on the real router's navigate method
  const realRouter = TestBed.inject(Router);
  spies.router = { navigate: vi.spyOn(realRouter, 'navigate').mockReturnValue(Promise.resolve(true)) } as any;
  (component as any).router = realRouter;

  return { fixture, component, spies };
}

describe('CaseDetailComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ── Hero header ──────────────────────────────────────────
  it('renders case number and status badge', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h1')?.textContent).toContain('CASE-2026-000847');
    expect(el.querySelector('.status-badge')?.textContent).toContain('Attorney Assigned');
  });

  it('shows violation type label', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('.violation-label');
    expect(label?.textContent).toContain('speeding');
  });

  // ── Stat strip ───────────────────────────────────────────
  it('stat strip shows days open, court countdown, and document count', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    const stats = fixture.nativeElement.querySelectorAll('.stat-item');
    expect(stats.length).toBeGreaterThanOrEqual(2);

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Days Open');
    expect(text).toContain('Days to Court');
    expect(text).toContain('Documents');
  });

  // ── Info grid ────────────────────────────────────────────
  it('info grid displays all case fields', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('CT-SPD-789456');
    expect(text).toContain('I-35 North, Texas');
    expect(text).toContain('TX');
    expect(text).toContain('Speeding 15 mph over limit');
  });

  // ── Attorney card ────────────────────────────────────────
  it('attorney card shows initials, name, and stats', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.attorney-avatar')?.textContent?.trim()).toBe('SJ');
    expect(el.textContent).toContain('Sarah Johnson');
    expect(el.textContent).toContain('92%');
    expect(el.textContent).toContain('8');
    expect(el.textContent).toContain('340');
  });

  // ── Status timeline ──────────────────────────────────────
  it('renders status timeline with done/current states', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.timeline-item');
    expect(items.length).toBe(3);

    expect(items[0].classList.contains('timeline-done')).toBe(true);
    expect(items[2].classList.contains('timeline-current')).toBe(true);

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Submitted');
    expect(text).toContain('Under Review');
    expect(text).toContain('Attorney Assigned');
    expect(text).toContain('Jane Operator');
  });

  // ── Court date alert ─────────────────────────────────────
  it('shows court date alert when court date is in the future', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.alert-court');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Court Date Approaching');
  });

  it('hides court date alert when no court date', async () => {
    const noCourt = { ...MOCK_CASE, courtDate: undefined, court_date: undefined };
    const { fixture, component } = await setup({ caseResponse: of({ data: noCourt }) });
    component.ngOnInit();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.alert-court')).toBeNull();
  });

  // ── Pay attorney alert ───────────────────────────────────
  it('shows pay attorney alert when status is pay_attorney', async () => {
    const payCase = { ...MOCK_CASE, status: 'pay_attorney', attorney_price: 450 };
    const { fixture, component } = await setup({ caseResponse: of({ data: payCase }) });
    component.ngOnInit();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.alert-pay');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Attorney Fee Due');
    expect(alert.textContent).toContain('450');
  });

  // ── Quick actions ────────────────────────────────────────
  it('quick actions grid renders 6 action buttons', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    const btns = fixture.nativeElement.querySelectorAll('.action-btn');
    expect(btns.length).toBe(6);
  });

  // ── Navigation ───────────────────────────────────────────
  it('goBack navigates to /driver/tickets', async () => {
    const { component, spies } = await setup();
    component.goBack();
    expect(spies.router.navigate).toHaveBeenCalledWith(['/driver/tickets']);
  });

  it('payAttorneyFee navigates to pay route', async () => {
    const { component, spies } = await setup();
    component.ngOnInit();
    component.payAttorneyFee();
    expect(spies.router.navigate).toHaveBeenCalledWith(['/driver/cases', CASE_ID, 'pay']);
  });

  // ── Loading state ────────────────────────────────────────
  it('shows loading state while data loads', async () => {
    const neverResolve = new Subject();
    const { fixture, component } = await setup({ caseResponse: neverResolve.asObservable() });
    component.ngOnInit();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.spinner')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Loading case details');
  });

  // ── Error state ──────────────────────────────────────────
  it('shows error state when API fails', async () => {
    const err$ = new Subject();
    const { fixture, component } = await setup({ caseResponse: err$.asObservable() });
    component.ngOnInit();
    fixture.detectChanges();

    err$.error({ error: { message: 'Not found' } });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.error-state')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Not found');
  });

  // ── PDF export ───────────────────────────────────────────
  it('exportToPDF calls PdfGeneratorService', async () => {
    vi.useFakeTimers();
    const { component, spies } = await setup();
    component.ngOnInit();

    component.exportToPDF();
    expect(component.exportingPdf()).toBe(true);

    vi.advanceTimersByTime(600);
    expect(spies.pdfService.generateCasePdf).toHaveBeenCalled();
    expect(component.exportingPdf()).toBe(false);
    vi.useRealTimers();
  });

  // ── Document operations ──────────────────────────────────
  it('upload triggers caseService.uploadDocument', async () => {
    const { component, spies } = await setup();
    component.ngOnInit();

    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    component.onFileSelected(event);
    expect(spies.caseService.uploadDocument).toHaveBeenCalledWith(CASE_ID, file);
  });

  it('deleteDoc calls caseService.deleteDocument', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { component, spies } = await setup();
    component.ngOnInit();

    component.deleteDoc('doc-1');
    expect(spies.caseService.deleteDocument).toHaveBeenCalledWith(CASE_ID, 'doc-1');
  });

  // ── Socket ───────────────────────────────────────────────
  it('connects to socket on init and leaves on destroy', async () => {
    const { component, spies } = await setup();
    component.ngOnInit();
    expect(spies.socketService.connect).toHaveBeenCalled();
    expect(spies.socketService.joinCase).toHaveBeenCalledWith(CASE_ID);

    component.ngOnDestroy();
    expect(spies.socketService.leaveCase).toHaveBeenCalledWith(CASE_ID);
  });

  // ── Status helpers ───────────────────────────────────────
  it.each([
    ['new', 'Submitted'],
    ['reviewed', 'Under Review'],
    ['assigned_to_attorney', 'Attorney Assigned'],
    ['closed', 'Case Closed'],
  ])('getStatusLabel("%s") → "%s"', async (status, expected) => {
    const { component } = await setup();
    expect(component.getStatusLabel(status)).toBe(expected);
  });

  it('getStatusClass returns correct class', async () => {
    const { component } = await setup();
    expect(component.getStatusClass('new')).toBe('status-new');
    expect(component.getStatusClass('closed')).toBe('status-success');
    expect(component.getStatusClass('unknown')).toBe('status-default');
  });

  // ── File helpers ─────────────────────────────────────────
  it('formatFileSize returns correct strings', async () => {
    const { component } = await setup();
    expect(component.formatFileSize(500)).toBe('500 B');
    expect(component.formatFileSize(2048)).toBe('2.0 KB');
    expect(component.formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  // ── Secure footer ────────────────────────────────────────
  it('displays secure footer', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    const footer = fixture.nativeElement.querySelector('.secure-footer');
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain('bank-level encryption');
  });

  // ── CD-5: Messaging ─────────────────────────────────────
  it('renders messages from API', async () => {
    const { fixture, component } = await setup({
      messagesResponse: of({ data: { messages: MOCK_MESSAGES } }),
    });
    component.ngOnInit();
    fixture.detectChanges();

    const bubbles = fixture.nativeElement.querySelectorAll('.message-bubble');
    expect(bubbles.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Miguel Driver');
    expect(fixture.nativeElement.textContent).toContain('Sarah Johnson');
  });

  it('messages display role badges', async () => {
    const { fixture, component } = await setup({
      messagesResponse: of({ data: { messages: MOCK_MESSAGES } }),
    });
    component.ngOnInit();
    fixture.detectChanges();

    const badges = fixture.nativeElement.querySelectorAll('.message-role-badge');
    expect(badges.length).toBe(2);
    expect(badges[0].textContent).toContain('Driver');
    expect(badges[1].textContent).toContain('Attorney');
  });

  it('driver and attorney messages have different styling', async () => {
    const { fixture, component } = await setup({
      messagesResponse: of({ data: { messages: MOCK_MESSAGES } }),
    });
    component.ngOnInit();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.message-driver').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.message-staff').length).toBe(1);
  });

  it('send message calls POST and clears form', async () => {
    const { fixture, component, spies } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    component.messageForm.patchValue({ content: 'Hello from the test suite' });
    component.sendMessage();

    expect(spies.caseService.sendCaseMessageForDriver).toHaveBeenCalledWith(CASE_ID, 'Hello from the test suite');
    expect(component.messageForm.value.content).toBe('');
  });

  it('send message shows error on failure', async () => {
    const { component, spies } = await setup();
    spies.caseService.sendCaseMessageForDriver.mockReturnValue(
      throwError(() => ({ error: { message: 'Send failed' } })),
    );
    component.ngOnInit();

    component.messageForm.patchValue({ content: 'Hello from the test suite' });
    component.sendMessage();

    expect(component.messageError()).toBe('Send failed');
    expect(component.sendingMessage()).toBe(false);
  });

  it('message form disabled when < 10 characters', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    component.messageForm.patchValue({ content: 'short' });
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.btn-send') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('shows attorney-client privilege notice', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    const notice = fixture.nativeElement.querySelector('.privilege-notice');
    expect(notice).toBeTruthy();
    expect(notice.textContent).toContain('attorney-client privilege');
  });

  it('shows empty state when no messages', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    const messagingCard = fixture.nativeElement.querySelector('.messaging-card');
    expect(messagingCard.textContent).toContain('No messages yet');
  });

  // ── CD-5: Activity Log ──────────────────────────────────
  it('renders activity log entries from API', async () => {
    const { fixture, component } = await setup({
      activityResponse: of({ activities: MOCK_ACTIVITY.slice(0, 3) }),
    });
    component.ngOnInit();
    fixture.detectChanges();

    const entries = fixture.nativeElement.querySelectorAll('.activity-entry');
    expect(entries.length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Case submitted');
  });

  it('activity log collapses when > 5 entries', async () => {
    const { fixture, component } = await setup({
      activityResponse: of({ activities: MOCK_ACTIVITY }),
    });
    component.ngOnInit();
    fixture.detectChanges();

    // Should show only 5 entries when collapsed
    const entries = fixture.nativeElement.querySelectorAll('.activity-entry');
    expect(entries.length).toBe(5);

    // Should show "Show more" button
    const showMore = fixture.nativeElement.querySelector('.btn-link');
    expect(showMore).toBeTruthy();
    expect(showMore.textContent).toContain('1 more');

    // Expand
    component.toggleActivity();
    fixture.detectChanges();
    const allEntries = fixture.nativeElement.querySelectorAll('.activity-entry');
    expect(allEntries.length).toBe(6);
  });

  it('shows empty state when no activity', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    const activityCard = fixture.nativeElement.querySelector('.activity-card');
    expect(activityCard.textContent).toContain('No activity recorded yet');
  });

  // ── CD-6: Edit Mode ─────────────────────────────────────
  it('edit button toggles edit mode', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.isEditing()).toBe(false);
    component.toggleEdit();
    expect(component.isEditing()).toBe(true);
    expect(component.editForm.value.description).toBe('Speeding 15 mph over limit');
    expect(component.editForm.value.location).toBe('I-35 North, Texas');
  });

  it('edit mode shows editable description and location', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    component.toggleEdit();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.edit-textarea')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.edit-input')).toBeTruthy();
  });

  it('cancel resets form and exits edit mode', async () => {
    const { component } = await setup();
    component.ngOnInit();

    component.toggleEdit();
    component.editForm.patchValue({ description: 'Changed!' });
    component.cancelEdit();

    expect(component.isEditing()).toBe(false);
  });

  it('save calls updateCase with correct fields', async () => {
    const { component, spies } = await setup();
    component.ngOnInit();

    component.toggleEdit();
    component.editForm.patchValue({ description: 'Updated description', location: 'New Location' });
    component.saveEdit();

    expect(spies.caseService.updateCase).toHaveBeenCalledWith(CASE_ID, {
      description: 'Updated description',
      location: 'New Location',
    });
  });

  it('save disables button during request', async () => {
    const saveSubject = new Subject();
    const { component, spies } = await setup();
    spies.caseService.updateCase.mockReturnValue(saveSubject.asObservable());
    component.ngOnInit();

    component.toggleEdit();
    component.editForm.patchValue({ description: 'New desc' });
    component.saveEdit();

    expect(component.saving()).toBe(true);

    saveSubject.next({ data: MOCK_CASE });
    saveSubject.complete();
    expect(component.saving()).toBe(false);
    expect(component.isEditing()).toBe(false);
  });

  it('failed save shows error and stays in edit mode', async () => {
    const { component, spies } = await setup();
    spies.caseService.updateCase.mockReturnValue(
      throwError(() => ({ error: { message: 'Forbidden' } })),
    );
    component.ngOnInit();

    component.toggleEdit();
    component.editForm.patchValue({ description: 'Changed' });
    component.saveEdit();

    expect(component.saving()).toBe(false);
    expect(component.isEditing()).toBe(true);
    expect(component.toastMessage()).toContain('Forbidden');
  });

  // ── CD-7: Share Case ─────────────────────────────────────
  it('share button exists in quick actions', async () => {
    const { fixture, component } = await setup();
    component.ngOnInit();
    fixture.detectChanges();

    const btns = fixture.nativeElement.querySelectorAll('.action-btn');
    const shareBtn = Array.from(btns).find((b: any) => b.textContent.includes('Share Case'));
    expect(shareBtn).toBeTruthy();
  });

  it('shareCase copies summary to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

    const { component } = await setup();
    component.ngOnInit();

    await component.shareCase();

    expect(writeTextMock).toHaveBeenCalled();
    const summary = writeTextMock.mock.calls[0][0] as string;
    expect(summary).toContain('CASE-2026-000847');
    expect(summary).toContain('Attorney Assigned');
    expect(summary).toContain('speeding');
    expect(summary).toContain('Sarah Johnson');
  });

  it('shareCase shows copied feedback', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });

    const { component } = await setup();
    component.ngOnInit();

    await component.shareCase();
    expect(component.shareCopyFeedback()).toBe(true);
  });

  it('shareCase handles clipboard failure gracefully', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } });

    const { component } = await setup();
    component.ngOnInit();

    await component.shareCase();
    expect(component.toastMessage()).toContain('Copy not supported');
  });
});
