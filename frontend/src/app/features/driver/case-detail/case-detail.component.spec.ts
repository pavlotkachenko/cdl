import { of, Subject } from 'rxjs';
import { CaseDetailComponent } from './case-detail.component';

// -----------------------------------------------------------------------
// Direct unit tests — pure logic / helper methods
// -----------------------------------------------------------------------

function makeComponent() {
  const caseServiceSpy = {
    getCaseById: vi.fn().mockReturnValue(of({ data: { id: 'case-1', case_number: 'CDL-001', status: 'new', documents: [], statusHistory: [] } })),
    listDocuments: vi.fn().mockReturnValue(of({ documents: [] })),
    uploadDocument: vi.fn().mockReturnValue(of({ id: 'doc-1' })),
    deleteDocument: vi.fn().mockReturnValue(of({})),
  };
  const pdfSpy = { generateCasePdf: vi.fn() };
  const socketSpy = {
    connect: vi.fn(),
    joinCase: vi.fn(),
    leaveCase: vi.fn(),
    onCaseStatusUpdate: vi.fn().mockReturnValue(new Subject()),
  };
  const routeSpy = { params: of({ id: 'case-1' }) };
  const routerSpy = { navigate: vi.fn() };
  const fbSpy = {
    group: vi.fn().mockReturnValue({
      invalid: false,
      value: { comment: 'Test comment' },
      reset: vi.fn(),
      get: vi.fn().mockReturnValue({ errors: {} }),
    }),
  };
  const snackBarSpy = { open: vi.fn() };
  const cdrSpy = { detectChanges: vi.fn() };

  const component = new CaseDetailComponent(
    routeSpy as any,
    routerSpy as any,
    caseServiceSpy as any,
    pdfSpy as any,
    socketSpy as any,
    fbSpy as any,
    snackBarSpy as any,
    cdrSpy as any,
  );

  return { component, routerSpy, caseServiceSpy, socketSpy };
}

describe('CaseDetailComponent (unit)', () => {
  // -------------------------------------------------------------------
  // getStatusLabel()
  // -------------------------------------------------------------------
  it.each([
    ['new', 'Submitted'],
    ['reviewed', 'Under Review'],
    ['assigned_to_attorney', 'Attorney Assigned'],
    ['waiting_for_driver', 'Response Needed'],
    ['send_info_to_attorney', 'With Your Attorney'],
    ['pay_attorney', 'Payment Due'],
    ['closed', 'Case Closed'],
  ])('getStatusLabel("%s") → "%s"', (status, expected) => {
    const { component } = makeComponent();
    expect(component.getStatusLabel(status)).toBe(expected);
  });

  it('getStatusLabel returns status as-is for unknown status', () => {
    const { component } = makeComponent();
    expect(component.getStatusLabel('unknown_xyz')).toBe('unknown_xyz');
  });

  // -------------------------------------------------------------------
  // getStatusClass()
  // -------------------------------------------------------------------
  it('getStatusClass returns status-new for new', () => {
    const { component } = makeComponent();
    expect(component.getStatusClass('new')).toBe('status-new');
  });

  it('getStatusClass returns status-success for closed', () => {
    const { component } = makeComponent();
    expect(component.getStatusClass('closed')).toBe('status-success');
  });

  it('getStatusClass returns status-default for unknown', () => {
    const { component } = makeComponent();
    expect(component.getStatusClass('unknown')).toBe('status-default');
  });

  // -------------------------------------------------------------------
  // getStatusIcon()
  // -------------------------------------------------------------------
  it('getStatusIcon returns fiber_new for new', () => {
    const { component } = makeComponent();
    expect(component.getStatusIcon('new')).toBe('fiber_new');
  });

  it('getStatusIcon returns info for unknown', () => {
    const { component } = makeComponent();
    expect(component.getStatusIcon('unknown')).toBe('info');
  });

  // -------------------------------------------------------------------
  // getFileIcon()
  // -------------------------------------------------------------------
  it('getFileIcon returns picture_as_pdf for pdf', () => {
    const { component } = makeComponent();
    expect(component.getFileIcon('ticket.pdf')).toBe('picture_as_pdf');
  });

  it('getFileIcon returns image for jpg/png', () => {
    const { component } = makeComponent();
    expect(component.getFileIcon('photo.jpg')).toBe('image');
    expect(component.getFileIcon('photo.png')).toBe('image');
  });

  it('getFileIcon returns description for docx', () => {
    const { component } = makeComponent();
    expect(component.getFileIcon('contract.docx')).toBe('description');
  });

  it('getFileIcon returns insert_drive_file for unknown extension', () => {
    const { component } = makeComponent();
    expect(component.getFileIcon('data.csv')).toBe('insert_drive_file');
  });

  // -------------------------------------------------------------------
  // formatFileSize()
  // -------------------------------------------------------------------
  it('formatFileSize returns bytes for small files', () => {
    const { component } = makeComponent();
    expect(component.formatFileSize(500)).toBe('500 B');
  });

  it('formatFileSize returns KB for kilobyte-range files', () => {
    const { component } = makeComponent();
    expect(component.formatFileSize(2048)).toBe('2.0 KB');
  });

  it('formatFileSize returns MB for megabyte-range files', () => {
    const { component } = makeComponent();
    expect(component.formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  // -------------------------------------------------------------------
  // goBack() / payAttorneyFee()
  // -------------------------------------------------------------------
  it('goBack navigates to /driver/tickets', () => {
    const { component, routerSpy } = makeComponent();
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver/tickets']);
  });

  it('payAttorneyFee navigates to pay route for the case', () => {
    const { component, routerSpy } = makeComponent();
    component.caseId = 'case-1';
    component.payAttorneyFee();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver/cases', 'case-1', 'pay']);
  });

  // -------------------------------------------------------------------
  // ngOnInit — service calls
  // -------------------------------------------------------------------
  it('ngOnInit loads case details and documents', () => {
    const { component, caseServiceSpy, socketSpy } = makeComponent();
    component.ngOnInit();
    expect(caseServiceSpy.getCaseById).toHaveBeenCalledWith('case-1');
    expect(caseServiceSpy.listDocuments).toHaveBeenCalledWith('case-1');
    expect(socketSpy.connect).toHaveBeenCalled();
    component.ngOnDestroy();
  });
});
