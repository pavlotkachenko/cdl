import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { SubmitTicketComponent } from './submit-ticket.component';
import { CaseService } from '../../../core/services/case.service';
import { OcrService, OCRResult } from '../../../core/services/ocr.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

const MOCK_OCR: OCRResult = {
  success: true,
  confidence: 0.9,
  rawText: 'ticket raw text',
  extractedData: {
    ticketNumber: 'TX-12345',
    violationDate: '2026-03-01',
    state: 'TX',
    location: 'I-35 Austin',
    courtDate: '2026-04-15',
  },
};

function makeFile(name = 'ticket.pdf', type = 'application/pdf', size = 1024): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

async function setup() {
  const caseServiceSpy = {
    createCase: vi.fn().mockReturnValue(of({ id: 'CASE-001' })),
  };
  const ocrServiceSpy = {
    processTicketImage: vi.fn().mockReturnValue(of(MOCK_OCR)),
  };
  const routerSpy = { navigate: vi.fn().mockResolvedValue(true) };
  const authServiceSpy = {
    currentUserValue: { id: 'user-1', email: 'driver@test.com', role: 'driver', name: 'Test Driver', phone: '555-1234' },
  };

  await TestBed.configureTestingModule({
    imports: [SubmitTicketComponent, NoopAnimationsModule],
    providers: [
      { provide: CaseService, useValue: caseServiceSpy },
      { provide: OcrService, useValue: ocrServiceSpy },
      { provide: Router, useValue: routerSpy },
      { provide: AuthService, useValue: authServiceSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(SubmitTicketComponent);
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  fixture.detectChanges();

  return {
    fixture,
    component: fixture.componentInstance,
    caseService: caseServiceSpy,
    ocrService: ocrServiceSpy,
    router: routerSpy,
    authService: authServiceSpy,
    snackBar,
  };
}

describe('SubmitTicketComponent', () => {
  // ----------------------------------------------------------------
  // Stepper navigation
  // ----------------------------------------------------------------
  it('starts at step 0', async () => {
    const { component } = await setup();
    expect(component.currentStep()).toBe(0);
  });

  it('nextStep() advances by one', async () => {
    const { component } = await setup();
    component.nextStep();
    expect(component.currentStep()).toBe(1);
  });

  it('prevStep() goes back by one', async () => {
    const { component } = await setup();
    component.currentStep.set(2);
    component.prevStep();
    expect(component.currentStep()).toBe(1);
  });

  it('goToStep() clamps to valid range', async () => {
    const { component } = await setup();
    component.goToStep(-1);
    expect(component.currentStep()).toBe(0);
    component.goToStep(99);
    expect(component.currentStep()).toBe(0); // didn't change — out of range
  });

  it('goToStep() sets valid step', async () => {
    const { component } = await setup();
    component.goToStep(3);
    expect(component.currentStep()).toBe(3);
  });

  // ----------------------------------------------------------------
  // Violation type chips
  // ----------------------------------------------------------------
  it('selectViolationType() sets form value', async () => {
    const { component } = await setup();
    component.selectViolationType('hos_logbook');
    expect(component.ticketTypeForm.get('type')?.value).toBe('hos_logbook');
  });

  it('onChipKeydown() selects on Enter', async () => {
    const { component } = await setup();
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    vi.spyOn(event, 'preventDefault');
    component.onChipKeydown(event, 'suspension');
    expect(component.ticketTypeForm.get('type')?.value).toBe('suspension');
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('onChipKeydown() selects on Space', async () => {
    const { component } = await setup();
    const event = new KeyboardEvent('keydown', { key: ' ' });
    vi.spyOn(event, 'preventDefault');
    component.onChipKeydown(event, 'csa_score');
    expect(component.ticketTypeForm.get('type')?.value).toBe('csa_score');
  });

  it('onChipKeydown() ignores other keys', async () => {
    const { component } = await setup();
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    component.onChipKeydown(event, 'dqf');
    expect(component.ticketTypeForm.get('type')?.value).toBe('');
  });

  // ----------------------------------------------------------------
  // Computed signals
  // ----------------------------------------------------------------
  it('selectedTypeName returns label for selected chip', async () => {
    const { component } = await setup();
    component.selectViolationType('dot_inspection');
    expect(component.selectedTypeName()).toBe('DOT Inspection');
  });

  it('selectedStateName returns full name for state code', async () => {
    const { component } = await setup();
    component.ticketDetailsForm.get('state')?.setValue('CA');
    expect(component.selectedStateName()).toBe('California');
  });

  it('progressPercent computes correctly', async () => {
    const { component } = await setup();
    expect(component.progressPercent()).toBe(25); // step 0 of 4
    component.currentStep.set(3);
    expect(component.progressPercent()).toBe(100);
  });

  it('canProceedFromType is false when no type selected', async () => {
    const { component } = await setup();
    expect(component.canProceedFromType()).toBe(false);
  });

  it('canProceedFromType is true when type selected', async () => {
    const { component } = await setup();
    component.selectViolationType('speeding');
    expect(component.canProceedFromType()).toBe(true);
  });

  // ----------------------------------------------------------------
  // OCR scan
  // ----------------------------------------------------------------
  it('onScanFileSelected() calls OCR service and sets ocrResult', async () => {
    const { component, ocrService } = await setup();
    const file = makeFile();
    const event = { target: { files: [file] } } as any;
    component.onScanFileSelected(event);
    expect(ocrService.processTicketImage).toHaveBeenCalledWith(file);
    expect(component.ticketFile()).toBe(file);
    expect(component.ocrResult()).toEqual(MOCK_OCR);
    expect(component.scanning()).toBe(false);
  });

  it('onScanFileSelected() auto-advances to step 1 after OCR', async () => {
    const { component } = await setup();
    component.onScanFileSelected({ target: { files: [makeFile()] } } as any);
    expect(component.currentStep()).toBe(1);
  });

  it('onScanFileSelected() does nothing when no file', async () => {
    const { component, ocrService } = await setup();
    component.onScanFileSelected({ target: { files: [] } } as any);
    expect(ocrService.processTicketImage).not.toHaveBeenCalled();
  });

  it('onScanFileSelected() rejects files exceeding 10 MB', async () => {
    const { component, ocrService, snackBar } = await setup();
    const bigFile = makeFile('big.pdf', 'application/pdf', 11 * 1024 * 1024);
    component.onScanFileSelected({ target: { files: [bigFile] } } as any);
    expect(ocrService.processTicketImage).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('10 MB'), 'Close', expect.any(Object),
    );
  });

  it('onScanFileSelected() rejects disallowed file types', async () => {
    const { component, ocrService, snackBar } = await setup();
    const docFile = makeFile('file.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024);
    component.onScanFileSelected({ target: { files: [docFile] } } as any);
    expect(ocrService.processTicketImage).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('PDF'), 'Close', expect.any(Object),
    );
  });

  it('onScanFileSelected() shows snackBar on OCR error', async () => {
    const { component, ocrService, snackBar } = await setup();
    ocrService.processTicketImage.mockReturnValue(throwError(() => new Error('fail')));
    component.onScanFileSelected({ target: { files: [makeFile()] } } as any);
    expect(component.scanning()).toBe(false);
    expect(component.ocrResult()).toBeNull();
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('scan'), 'Close', expect.any(Object),
    );
  });

  // ----------------------------------------------------------------
  // applyOcrResults
  // ----------------------------------------------------------------
  it('applyOcrResults() patches ticketDetailsForm with OCR data', async () => {
    const { component } = await setup();
    component.applyOcrResults(MOCK_OCR);
    expect(component.ticketDetailsForm.value.citationNumber).toBe('TX-12345');
    expect(component.ticketDetailsForm.value.violationDate).toBe('2026-03-01');
    expect(component.ticketDetailsForm.value.state).toBe('TX');
    expect(component.ticketDetailsForm.value.location).toBe('I-35 Austin');
    expect(component.ticketDetailsForm.value.courtDate).toBe('2026-04-15');
  });

  it('applyOcrResults() maps OCR violationType to chip', async () => {
    const { component } = await setup();
    const ocrWithType = {
      ...MOCK_OCR,
      extractedData: { ...MOCK_OCR.extractedData, violationType: 'speeding' },
    };
    component.applyOcrResults(ocrWithType as any);
    expect(component.ticketTypeForm.get('type')?.value).toBe('speeding');
  });

  it('applyOcrResults() maps fuzzy OCR type "logbook" to hos_logbook', async () => {
    const { component } = await setup();
    const ocrWithType = {
      ...MOCK_OCR,
      extractedData: { ...MOCK_OCR.extractedData, violationType: 'logbook' },
    };
    component.applyOcrResults(ocrWithType as any);
    expect(component.ticketTypeForm.get('type')?.value).toBe('hos_logbook');
  });

  it('ocrFieldCount() counts populated OCR fields', async () => {
    const { component } = await setup();
    expect(component.ocrFieldCount()).toBe(0);
    component.ocrResult.set(MOCK_OCR);
    expect(component.ocrFieldCount()).toBe(5);
  });

  it('ocrFieldCount() counts partial OCR fields', async () => {
    const { component } = await setup();
    component.ocrResult.set({
      success: true,
      confidence: 0.5,
      rawText: '',
      extractedData: { ticketNumber: 'TX-1', violationDate: '', state: 'TX', location: '', courtDate: '' },
    });
    expect(component.ocrFieldCount()).toBe(2);
  });

  // ----------------------------------------------------------------
  // Document file selection
  // ----------------------------------------------------------------
  it('onFileSelected() adds valid file to uploadedFiles', async () => {
    const { component } = await setup();
    const file = makeFile('evidence.pdf', 'application/pdf', 2048);
    component.onFileSelected({ target: { files: [file] } } as any);
    expect(component.uploadedFiles().length).toBe(1);
    expect(component.uploadedFiles()[0].name).toBe('evidence.pdf');
  });

  it('onFileSelected() shows snackBar and skips files exceeding 10 MB', async () => {
    const { component, snackBar } = await setup();
    const bigFile = makeFile('big.pdf', 'application/pdf', 11 * 1024 * 1024);
    component.onFileSelected({ target: { files: [bigFile] } } as any);
    expect(component.uploadedFiles().length).toBe(0);
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('10 MB'), 'Close', expect.any(Object),
    );
  });

  it('onFileSelected() shows snackBar and skips disallowed file types', async () => {
    const { component, snackBar } = await setup();
    const badFile = makeFile('virus.exe', 'application/octet-stream', 512);
    component.onFileSelected({ target: { files: [badFile] } } as any);
    expect(component.uploadedFiles().length).toBe(0);
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('PDF'), 'Close', expect.any(Object),
    );
  });

  it('onFileSelected() does nothing when files is null', async () => {
    const { component } = await setup();
    component.onFileSelected({ target: {} } as any);
    expect(component.uploadedFiles().length).toBe(0);
  });

  it('onFileSelected() caps at 10 files', async () => {
    const { component, snackBar } = await setup();
    component.uploadedFiles.set(Array.from({ length: 10 }, (_, i) => makeFile(`f${i}.pdf`)));
    component.onFileSelected({ target: { files: [makeFile('extra.pdf')] } } as any);
    expect(component.uploadedFiles().length).toBe(10);
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('10'), 'Close', expect.any(Object),
    );
  });

  // ----------------------------------------------------------------
  // removeFile
  // ----------------------------------------------------------------
  it('removeFile() removes file at given index', async () => {
    const { component } = await setup();
    component.uploadedFiles.set([makeFile('a.pdf'), makeFile('b.pdf')]);
    component.removeFile(0);
    expect(component.uploadedFiles().length).toBe(1);
    expect(component.uploadedFiles()[0].name).toBe('b.pdf');
  });

  // ----------------------------------------------------------------
  // getFileSize
  // ----------------------------------------------------------------
  it('getFileSize() formats bytes', async () => {
    const { component } = await setup();
    expect(component.getFileSize(512)).toBe('512 B');
    expect(component.getFileSize(2048)).toBe('2.0 KB');
    expect(component.getFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  // ----------------------------------------------------------------
  // New form fields
  // ----------------------------------------------------------------
  it('ticketDetailsForm includes fineAmount but not allegedSpeed (moved to conditional fields)', async () => {
    const { component } = await setup();
    expect(component.ticketDetailsForm.get('fineAmount')).toBeTruthy();
    expect(component.ticketDetailsForm.get('allegedSpeed')).toBeFalsy();
  });

  it('conditionalFieldsForm is rebuilt when violation type changes to speeding', async () => {
    const { component } = await setup();
    component.selectViolationType('speeding');
    expect(component.conditionalFieldsForm.get('alleged_speed')).toBeTruthy();
    expect(component.activeConditionalFields().length).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------
  // submitTicket
  // ----------------------------------------------------------------
  it('submitTicket() calls createCase and sets submitted/ticketId on success', async () => {
    const { component, caseService } = await setup();
    component.ticketTypeForm.setValue({ type: 'speeding' });
    component.ticketDetailsForm.setValue({
      citationNumber: 'TX-1', violationDate: '2026-03-01',
      state: 'TX', location: 'I-35', description: 'Going too fast',
      courtDate: '', fineAmount: 250,
    });
    component.conditionalFieldsForm.get('alleged_speed')?.setValue(80);
    component.conditionalFieldsForm.get('posted_speed_limit')?.setValue(65);
    component.submitTicket();
    expect(caseService.createCase).toHaveBeenCalled();
    expect(component.submitted()).toBe(true);
    expect(component.ticketId()).toBe('CASE-001');
    expect(component.submitting()).toBe(false);
  });

  it('submitTicket() includes snake_case payload mapping', async () => {
    const { component, caseService } = await setup();
    component.ticketTypeForm.setValue({ type: 'speeding' });
    component.ticketDetailsForm.setValue({
      citationNumber: 'TX-99', violationDate: '2026-03-01',
      state: 'TX', location: 'Highway', description: 'Going fast',
      courtDate: '2026-04-01', fineAmount: 350,
    });
    component.conditionalFieldsForm.get('alleged_speed')?.setValue(90);
    component.conditionalFieldsForm.get('posted_speed_limit')?.setValue(65);
    component.submitTicket();
    const payload = caseService.createCase.mock.calls[0][0];
    expect(payload.violation_type).toBe('speeding');
    expect(payload.citation_number).toBe('TX-99');
    expect(payload.fine_amount).toBe(350);
    expect(payload.alleged_speed).toBe(90);
    expect(payload.type_specific_data).toBeDefined();
    expect(payload.type_specific_data.alleged_speed).toBe(90);
    expect(payload.customer_name).toBe('Test Driver');
    expect(payload.town).toBe('Highway');
    expect(payload.court_date).toBe('2026-04-01');
    expect(payload.driver_phone).toBe('555-1234');
  });

  it('submitTicket() omits alleged_speed for non-speeding types', async () => {
    const { component, caseService } = await setup();
    component.ticketTypeForm.setValue({ type: 'hos_logbook' });
    component.ticketDetailsForm.setValue({
      citationNumber: '', violationDate: '2026-03-01',
      state: 'TX', location: 'Highway', description: 'HOS violation details',
      courtDate: '', fineAmount: null,
    });
    component.submitTicket();
    const payload = caseService.createCase.mock.calls[0][0];
    expect(payload.alleged_speed).toBeUndefined();
  });

  it('submitTicket() sets error message when forms are invalid', async () => {
    const { component, caseService } = await setup();
    component.submitTicket();
    expect(caseService.createCase).not.toHaveBeenCalled();
    expect(component.error()).toContain('required');
  });

  it('submitTicket() sets error and clears submitting on service failure', async () => {
    const { component, caseService } = await setup();
    caseService.createCase.mockReturnValue(throwError(() => new Error('fail')));
    component.ticketTypeForm.setValue({ type: 'speeding' });
    component.ticketDetailsForm.setValue({
      citationNumber: '', violationDate: '2026-03-01',
      state: 'TX', location: 'Highway', description: 'Went too fast',
      courtDate: '', fineAmount: null,
    });
    component.conditionalFieldsForm.get('alleged_speed')?.setValue(80);
    component.conditionalFieldsForm.get('posted_speed_limit')?.setValue(65);
    component.submitTicket();
    expect(component.submitted()).toBe(false);
    expect(component.submitting()).toBe(false);
    expect(component.error()).toContain('Failed');
  });

  // ----------------------------------------------------------------
  // Navigation
  // ----------------------------------------------------------------
  it('viewTicket() navigates to /driver/cases/:caseId', async () => {
    const { component, router } = await setup();
    component.ticketId.set('CASE-001');
    component.viewTicket();
    expect(router.navigate).toHaveBeenCalledWith(['/driver/cases', 'CASE-001']);
  });

  it('goToDashboard() navigates to /driver/dashboard', async () => {
    const { component, router } = await setup();
    component.goToDashboard();
    expect(router.navigate).toHaveBeenCalledWith(['/driver/dashboard']);
  });

  it('submitAnother() resets all state', async () => {
    const { component } = await setup();
    component.submitted.set(true);
    component.ticketId.set('CASE-001');
    component.ocrResult.set(MOCK_OCR);
    component.ticketFile.set(makeFile());
    component.uploadedFiles.set([makeFile('a.pdf')]);
    component.error.set('some error');
    component.currentStep.set(3);
    component.submitAnother();
    expect(component.submitted()).toBe(false);
    expect(component.ticketId()).toBe('');
    expect(component.ocrResult()).toBeNull();
    expect(component.ticketFile()).toBeNull();
    expect(component.uploadedFiles().length).toBe(0);
    expect(component.error()).toBe('');
    expect(component.currentStep()).toBe(0);
    expect(component.ticketTypeForm.value.type).toBeNull();
  });

  // ----------------------------------------------------------------
  // VT-8: Conditional fields tests
  // ----------------------------------------------------------------
  it('selecting speeding shows 4 conditional fields', async () => {
    const { component } = await setup();
    component.selectViolationType('speeding');
    expect(component.activeConditionalFields()).toHaveLength(4);
    expect(component.activeConditionalFields().map(f => f.key)).toEqual([
      'alleged_speed', 'posted_speed_limit', 'speed_detection_method', 'road_zone',
    ]);
  });

  it('selecting dui shows 4 conditional fields (different from speeding)', async () => {
    const { component } = await setup();
    component.selectViolationType('dui');
    expect(component.activeConditionalFields()).toHaveLength(4);
    expect(component.activeConditionalFields().map(f => f.key)).toContain('bac_level');
    expect(component.activeConditionalFields().map(f => f.key)).toContain('substance_type');
  });

  it('selecting other shows no conditional fields', async () => {
    const { component } = await setup();
    component.selectViolationType('other');
    expect(component.activeConditionalFields()).toHaveLength(0);
  });

  it('changing type clears previous conditional field values', async () => {
    const { component } = await setup();
    component.selectViolationType('speeding');
    component.conditionalFieldsForm.get('alleged_speed')?.setValue(85);
    expect(component.conditionalFieldsForm.get('alleged_speed')?.value).toBe(85);

    component.selectViolationType('dui');
    expect(component.conditionalFieldsForm.get('alleged_speed')).toBeNull();
    expect(component.conditionalFieldsForm.get('bac_level')).toBeTruthy();
  });

  it('required conditional field prevents form submission', async () => {
    const { component, caseService } = await setup();
    component.ticketTypeForm.setValue({ type: 'speeding' });
    component.ticketDetailsForm.setValue({
      citationNumber: '', violationDate: '2026-03-01',
      state: 'TX', location: 'I-35', description: 'Going too fast',
      courtDate: '', fineAmount: null,
    });
    // Don't fill required alleged_speed / posted_speed_limit
    component.submitTicket();
    expect(caseService.createCase).not.toHaveBeenCalled();
    expect(component.error()).toContain('required');
  });

  it('conditionalFormValid signal reflects form validity', async () => {
    const { component } = await setup();
    component.selectViolationType('speeding');
    // Required fields not filled → invalid
    expect(component.conditionalFormValid()).toBe(false);

    component.conditionalFieldsForm.get('alleged_speed')?.setValue(80);
    component.conditionalFieldsForm.get('posted_speed_limit')?.setValue(65);
    expect(component.conditionalFormValid()).toBe(true);
  });

  it('toggleBooleanField toggles a boolean conditional value', async () => {
    const { component } = await setup();
    component.selectViolationType('dui');
    expect(component.conditionalFieldsForm.get('hazmat_at_time')?.value).toBe(false);
    component.toggleBooleanField('hazmat_at_time');
    expect(component.conditionalFieldsForm.get('hazmat_at_time')?.value).toBe(true);
    component.toggleBooleanField('hazmat_at_time');
    expect(component.conditionalFieldsForm.get('hazmat_at_time')?.value).toBe(false);
  });

  it('getConditionalFieldDisplayValue returns formatted values', async () => {
    const { component } = await setup();
    component.selectViolationType('speeding');
    component.conditionalFieldsForm.get('alleged_speed')?.setValue(80);

    const speedField = component.activeConditionalFields().find(f => f.key === 'alleged_speed')!;
    expect(component.getConditionalFieldDisplayValue(speedField)).toBe('80');

    // Boolean display
    component.selectViolationType('dui');
    const hazmatField = component.activeConditionalFields().find(f => f.key === 'hazmat_at_time')!;
    expect(component.getConditionalFieldDisplayValue(hazmatField)).toBe('No');
    component.toggleBooleanField('hazmat_at_time');
    expect(component.getConditionalFieldDisplayValue(hazmatField)).toBe('Yes');
  });

  it('submitAnother resets conditional fields', async () => {
    const { component } = await setup();
    component.selectViolationType('speeding');
    component.conditionalFieldsForm.get('alleged_speed')?.setValue(80);
    component.submitAnother();
    expect(component.activeConditionalFields()).toHaveLength(0);
    expect(Object.keys(component.conditionalFieldsForm.controls)).toHaveLength(0);
  });

  it('VIOLATION_CATEGORIES has 4 category groups', async () => {
    const { component } = await setup();
    expect(component.VIOLATION_CATEGORIES).toHaveLength(4);
  });

  it('total violation chips across all categories equals 14', async () => {
    const { component } = await setup();
    const total = component.VIOLATION_CATEGORIES.reduce(
      (sum, cat) => sum + cat.chips.length, 0,
    );
    expect(total).toBe(14);
  });

  it('OCR_TYPE_MAP handles new keywords like dui, overweight, hazmat', async () => {
    const { component } = await setup();
    // Verify via applyOcrResults with fuzzy types
    const ocrDui = {
      ...MOCK_OCR,
      extractedData: { ...MOCK_OCR.extractedData, violationType: 'dui' },
    };
    component.applyOcrResults(ocrDui as any);
    expect(component.ticketTypeForm.get('type')?.value).toBe('dui');

    const ocrOverweight = {
      ...MOCK_OCR,
      extractedData: { ...MOCK_OCR.extractedData, violationType: 'overweight' },
    };
    component.applyOcrResults(ocrOverweight as any);
    expect(component.ticketTypeForm.get('type')?.value).toBe('overweight_oversize');

    const ocrHazmat = {
      ...MOCK_OCR,
      extractedData: { ...MOCK_OCR.extractedData, violationType: 'hazmat' },
    };
    component.applyOcrResults(ocrHazmat as any);
    expect(component.ticketTypeForm.get('type')?.value).toBe('hazmat');
  });
});
