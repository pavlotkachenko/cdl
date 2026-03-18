'use strict';

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

const pool = require('../config/database');
const controller = require('../controllers/carrier.controller');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function makeReq(overrides = {}) {
  return {
    user: { id: 'user-1', carrierId: 'carrier-1', role: 'carrier' },
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

beforeEach(() => {
  jest.resetAllMocks();
});

// ═══════════════════════════════════════════════
// Sprint 056 — Mock Data Migration: Carrier Payments & Notifications
// ═══════════════════════════════════════════════

describe('getPayments', () => {
  test('returns payments array on success', async () => {
    const paymentRows = [
      { id: 'p1', amount: 150, status: 'paid', payment_method: 'card', created_at: '2026-03-01', case_number: 'CDL-001', driver_name: 'Miguel R.' },
      { id: 'p2', amount: 250, status: 'pending', payment_method: null, created_at: '2026-03-05', case_number: 'CDL-002', driver_name: 'Sarah L.' },
    ];
    pool.query.mockResolvedValue({ rows: paymentRows });

    const req = makeReq();
    const res = makeRes();
    await controller.getPayments(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM payments'),
      ['carrier-1']
    );
    expect(res.json).toHaveBeenCalledWith({ payments: paymentRows });
  });

  test('returns 403 when carrierId missing', async () => {
    const req = makeReq({ user: { id: 'user-1', role: 'carrier' } });
    const res = makeRes();
    await controller.getPayments(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].error.code).toBe('FORBIDDEN');
  });

  test('falls back to cases when payments table absent (42P01 error)', async () => {
    const tableNotFoundErr = new Error('relation "payments" does not exist');
    tableNotFoundErr.code = '42P01';

    const fallbackRows = [
      { id: 'c1', amount: 100, status: 'new', payment_method: null, created_at: '2026-03-01', case_number: 'CDL-010', driver_name: 'Miguel R.' },
    ];

    pool.query
      .mockRejectedValueOnce(tableNotFoundErr) // First call fails (payments table)
      .mockResolvedValueOnce({ rows: fallbackRows }); // Fallback to cases

    const req = makeReq();
    const res = makeRes();
    await controller.getPayments(req, res);

    expect(pool.query).toHaveBeenCalledTimes(2);
    // Second call should query cases table
    expect(pool.query.mock.calls[1][0]).toContain('FROM cases');
    expect(res.json).toHaveBeenCalledWith({ payments: fallbackRows });
  });

  test('returns 500 on other errors', async () => {
    pool.query.mockRejectedValue(new Error('connection refused'));

    const req = makeReq();
    const res = makeRes();
    await controller.getPayments(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error.code).toBe('SERVER_ERROR');
  });
});

describe('getNotifications', () => {
  test('returns notifications array', async () => {
    const notifRows = [
      { id: 'n1', title: 'New case', message: 'Case assigned', type: 'info', read: false, created_at: '2026-03-10' },
      { id: 'n2', title: 'Payment', message: 'Payment received', type: 'success', read: true, created_at: '2026-03-09' },
    ];
    pool.query.mockResolvedValue({ rows: notifRows });

    const req = makeReq();
    const res = makeRes();
    await controller.getNotifications(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM notifications'),
      ['user-1']
    );
    expect(res.json).toHaveBeenCalledWith({ notifications: notifRows });
  });

  test('returns 403 when userId missing', async () => {
    const req = makeReq({ user: {} });
    const res = makeRes();
    await controller.getNotifications(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].error.code).toBe('FORBIDDEN');
  });

  test('returns 500 on error', async () => {
    pool.query.mockRejectedValue(new Error('db fail'));

    const req = makeReq();
    const res = makeRes();
    await controller.getNotifications(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error.code).toBe('SERVER_ERROR');
  });
});

describe('markNotificationRead', () => {
  test('returns success when notification found', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 'n1' }] });

    const req = makeReq({ params: { id: 'n1' } });
    const res = makeRes();
    await controller.markNotificationRead(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE notifications'),
      ['n1', 'user-1']
    );
    expect(res.json).toHaveBeenCalledWith({ message: 'Notification marked as read' });
  });

  test('returns 404 when not found (empty rows)', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const req = makeReq({ params: { id: 'ghost' } });
    const res = makeRes();
    await controller.markNotificationRead(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].error.code).toBe('NOT_FOUND');
  });

  test('returns 403 when userId missing', async () => {
    const req = makeReq({ user: {}, params: { id: 'n1' } });
    const res = makeRes();
    await controller.markNotificationRead(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].error.code).toBe('FORBIDDEN');
  });
});

describe('markAllNotificationsRead', () => {
  test('returns success with updated count', async () => {
    pool.query.mockResolvedValue({ rowCount: 5 });

    const req = makeReq();
    const res = makeRes();
    await controller.markAllNotificationsRead(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE notifications'),
      ['user-1']
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'All notifications marked as read',
      updated: 5,
    });
  });

  test('returns 403 when userId missing', async () => {
    const req = makeReq({ user: {} });
    const res = makeRes();
    await controller.markAllNotificationsRead(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].error.code).toBe('FORBIDDEN');
  });
});
