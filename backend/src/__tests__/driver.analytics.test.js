'use strict';

jest.mock('../config/database', () => ({ query: jest.fn() }));

const pool             = require('../config/database');
const driverController = require('../controllers/driver.controller');

function makeReq(overrides = {}) {
  return { user: { id: 'u1' }, query: {}, params: {}, body: {}, ...overrides };
}
function makeRes() {
  const res = { json: jest.fn(), status: jest.fn(), send: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

beforeEach(() => jest.resetAllMocks());

// ─────────────────────────────────────────────
// getDriverAnalytics
// ─────────────────────────────────────────────
describe('getDriverAnalytics', () => {
  function setup({ monthRows = [], violationRows = [], statsRow = {} } = {}) {
    pool.query
      .mockResolvedValueOnce({ rows: monthRows })
      .mockResolvedValueOnce({ rows: violationRows })
      .mockResolvedValueOnce({ rows: [statsRow] });
  }

  test('returns full analytics shape', async () => {
    setup({
      monthRows:     [{ month: 'Jan 2026', count: '3' }],
      violationRows: [{ type: 'Speeding', count: '3' }, { type: 'Lane Change', count: '1' }],
      statsRow:      { total: '4', open_cases: '1', resolved_cases: '3' },
    });

    const res = makeRes();
    await driverController.getDriverAnalytics(makeReq(), res);

    const body = res.json.mock.calls[0][0];
    expect(body.totalCases).toBe(4);
    expect(body.openCases).toBe(1);
    expect(body.resolvedCases).toBe(3);
    expect(body.successRate).toBe(75); // 3/4
    expect(body.casesByMonth).toEqual([{ month: 'Jan 2026', count: 3 }]);
    expect(body.violationBreakdown).toHaveLength(2);
    expect(body.violationBreakdown[0]).toMatchObject({ type: 'Speeding', count: 3, pct: 75 });
    expect(body.violationBreakdown[1]).toMatchObject({ type: 'Lane Change', count: 1, pct: 25 });
  });

  test('returns zero successRate when no cases', async () => {
    setup({ statsRow: { total: '0', open_cases: '0', resolved_cases: '0' } });
    const res = makeRes();
    await driverController.getDriverAnalytics(makeReq(), res);
    expect(res.json.mock.calls[0][0].successRate).toBe(0);
  });

  test('returns empty violation breakdown when no violations', async () => {
    setup({ statsRow: { total: '2', open_cases: '2', resolved_cases: '0' } });
    const res = makeRes();
    await driverController.getDriverAnalytics(makeReq(), res);
    expect(res.json.mock.calls[0][0].violationBreakdown).toEqual([]);
  });

  test('returns 403 when user id is missing', async () => {
    const res = makeRes();
    await driverController.getDriverAnalytics(makeReq({ user: {} }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 500 on DB error', async () => {
    pool.query.mockRejectedValue(new Error('DB down'));
    const res = makeRes();
    await driverController.getDriverAnalytics(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
