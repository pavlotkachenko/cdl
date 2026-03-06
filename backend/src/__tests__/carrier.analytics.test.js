'use strict';

jest.mock('../config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const pool = require('../config/database');
const carrierController = require('../controllers/carrier.controller');

function makeReq(overrides = {}) {
  return { user: { id: 'u1', carrierId: 'c1' }, query: {}, params: {}, body: {}, ...overrides };
}

function makeRes() {
  const res = { json: jest.fn(), status: jest.fn(), send: jest.fn(), setHeader: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

beforeEach(() => jest.resetAllMocks());

// ─────────────────────────────────────────────
// getAnalytics
// ─────────────────────────────────────────────
describe('getAnalytics', () => {
  function setupAnalyticsQueries({ monthRows = [], violationRows = [], resolutionRow = {}, atRiskRows = [] } = {}) {
    pool.query
      .mockResolvedValueOnce({ rows: monthRows })          // monthly trend
      .mockResolvedValueOnce({ rows: violationRows })      // violation breakdown
      .mockResolvedValueOnce({ rows: [resolutionRow] })    // resolution stats
      .mockResolvedValueOnce({ rows: atRiskRows });        // at-risk drivers
  }

  test('returns full analytics shape with computed fields', async () => {
    setupAnalyticsQueries({
      monthRows: [{ month: 'Jan 2026', count: '4' }],
      violationRows: [{ type: 'Speeding', count: '6' }, { type: 'Lane Change', count: '4' }],
      resolutionRow: { total_resolved: '10', won: '9', avg_days: '18.5' },
      atRiskRows: [{ id: 'd1', name: 'John Doe', open_cases: '5' }],
    });

    const req = makeReq();
    const res = makeRes();
    await carrierController.getAnalytics(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.casesByMonth).toEqual([{ month: 'Jan 2026', count: 4 }]);
    expect(body.violationBreakdown).toHaveLength(2);
    expect(body.violationBreakdown[0]).toMatchObject({ type: 'Speeding', count: 6, pct: 60 });
    expect(body.successRate).toBe(90); // 9/10
    expect(body.avgResolutionDays).toBe(19); // Math.round(18.5)
    expect(body.estimatedSavings).toBe(3000); // 10 * 300
    expect(body.atRiskDrivers[0]).toMatchObject({ id: 'd1', name: 'John Doe', openCases: 5, riskLevel: 'red' });
  });

  test('assigns correct riskLevel based on openCases', async () => {
    setupAnalyticsQueries({
      atRiskRows: [
        { id: 'd1', name: 'A', open_cases: '6' },  // red
        { id: 'd2', name: 'B', open_cases: '3' },  // yellow
        { id: 'd3', name: 'C', open_cases: '1' },  // green
      ],
      resolutionRow: { total_resolved: '0', won: '0', avg_days: '0' },
    });
    const res = makeRes();
    await carrierController.getAnalytics(makeReq(), res);
    const { atRiskDrivers } = res.json.mock.calls[0][0];
    expect(atRiskDrivers[0].riskLevel).toBe('red');
    expect(atRiskDrivers[1].riskLevel).toBe('yellow');
    expect(atRiskDrivers[2].riskLevel).toBe('green');
  });

  test('returns zero successRate when no resolved cases', async () => {
    setupAnalyticsQueries({
      resolutionRow: { total_resolved: '0', won: '0', avg_days: '0' },
    });
    const res = makeRes();
    await carrierController.getAnalytics(makeReq(), res);
    expect(res.json.mock.calls[0][0].successRate).toBe(0);
  });

  test('returns 403 when carrierId is missing', async () => {
    const req = makeReq({ user: { id: 'u1' } }); // no carrierId
    const res = makeRes();
    await carrierController.getAnalytics(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 500 on DB error', async () => {
    pool.query.mockRejectedValue(new Error('DB failure'));
    const res = makeRes();
    await carrierController.getAnalytics(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─────────────────────────────────────────────
// exportCases
// ─────────────────────────────────────────────
describe('exportCases', () => {
  test('sets CSV headers and streams rows', async () => {
    pool.query.mockResolvedValue({
      rows: [
        { case_number: 'CDL-001', driver_name: 'John Doe', violation_type: 'Speeding', state: 'TX', status: 'resolved', date: '2026-01-15' },
        { case_number: 'CDL-002', driver_name: 'Jane Smith', violation_type: 'Lane Change', state: 'CA', status: 'active', date: '2026-02-01' },
      ],
    });

    const res = makeRes();
    await carrierController.exportCases(makeReq(), res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="fleet-report.csv"');
    const body = res.send.mock.calls[0][0];
    expect(body).toContain('Case #,Driver,Violation,State,Status,Date');
    expect(body).toContain('CDL-001');
    expect(body).toContain('John Doe');
  });

  test('returns headers-only CSV when no cases', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = makeRes();
    await carrierController.exportCases(makeReq(), res);
    const body = res.send.mock.calls[0][0];
    expect(body.trim()).toBe('Case #,Driver,Violation,State,Status,Date');
  });

  test('returns 403 when carrierId is missing', async () => {
    const res = makeRes();
    await carrierController.exportCases(makeReq({ user: { id: 'u1' } }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 500 on DB error', async () => {
    pool.query.mockRejectedValue(new Error('DB error'));
    const res = makeRes();
    await carrierController.exportCases(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
