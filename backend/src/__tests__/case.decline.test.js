/**
 * Tests for declineCase() — AR-1 auto re-offer on attorney decline
 */

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockAutoAssign = jest.fn();
jest.mock('../services/assignment.service', () => ({ autoAssign: mockAutoAssign }));

const mockNotifyUser = jest.fn();
jest.mock('../services/onesignal.service', () => ({ notifyUser: mockNotifyUser }));

jest.mock('../services/email.service', () => ({ sendRegistrationEmail: jest.fn() }));
jest.mock('../services/sms.service', () => ({
  sendSms: jest.fn(),
  sendCaseSubmissionSms: jest.fn(),
  sendAttorneyAssignedSms: jest.fn(),
  sendStatusChangeSms: jest.fn(),
  sendPaymentReminderSms: jest.fn(),
}));
jest.mock('../services/storage.service', () => ({
  uploadToSupabase: jest.fn(),
  generateSignedUrl: jest.fn(),
  deleteFromSupabase: jest.fn(),
}));
jest.mock('../services/payment.service', () => ({ createPaymentIntent: jest.fn() }));

let supabase;
jest.mock('../config/supabase', () => {
  const mock = { from: jest.fn(), supabaseAdmin: null, executeQuery: jest.fn() };
  // eslint-disable-next-line no-undef
  supabase = mock;
  return { supabase: mock, supabaseAdmin: null, executeQuery: mock.executeQuery };
});

const caseController = require('../controllers/case.controller');

// ── Chain helper ─────────────────────────────────────────────────────────────
function buildChain(singleResult = { data: null, error: null }) {
  const chain = {};
  ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in',
    'gte', 'lte', 'or', 'order', 'limit', 'range', 'head',
  ].forEach(m => { chain[m] = jest.fn().mockReturnValue(chain); });
  chain.single = jest.fn().mockResolvedValue(singleResult);
  chain.maybeSingle = jest.fn().mockResolvedValue(singleResult);
  chain.then = (ok, fail) => Promise.resolve({ data: [], error: null }).then(ok, fail);
  return chain;
}

function makeReq(overrides = {}) {
  return {
    user: { id: 'attorney-1', role: 'attorney' },
    params: { id: 'case-99' },
    body: { reason: 'Conflict of interest' },
    app: { get: jest.fn().mockReturnValue(null) },
    ...overrides,
  };
}

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('declineCase()', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockAutoAssign.mockResolvedValue(null); // default: no next attorney
    mockNotifyUser.mockResolvedValue(undefined);
  });

  it('returns 404 when case not found', async () => {
    const chain = buildChain({ data: null, error: { message: 'not found' } });
    require('../config/supabase').supabase.from = jest.fn().mockReturnValue(chain);

    const res = makeRes();
    await caseController.declineCase(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when attorney is not assigned to the case', async () => {
    const chain = buildChain({
      data: {
        id: 'case-99',
        case_number: 'CDL-099',
        status: 'assigned_to_attorney',
        assigned_attorney_id: 'different-attorney',
        driver_id: 'driver-1',
        declined_by_attorney_ids: [],
      },
      error: null,
    });
    require('../config/supabase').supabase.from = jest.fn().mockReturnValue(chain);

    const res = makeRes();
    await caseController.declineCase(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 400 when case is not in assigned_to_attorney status', async () => {
    const chain = buildChain({
      data: {
        id: 'case-99',
        case_number: 'CDL-099',
        status: 'new',
        assigned_attorney_id: 'attorney-1',
        driver_id: 'driver-1',
        declined_by_attorney_ids: [],
      },
      error: null,
    });
    require('../config/supabase').supabase.from = jest.fn().mockReturnValue(chain);

    const res = makeRes();
    await caseController.declineCase(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('declines case successfully and responds 200', async () => {
    const chain = buildChain();
    // First .single() → fetch case; second .single() → update result
    chain.single = jest.fn()
      .mockResolvedValueOnce({
        data: {
          id: 'case-99',
          case_number: 'CDL-099',
          status: 'assigned_to_attorney',
          assigned_attorney_id: 'attorney-1',
          driver_id: 'driver-1',
          declined_by_attorney_ids: [],
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: 'case-99', status: 'new' },
        error: null,
      });
    require('../config/supabase').supabase.from = jest.fn().mockReturnValue(chain);

    const res = makeRes();
    await caseController.declineCase(makeReq(), res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Case declined successfully' })
    );
  });

  it('calls autoAssign with declined attorney excluded', async () => {
    const chain = buildChain();
    chain.single = jest.fn()
      .mockResolvedValueOnce({
        data: {
          id: 'case-99',
          case_number: 'CDL-099',
          status: 'assigned_to_attorney',
          assigned_attorney_id: 'attorney-1',
          driver_id: 'driver-1',
          declined_by_attorney_ids: ['attorney-0'],
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { id: 'case-99', status: 'new' }, error: null });
    require('../config/supabase').supabase.from = jest.fn().mockReturnValue(chain);

    const res = makeRes();
    await caseController.declineCase(makeReq(), res);

    // Allow non-blocking promise to settle
    await new Promise(resolve => setImmediate(resolve));

    expect(mockAutoAssign).toHaveBeenCalledWith(
      'case-99',
      null,
      expect.arrayContaining(['attorney-0', 'attorney-1'])
    );
  });

  it('notifies next attorney when autoAssign finds one', async () => {
    mockAutoAssign.mockResolvedValue({
      assignedAttorney: { userId: 'attorney-2', name: 'Jane Smith' },
    });

    const chain = buildChain();
    chain.single = jest.fn()
      .mockResolvedValueOnce({
        data: {
          id: 'case-99',
          case_number: 'CDL-099',
          status: 'assigned_to_attorney',
          assigned_attorney_id: 'attorney-1',
          driver_id: 'driver-1',
          declined_by_attorney_ids: [],
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { id: 'case-99', status: 'new' }, error: null });
    require('../config/supabase').supabase.from = jest.fn().mockReturnValue(chain);

    const res = makeRes();
    await caseController.declineCase(makeReq(), res);

    await new Promise(resolve => setImmediate(resolve));

    expect(mockNotifyUser).toHaveBeenCalledWith(
      'attorney-2',
      expect.any(String),
      expect.any(String)
    );
  });

  it('does not notify when autoAssign returns null (no attorneys available)', async () => {
    mockAutoAssign.mockResolvedValue(null);

    const chain = buildChain();
    chain.single = jest.fn()
      .mockResolvedValueOnce({
        data: {
          id: 'case-99',
          case_number: 'CDL-099',
          status: 'assigned_to_attorney',
          assigned_attorney_id: 'attorney-1',
          driver_id: 'driver-1',
          declined_by_attorney_ids: [],
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { id: 'case-99', status: 'new' }, error: null });
    require('../config/supabase').supabase.from = jest.fn().mockReturnValue(chain);

    const res = makeRes();
    await caseController.declineCase(makeReq(), res);

    await new Promise(resolve => setImmediate(resolve));

    expect(mockNotifyUser).not.toHaveBeenCalled();
  });
});
