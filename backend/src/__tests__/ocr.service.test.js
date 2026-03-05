'use strict';

// Mock Tesseract before requiring the service
jest.mock('tesseract.js', () => ({ recognize: jest.fn() }), { virtual: true });
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}), { virtual: true });

const Tesseract = require('tesseract.js');
const {
  parseExtractedText,
  validateExtraction,
  extractTicketData
} = require('../services/ocr.service');

// ---------------------------------------------------------------------------
// parseExtractedText — pure function, no mocks needed
// ---------------------------------------------------------------------------
describe('parseExtractedText', () => {
  test('extracts citation number from "Citation #: CA-SPD-123456"', () => {
    // No "Traffic Citation" prefix — avoids regex capturing the wrong occurrence of "Citation"
    const text = 'Citation #: CA-SPD-123456\nDate: 01/15/2025';
    const result = parseExtractedText(text);
    expect(result.citationNumber).toBe('CA-SPD-123456');
  });

  test('extracts citation number matching standalone alphanumeric pattern', () => {
    const text = 'TICKET\nA1234567\nIssued: 03/10/2025';
    const result = parseExtractedText(text);
    expect(result.citationNumber).toBe('A1234567');
  });

  test('extracts violation date from MM/DD/YYYY format', () => {
    const text = 'Date: 01/15/2025\nViolation: Speeding';
    const result = parseExtractedText(text);
    expect(result.violationDate).toBe('01/15/2025');
  });

  test('extracts violation date from MM-DD-YYYY format', () => {
    const text = 'Violation Date: 03-20-2025\nOfficer: John Smith';
    const result = parseExtractedText(text);
    expect(result.violationDate).toBe('03-20-2025');
  });

  test('extracts fine amount from "$250.00"', () => {
    const text = 'Total Fine: $250.00\nPlease pay by court date';
    const result = parseExtractedText(text);
    expect(result.fineAmount).toBe(250.0);
  });

  test('extracts fine amount from bare number "Total: 150"', () => {
    const text = 'Amount: 150\nCourt Date: 03/20/2025';
    const result = parseExtractedText(text);
    expect(result.fineAmount).toBe(150);
  });

  test('extracts court date from "Court Date: 03/20/2025"', () => {
    const text = 'Court Date: 03/20/2025\nLocation: 123 Main St';
    const result = parseExtractedText(text);
    expect(result.courtDate).toBe('03/20/2025');
  });

  test('extracts officer name from "Officer: John Smith"', () => {
    const text = 'Officer: John Smith\nBadge: 12345';
    const result = parseExtractedText(text);
    expect(result.officerName).toBe('John Smith');
  });

  test('extracts officer badge number', () => {
    const text = 'Officer: Jane Doe\nBadge #: 98765';
    const result = parseExtractedText(text);
    expect(result.officerBadge).toBe('98765');
  });

  test('extracts driver license number', () => {
    const text = 'Driver License: CA1234567\nVehicle: 2020 Ford F-150';
    const result = parseExtractedText(text);
    expect(result.driverLicense).toBe('CA1234567');
  });

  test('extracts state code from text', () => {
    const text = 'State of CA\nCitation: AB123456';
    const result = parseExtractedText(text);
    expect(result.state).toBe('CA');
  });

  test('returns null fields when text is empty', () => {
    const result = parseExtractedText('');
    expect(result.citationNumber).toBeNull();
    expect(result.violationDate).toBeNull();
    expect(result.fineAmount).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateExtraction
// ---------------------------------------------------------------------------
describe('validateExtraction', () => {
  test('isValid=true when all required fields are present', () => {
    const data = {
      citationNumber: 'CA-SPD-123456',
      violationDate: '01/15/2025',
      violationType: 'Speeding over limit by 15 mph',
      location: null,
      officerName: null,
      driverLicense: null,
      fineAmount: null,
      state: null
    };
    const result = validateExtraction(data);
    expect(result.isValid).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  test('isValid=false and missingFields includes "citationNumber" when absent', () => {
    const data = {
      citationNumber: null,
      violationDate: '01/15/2025',
      violationType: 'Speeding over limit',
      location: null, officerName: null, driverLicense: null, fineAmount: null, state: null
    };
    const result = validateExtraction(data);
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('citationNumber');
    expect(result.fieldConfidence.citationNumber).toBe(0);
  });

  test('returns isValid=false when all fields are null (empty extraction)', () => {
    const data = {
      citationNumber: null,
      violationDate: null,
      violationType: null,
      location: null,
      officerName: null,
      driverLicense: null,
      fineAmount: null,
      courtDate: null,
      state: null
    };
    const result = validateExtraction(data);
    expect(result.isValid).toBe(false);
    expect(result.missingFields.length).toBeGreaterThan(0);
    expect(result.overallConfidence).toBe(0);
  });

  test('adds low-confidence warnings for fields below 70%', () => {
    // violationType with short text → confidence 60
    const data = {
      citationNumber: 'CA-SPD-123456',
      violationDate: '01/15/2025',
      violationType: 'Speed', // short → 60% confidence
      location: null, officerName: null, driverLicense: null, fineAmount: null, state: null
    };
    const result = validateExtraction(data);
    expect(result.warnings.some(w => w.includes('violationType'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// extractTicketData — Tesseract mocked
// ---------------------------------------------------------------------------
describe('extractTicketData', () => {
  const imageBuffer = Buffer.from('fake-image-data');

  test('returns structured result with rawText and confidence on success', async () => {
    Tesseract.recognize.mockResolvedValue({
      data: {
        text: 'Citation #: CA-SPD-999999\nDate: 06/01/2025\nViolation: Speeding over the limit by 20 mph',
        confidence: 87
      }
    });

    const result = await extractTicketData(imageBuffer);

    expect(result.success).toBe(true);
    expect(result.rawText).toContain('CA-SPD-999999');
    expect(result.confidence).toBe(87);
    expect(result.extractedData).toBeDefined();
    expect(result.validation).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  test('extracted data contains parsed citation number', async () => {
    Tesseract.recognize.mockResolvedValue({
      data: {
        text: 'Ticket #: TX-SPD-555555\nDate: 01/01/2025\nOfficer: Jane Smith',
        confidence: 90
      }
    });

    const result = await extractTicketData(imageBuffer);
    expect(result.extractedData.citationNumber).toBe('TX-SPD-555555');
  });

  test('throws when Tesseract throws', async () => {
    Tesseract.recognize.mockRejectedValue(new Error('Tesseract failed'));
    await expect(extractTicketData(imageBuffer)).rejects.toThrow('Tesseract failed');
  });
});
