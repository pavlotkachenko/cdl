import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OcrService, OCRResult } from './ocr.service';

describe('OcrService', () => {
  let service: OcrService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OcrService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OcrService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    TestBed.resetTestingModule();
  });

  // -------------------------------------------------------------------
  // processTicketImage
  // -------------------------------------------------------------------

  it('processTicketImage sends multipart POST to /api/ocr/extract', () => {
    const file = new File(['ticket'], 'ticket.jpg', { type: 'image/jpeg' });
    service.processTicketImage(file).subscribe();

    const req = controller.expectOne((r) => r.url.includes('/ocr/extract'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect(req.request.body.get('ticket')).toBe(file);

    req.flush({
      success: true,
      data: { confidence: 0.95, extractedData: { ticketNumber: 'T-001' }, rawText: 'raw' },
    });
  });

  it('processTicketImage maps response data into OCRResult shape', () => {
    const file = new File(['t'], 't.jpg', { type: 'image/jpeg' });
    let result: OCRResult | undefined;

    service.processTicketImage(file).subscribe((r) => (result = r));

    controller.expectOne((r) => r.url.includes('/ocr/extract')).flush({
      success: true,
      data: {
        confidence: 0.85,
        extractedData: { violationType: 'Speeding' },
        rawText: 'raw text',
      },
    });

    expect(result).toBeDefined();
    expect(result!.confidence).toBe(0.85);
    expect(result!.extractedData.violationType).toBe('Speeding');
    expect(result!.rawText).toBe('raw text');
  });

  // -------------------------------------------------------------------
  // getConfidenceLevel
  // -------------------------------------------------------------------

  it('getConfidenceLevel returns "high" for confidence >= 0.9', () => {
    expect(service.getConfidenceLevel(0.9).level).toBe('high');
    expect(service.getConfidenceLevel(1.0).level).toBe('high');
  });

  it('getConfidenceLevel returns "medium" for confidence 0.7–0.89', () => {
    expect(service.getConfidenceLevel(0.7).level).toBe('medium');
    expect(service.getConfidenceLevel(0.89).level).toBe('medium');
  });

  it('getConfidenceLevel returns "low" for confidence below 0.7', () => {
    expect(service.getConfidenceLevel(0.6).level).toBe('low');
    expect(service.getConfidenceLevel(0.3).level).toBe('low');
  });

  // -------------------------------------------------------------------
  // validateOCRData
  // -------------------------------------------------------------------

  it('validateOCRData returns errors for missing required fields', () => {
    const errors = service.validateOCRData({});
    const fields = errors.map((e) => e.field);
    expect(fields).toContain('ticketNumber');
    expect(fields).toContain('violationType');
    expect(fields).toContain('violationDate');
    expect(fields).toContain('state');
  });

  it('validateOCRData returns warnings for missing optional fields', () => {
    const errors = service.validateOCRData({
      ticketNumber: 'T-001',
      violationType: 'Speeding',
      violationDate: '2026-01-15',
      state: 'CA',
    });
    const warnings = errors.filter((e) => e.severity === 'warning');
    expect(warnings.some((w) => w.field === 'fineAmount')).toBe(true);
    expect(warnings.some((w) => w.field === 'courtDate')).toBe(true);
  });

  it('validateOCRData returns no errors for fully valid data', () => {
    const errors = service.validateOCRData({
      ticketNumber: 'T-001',
      violationType: 'Speeding',
      violationDate: '2026-01-15',
      state: 'CA',
      fineAmount: 250,
      courtDate: '2026-03-01',
    });
    expect(errors).toHaveLength(0);
  });
});
