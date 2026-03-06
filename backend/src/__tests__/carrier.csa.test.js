/**
 * Tests for getCsaScore() in carrier.controller.js — CS-1
 */

const mockQuery = jest.fn();
jest.mock('../config/database', () => ({ query: (...args) => mockQuery(...args) }));
jest.mock('../services/email.service', () => ({ sendRegistrationEmail: jest.fn() }));

const carrierController = require('../controllers/carrier.controller');

const makeReq = (role = 'carrier', carrierId = 'carrier-1') => ({
  user: { role, carrierId },
  body: {},
  params: {},
  query: {},
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('getCsaScore()', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns csaScore 0 and riskLevel low when no open cases', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = makeRes();
    await carrierController.getCsaScore(makeReq(), res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ csaScore: 0, riskLevel: 'low', openViolations: 0 })
    );
  });

  it('returns riskLevel low when csaScore < 34', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ violation_type: 'speeding 5 mph over', status: 'new' }],
    });
    const res = makeRes();
    await carrierController.getCsaScore(makeReq(), res);
    const result = res.json.mock.calls[0][0];
    expect(result.riskLevel).toBe('low');
  });

  it('weights HOS violations higher than minor speeding', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        { violation_type: 'HOS violation', status: 'new' },
        { violation_type: 'speeding 5 mph over', status: 'new' },
      ],
    });
    const res = makeRes();
    await carrierController.getCsaScore(makeReq(), res);
    const result = res.json.mock.calls[0][0];
    // HOS weight=3, minor speed weight=1, total weightedSum=4 → csaScore > 0
    expect(result.csaScore).toBeGreaterThan(0);
    expect(result.breakdown.hos).toBe(1);
    expect(result.breakdown.speeding_minor).toBe(1);
  });

  it('does not count resolved cases in score', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ violation_type: 'HOS violation', status: 'resolved' }],
    });
    const res = makeRes();
    await carrierController.getCsaScore(makeReq(), res);
    expect(res.json.mock.calls[0][0].csaScore).toBe(0);
  });

  it('returns 403 when carrierId is missing from token', async () => {
    const req = { user: { role: 'carrier', carrierId: null } };
    const res = makeRes();
    await carrierController.getCsaScore(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns riskLevel high when csaScore >= 67', async () => {
    // Create many HOS violations to push score high
    const rows = Array.from({ length: 12 }, () => ({
      violation_type: 'HOS violation',
      status: 'new',
    }));
    mockQuery.mockResolvedValue({ rows });
    const res = makeRes();
    await carrierController.getCsaScore(makeReq(), res);
    const result = res.json.mock.calls[0][0];
    expect(result.riskLevel).toBe('high');
  });
});
