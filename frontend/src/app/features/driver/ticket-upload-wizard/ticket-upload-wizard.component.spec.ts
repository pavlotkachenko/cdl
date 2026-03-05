import { of, throwError } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { TicketUploadWizardComponent } from './ticket-upload-wizard.component';
import type { OCRResult } from '../../../core/services/ocr.service';

// -----------------------------------------------------------------------
// Direct unit tests — pure logic + OCR flow
// -----------------------------------------------------------------------

const fb = new FormBuilder();

function makeComponent() {
  const ocrSpy = {
    processTicketImage: vi.fn(),
    getConfidenceLevel: vi.fn().mockReturnValue({ level: 'high', color: '#4caf50', message: 'High' }),
    validateOCRData: vi.fn().mockReturnValue([]),
    getViolationTypes: vi.fn().mockReturnValue(of(['Speeding', 'HOS'])),
    getStates: vi.fn().mockReturnValue(of([{ code: 'CA', name: 'California' }])),
  };
  const caseServiceSpy = {
    createCase: vi.fn().mockReturnValue(of({ id: 'case-new' })),
  };
  const authServiceSpy = { currentUserValue: { id: 'driver-1' } };
  const snackBarSpy = { open: vi.fn() };
  const routerSpy = { navigate: vi.fn() };

  const component = new TicketUploadWizardComponent(
    fb,
    ocrSpy as any,
    caseServiceSpy as any,
    authServiceSpy as any,
    snackBarSpy as any,
    routerSpy as any,
  );

  // Initialize forms (normally called in ngOnInit)
  component.initializeForms();

  return { component, ocrSpy, caseServiceSpy, snackBarSpy, routerSpy };
}

describe('TicketUploadWizardComponent (unit)', () => {
  // -------------------------------------------------------------------
  // loadDropdownData()
  // -------------------------------------------------------------------
  it('loadDropdownData populates violationTypes and states', () => {
    const { component, ocrSpy } = makeComponent();
    component.loadDropdownData();
    expect(ocrSpy.getViolationTypes).toHaveBeenCalled();
    expect(ocrSpy.getStates).toHaveBeenCalled();
    expect(component.violationTypes).toContain('Speeding');
    expect(component.states).toHaveLength(1);
    expect(component.states[0].code).toBe('CA');
  });

  // -------------------------------------------------------------------
  // processWithOCR()
  // -------------------------------------------------------------------
  it('processWithOCR shows snackbar when no file selected', () => {
    const { component, snackBarSpy } = makeComponent();
    component.selectedFile = null;
    component.processWithOCR();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      expect.stringContaining('select'),
      expect.anything(),
      expect.any(Object),
    );
  });

  it('processWithOCR calls ocrService.processTicketImage with selected file', () => {
    const { component, ocrSpy } = makeComponent();
    const file = new File(['img'], 'ticket.jpg', { type: 'image/jpeg' });
    component.selectedFile = file;
    component.stepper = { next: vi.fn() } as any;

    const mockResult: OCRResult = {
      success: true,
      confidence: 0.92,
      extractedData: { ticketNumber: 'T-001', violationType: 'Speeding' },
      rawText: 'raw',
    };
    ocrSpy.processTicketImage.mockReturnValue(of(mockResult));
    ocrSpy.validateOCRData.mockReturnValue([]);

    component.processWithOCR();

    expect(ocrSpy.processTicketImage).toHaveBeenCalledWith(file);
    expect(component.ocrResult).toEqual(mockResult);
    expect(component.processingOCR).toBe(false);
  });

  it('processWithOCR patches ocrReviewForm with extracted data on success', () => {
    const { component, ocrSpy } = makeComponent();
    const file = new File(['img'], 'ticket.jpg', { type: 'image/jpeg' });
    component.selectedFile = file;
    component.stepper = { next: vi.fn() } as any;

    const extractedData = { ticketNumber: 'T-999', violationType: 'Speeding', state: 'TX', violationDate: '2026-01-01' };
    ocrSpy.processTicketImage.mockReturnValue(
      of({ success: true, confidence: 0.9, extractedData, rawText: '' }),
    );

    component.processWithOCR();

    expect(component.ocrReviewForm.value.ticketNumber).toBe('T-999');
    expect(component.ocrReviewForm.value.state).toBe('TX');
  });

  it('processWithOCR shows error snackbar and clears processingOCR on failure', () => {
    const { component, ocrSpy, snackBarSpy } = makeComponent();
    const file = new File(['img'], 'ticket.jpg', { type: 'image/jpeg' });
    component.selectedFile = file;
    ocrSpy.processTicketImage.mockReturnValue(throwError(() => new Error('OCR failed')));

    component.processWithOCR();

    expect(component.processingOCR).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      expect.stringContaining('Error processing'),
      expect.anything(),
      expect.any(Object),
    );
  });

  // -------------------------------------------------------------------
  // hasError() / hasWarning() / getErrorsForField()
  // -------------------------------------------------------------------
  it('hasError returns true when field has an error', () => {
    const { component } = makeComponent();
    component.ocrErrors = [{ field: 'ticketNumber', message: 'Required', severity: 'error' }];
    expect(component.hasError('ticketNumber')).toBe(true);
    expect(component.hasError('state')).toBe(false);
  });

  it('hasWarning returns true when field has a warning', () => {
    const { component } = makeComponent();
    component.ocrErrors = [{ field: 'fineAmount', message: 'Missing', severity: 'warning' }];
    expect(component.hasWarning('fineAmount')).toBe(true);
    expect(component.hasWarning('state')).toBe(false);
  });

  it('getErrorsForField filters errors by field name', () => {
    const { component } = makeComponent();
    component.ocrErrors = [
      { field: 'state', message: 'Required', severity: 'error' },
      { field: 'fineAmount', message: 'Missing', severity: 'warning' },
    ];
    const stateErrors = component.getErrorsForField('state');
    expect(stateErrors).toHaveLength(1);
    expect(stateErrors[0].message).toBe('Required');
  });

  // -------------------------------------------------------------------
  // canProceedToReview()
  // -------------------------------------------------------------------
  it('canProceedToReview returns false when required document is not uploaded', () => {
    const { component } = makeComponent();
    // 'ticket' is required and defaults to uploaded: false
    expect(component.canProceedToReview()).toBe(false);
  });

  it('canProceedToReview returns true when all required documents are uploaded', () => {
    const { component } = makeComponent();
    const required = component.documentChecklist.find(d => d.required)!;
    required.uploaded = true;
    expect(component.canProceedToReview()).toBe(true);
  });

  // -------------------------------------------------------------------
  // stopCamera()
  // -------------------------------------------------------------------
  it('stopCamera stops all tracks and clears cameraStream', () => {
    const { component } = makeComponent();
    const stopFn = vi.fn();
    component.cameraStream = { getTracks: () => [{ stop: stopFn }] } as any;
    component.stopCamera();
    expect(stopFn).toHaveBeenCalled();
    expect(component.cameraStream).toBeNull();
  });
});
