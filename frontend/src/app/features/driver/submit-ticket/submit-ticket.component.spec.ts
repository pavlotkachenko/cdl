import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { SubmitTicketComponent } from './submit-ticket.component';
import { CaseService } from '../../../core/services/case.service';
import { OcrService, OCRResult } from '../../../core/services/ocr.service';
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

  await TestBed.configureTestingModule({
    imports: [SubmitTicketComponent, NoopAnimationsModule],
    providers: [
      { provide: CaseService, useValue: caseServiceSpy },
      { provide: OcrService, useValue: ocrServiceSpy },
      { provide: Router, useValue: routerSpy },
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
    snackBar,
  };
}

describe('SubmitTicketComponent', () => {
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

  it('onScanFileSelected() does nothing when no file', async () => {
    const { component, ocrService } = await setup();
    component.onScanFileSelected({ target: { files: [] } } as any);
    expect(ocrService.processTicketImage).not.toHaveBeenCalled();
  });

  it('onScanFileSelected() shows snackBar and clears scanning on OCR error', async () => {
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
  // submitTicket
  // ----------------------------------------------------------------
  it('submitTicket() calls createCase and sets submitted/ticketId on success', async () => {
    const { component, caseService } = await setup();
    component.ticketTypeForm.setValue({ type: 'speeding' });
    component.ticketDetailsForm.setValue({
      citationNumber: 'TX-1', violationDate: '2026-03-01',
      state: 'TX', location: 'I-35', description: 'Going too fast', courtDate: '',
    });
    component.submitTicket();
    expect(caseService.createCase).toHaveBeenCalled();
    expect(component.submitted()).toBe(true);
    expect(component.ticketId()).toBe('CASE-001');
    expect(component.submitting()).toBe(false);
  });

  it('submitTicket() sets error message when forms are invalid', async () => {
    const { component, caseService } = await setup();
    // forms are empty / invalid by default
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
      state: 'TX', location: 'Highway', description: 'Went too fast', courtDate: '',
    });
    component.submitTicket();
    expect(component.submitted()).toBe(false);
    expect(component.submitting()).toBe(false);
    expect(component.error()).toContain('Failed');
  });

  // ----------------------------------------------------------------
  // Navigation
  // ----------------------------------------------------------------
  it('viewTicket() navigates to /driver/tickets/:id', async () => {
    const { component, router } = await setup();
    component.ticketId.set('CASE-001');
    component.viewTicket();
    expect(router.navigate).toHaveBeenCalledWith(['/driver/tickets', 'CASE-001']);
  });

  it('submitAnother() resets all state', async () => {
    const { component } = await setup();
    component.submitted.set(true);
    component.ticketId.set('CASE-001');
    component.ocrResult.set(MOCK_OCR);
    component.ticketFile.set(makeFile());
    component.uploadedFiles.set([makeFile('a.pdf')]);
    component.error.set('some error');
    component.submitAnother();
    expect(component.submitted()).toBe(false);
    expect(component.ticketId()).toBe('');
    expect(component.ocrResult()).toBeNull();
    expect(component.ticketFile()).toBeNull();
    expect(component.uploadedFiles().length).toBe(0);
    expect(component.error()).toBe('');
    expect(component.ticketTypeForm.value.type).toBeNull();
  });
});
