/**
 * Sprint 031 — Carrier bulk operations + compliance report
 * Tests: bulkImport, bulkArchive, getComplianceReport controller handlers
 */

const pool = require('../config/database');

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

function makeReq(overrides = {}) {
  return {
    user: { id: 'u1', role: 'carrier', carrierId: 'carrier1' },
    query: {},
    params: {},
    body: {},
    ...overrides,
  };
}

function makeRes() {
  const res = { json: jest.fn(), status: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

let controller;
beforeEach(() => {
  jest.resetModules();
  jest.mock('../config/database', () => ({ query: jest.fn() }));
  controller = require('../controllers/carrier.controller');
});

// ─── bulkImport ──────────────────────────────────────────────────────────────

describe('bulkImport', () => {
  it('returns 403 when carrierId missing from token', async () => {
    const req = makeReq({ user: { id: 'u1', role: 'carrier' }, body: { csv: 'a,b' } });
    const res = makeRes();
    await controller.bulkImport(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 400 when csv field is missing', async () => {
    const req = makeReq({ body: {} });
    const res = makeRes();
    await controller.bulkImport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'VALIDATION' }),
    }));
  });

  it('returns 400 when CSV has only header row', async () => {
    const req = makeReq({ body: { csv: 'cdl_number,violation_type,state' } });
    const res = makeRes();
    await controller.bulkImport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when required columns are missing from header', async () => {
    const req = makeReq({ body: { csv: 'cdl_number,violation\nCDL1,Speeding' } });
    const res = makeRes();
    await controller.bulkImport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.error.message).toContain('state');
  });

  it('imports valid rows and reports errors for unknown CDLs', async () => {
    const { query } = require('../config/database');
    // drivers lookup
    query.mockResolvedValueOnce({ rows: [{ id: 'd1', cdl_number: 'CDL001' }] });
    // INSERT for valid row
    query.mockResolvedValueOnce({ rows: [] });

    const csv = 'cdl_number,violation_type,state\nCDL001,Speeding,TX\nCDL999,Overweight,CA';
    const req = makeReq({ body: { csv } });
    const res = makeRes();
    await controller.bulkImport(req, res);

    expect(res.json).toHaveBeenCalledWith({
      results: expect.objectContaining({ imported: 1, errors: expect.arrayContaining([
        expect.objectContaining({ row: 3 }),
      ]) }),
    });
  });

  it('returns 500 on database error', async () => {
    const { query } = require('../config/database');
    query.mockRejectedValueOnce(new Error('DB failure'));
    const csv = 'cdl_number,violation_type,state\nCDL001,Speeding,TX';
    const req = makeReq({ body: { csv } });
    const res = makeRes();
    await controller.bulkImport(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── bulkArchive ─────────────────────────────────────────────────────────────

describe('bulkArchive', () => {
  it('returns 403 when carrierId missing', async () => {
    const req = makeReq({ user: { id: 'u1' }, body: { case_ids: ['c1'] } });
    const res = makeRes();
    await controller.bulkArchive(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 400 when case_ids is missing or empty', async () => {
    const req = makeReq({ body: { case_ids: [] } });
    const res = makeRes();
    await controller.bulkArchive(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('updates cases and returns archived count', async () => {
    const { query } = require('../config/database');
    query.mockResolvedValueOnce({ rows: [{ id: 'c1' }, { id: 'c2' }] });

    const req = makeReq({ body: { case_ids: ['c1', 'c2'] } });
    const res = makeRes();
    await controller.bulkArchive(req, res);

    expect(res.json).toHaveBeenCalledWith({ archived: 2 });
    const call = query.mock.calls[0];
    expect(call[0]).toContain("status = 'closed'");
  });

  it('returns 500 on database error', async () => {
    const { query } = require('../config/database');
    query.mockRejectedValueOnce(new Error('DB failure'));
    const req = makeReq({ body: { case_ids: ['c1'] } });
    const res = makeRes();
    await controller.bulkArchive(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getComplianceReport ─────────────────────────────────────────────────────

describe('getComplianceReport', () => {
  it('returns 403 when carrierId missing', async () => {
    const req = makeReq({ user: { id: 'u1' } });
    const res = makeRes();
    await controller.getComplianceReport(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns report rows and generated_at', async () => {
    const { query } = require('../config/database');
    const mockRow = {
      case_number: 'CDL-001', driver_name: 'Alice', cdl_number: 'CDL123',
      violation_type: 'Speeding', state: 'TX', status: 'resolved',
      incident_date: '2026-01-15', attorney_name: 'J. Law',
    };
    query.mockResolvedValueOnce({ rows: [mockRow] });

    const req = makeReq({ query: {} });
    const res = makeRes();
    await controller.getComplianceReport(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      report: [mockRow],
      generated_at: expect.any(String),
    }));
  });

  it('appends date filters to the query when from/to provided', async () => {
    const { query } = require('../config/database');
    query.mockResolvedValueOnce({ rows: [] });

    const req = makeReq({ query: { from: '2026-01-01', to: '2026-03-01' } });
    const res = makeRes();
    await controller.getComplianceReport(req, res);

    const [sql, params] = query.mock.calls[0];
    expect(params).toContain('2026-01-01');
    expect(params).toContain('2026-03-01');
    expect(sql).toContain('created_at >=');
    expect(sql).toContain('created_at <=');
  });

  it('returns 500 on database error', async () => {
    const { query } = require('../config/database');
    query.mockRejectedValueOnce(new Error('DB failure'));
    const req = makeReq({ query: {} });
    const res = makeRes();
    await controller.getComplianceReport(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
