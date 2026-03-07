/**
 * Tests for pdf.service.js — Sprint 035 PE-3
 */

const { generateComplianceReport } = require('../services/pdf.service');

const MOCK_ROWS = [
  {
    case_number: 'CDL-001',
    driver_name: 'John Smith',
    cdl_number: 'CDL123456',
    violation_type: 'Speeding 10 mph over',
    state: 'TX',
    status: 'open',
    incident_date: '2025-01-15',
    attorney_name: 'Jane Doe',
  },
  {
    case_number: 'CDL-002',
    driver_name: 'Bob Johnson',
    cdl_number: 'CDL789012',
    violation_type: 'HOS violation',
    state: 'CA',
    status: 'resolved',
    incident_date: '2025-02-01',
    attorney_name: '',
  },
];

describe('generateComplianceReport()', () => {
  it('returns a Buffer', async () => {
    const buf = await generateComplianceReport([], null, null);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it('buffer starts with PDF magic bytes (%PDF)', async () => {
    const buf = await generateComplianceReport(MOCK_ROWS, null, null);
    expect(buf.slice(0, 4).toString()).toBe('%PDF');
  });

  it('generates valid PDF for empty rows (no throw)', async () => {
    await expect(generateComplianceReport([], null, null)).resolves.not.toThrow();
  });

  it('generates valid PDF with date range and rows', async () => {
    const buf = await generateComplianceReport(MOCK_ROWS, '2025-01-01', '2025-03-01');
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(100);
  });
});
