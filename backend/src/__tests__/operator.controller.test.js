'use strict';

// ============================================================
// Mocks
// ============================================================
jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = require('../config/supabase');
const operatorController = require('../controllers/operator.controller');
const { _calculatePriority: calculatePriority, _pickNextCourtDate: pickNextCourtDate } = operatorController;

// ============================================================
// Chain helper (thenable for array queries)
// ============================================================
let chain;

function buildChain(arrayResult = { data: [], error: null, count: 0 }) {
  chain = {};
  const plain = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'is',
    'not', 'gte', 'lte', 'order', 'limit', 'head'];
  plain.forEach(m => { chain[m] = jest.fn().mockReturnValue(chain); });
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.catch = jest.fn().mockReturnValue(chain);
  chain.then = (onFulfilled, onRejected) =>
    Promise.resolve(arrayResult).then(onFulfilled, onRejected);
  supabase.from.mockReturnValue(chain);
}

function makeReq(overrides = {}) {
  return {
    user: { id: 'op-1', role: 'operator', full_name: 'Test Operator' },
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
  buildChain();
});

// ============================================================
// getOperatorCases
// ============================================================
describe('getOperatorCases', () => {
  test('returns cases scoped to operator with summary and enriched fields', async () => {
    const now = Date.now();
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const nextWeek = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();

    const cases = [
      { id: 'c1', case_number: 'CDL-001', status: 'reviewed', state: 'CA',
        violation_type: 'speeding', created_at: oneHourAgo, customer_name: 'John Doe',
        attorney_price: 350, assigned_attorney_id: null, driver: null,
        court_dates: [{ id: 'cd1', date: nextWeek, court_name: 'Harris County Court', location: 'Houston TX', status: 'scheduled' }] },
    ];

    // First awaited chain call (cases query) → cases array
    // Second awaited chain call (pending assignment requests count) → { count: 1 }
    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      const result = callCount === 1
        ? { data: cases, error: null }
        : { data: null, error: null, count: 1 };
      return Promise.resolve(result).then(onFulfilled);
    };

    const req = makeReq();
    const res = makeRes();

    await operatorController.getOperatorCases(req, res);

    const { cases: returned, summary } = res.json.mock.calls[0][0];
    expect(returned).toHaveLength(1);
    expect(returned[0].ageHours).toBeGreaterThanOrEqual(0);
    expect(returned[0].fine_amount).toBe(350);
    expect(returned[0].court_date).toBe(nextWeek);
    expect(returned[0].courthouse).toBe('Harris County Court');
    expect(returned[0].priority).toBeDefined();
    expect(returned[0].court_dates).toBeUndefined();
    expect(summary.assignedToMe).toBe(1);
    expect(summary.inProgress).toBe(1); // 'reviewed' is in progress
    expect(summary.pendingApproval).toBe(1);
  });

  test('scopes query to assigned_operator_id', async () => {
    const req = makeReq();
    const res = makeRes();

    await operatorController.getOperatorCases(req, res);

    expect(chain.eq).toHaveBeenCalledWith('assigned_operator_id', 'op-1');
  });

  test('applies optional status filter', async () => {
    const req = makeReq({ query: { status: 'reviewed' } });
    const res = makeRes();

    await operatorController.getOperatorCases(req, res);

    expect(chain.eq).toHaveBeenCalledWith('status', 'reviewed');
  });

  test('returns empty cases and zeroed summary when no cases assigned', async () => {
    const req = makeReq();
    const res = makeRes();

    await operatorController.getOperatorCases(req, res);

    const { cases: returned, summary } = res.json.mock.calls[0][0];
    expect(returned).toEqual([]);
    expect(summary.assignedToMe).toBe(0);
    expect(summary.inProgress).toBe(0);
    expect(summary.resolvedToday).toBe(0);
  });

  test('returns 500 on supabase error', async () => {
    chain.then = (onFulfilled) =>
      Promise.resolve({ data: null, error: { message: 'db error' } }).then(onFulfilled);

    const req = makeReq();
    const res = makeRes();

    await operatorController.getOperatorCases(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'FETCH_ERROR' }) })
    );
  });
});

// ============================================================
// getUnassignedCases
// ============================================================
describe('getUnassignedCases', () => {
  test('returns unassigned cases with requested flag and enriched fields', async () => {
    const now = Date.now();
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();

    const cases = [
      { id: 'u1', case_number: 'CDL-610', status: 'new', state: 'NY',
        violation_type: 'lane change', created_at: twoHoursAgo, customer_name: 'Sarah Kim',
        attorney_price: 200, assigned_attorney_id: null, court_dates: [] },
    ];

    const requests = [{ case_id: 'u1', status: 'pending' }];

    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      const result = callCount === 1
        ? { data: cases, error: null }
        : { data: requests, error: null };
      return Promise.resolve(result).then(onFulfilled);
    };

    const req = makeReq();
    const res = makeRes();

    await operatorController.getUnassignedCases(req, res);

    const { cases: returned } = res.json.mock.calls[0][0];
    expect(returned).toHaveLength(1);
    expect(returned[0].requested).toBe(true);
    expect(returned[0].ageHours).toBeGreaterThanOrEqual(1);
    expect(returned[0].fine_amount).toBe(200);
    expect(returned[0].court_date).toBeNull();
    expect(returned[0].courthouse).toBeNull();
    expect(returned[0].priority).toBeDefined();
    expect(returned[0].court_dates).toBeUndefined();
  });

  test('marks cases as not requested when no pending requests exist', async () => {
    const cases = [
      { id: 'u1', case_number: 'CDL-610', status: 'new', state: 'NY',
        violation_type: 'lane change', created_at: new Date().toISOString(), customer_name: 'Sarah Kim',
        attorney_price: null, assigned_attorney_id: null, court_dates: [] },
    ];

    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      const result = callCount === 1
        ? { data: cases, error: null }
        : { data: [], error: null };
      return Promise.resolve(result).then(onFulfilled);
    };

    const req = makeReq();
    const res = makeRes();

    await operatorController.getUnassignedCases(req, res);

    const { cases: returned } = res.json.mock.calls[0][0];
    expect(returned[0].requested).toBe(false);
  });

  test('queries for null assigned_operator_id and new/submitted status', async () => {
    const req = makeReq();
    const res = makeRes();

    await operatorController.getUnassignedCases(req, res);

    expect(chain.is).toHaveBeenCalledWith('assigned_operator_id', null);
    expect(chain.in).toHaveBeenCalledWith('status', ['new', 'submitted']);
  });

  test('returns 500 on supabase error', async () => {
    chain.then = (onFulfilled) =>
      Promise.resolve({ data: null, error: { message: 'db error' } }).then(onFulfilled);

    const req = makeReq();
    const res = makeRes();

    await operatorController.getUnassignedCases(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'FETCH_ERROR' }) })
    );
  });
});

// ============================================================
// requestAssignment
// ============================================================
describe('requestAssignment', () => {
  test('creates assignment request for unassigned case', async () => {
    // .single() calls: 1st = case lookup, 2nd = maybeSingle (existing check), 3rd = insert result
    let singleCallCount = 0;
    chain.single = jest.fn().mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        // Case lookup — found and unassigned
        return Promise.resolve({ data: { id: 'c1', case_number: 'CDL-001', assigned_operator_id: null }, error: null });
      }
      // Insert result
      return Promise.resolve({ data: { id: 'r1', case_id: 'c1', operator_id: 'op-1', status: 'pending' }, error: null });
    });

    // maybeSingle: no existing pending request
    chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

    // thenable for admin query
    chain.then = (onFulfilled) =>
      Promise.resolve({ data: [{ id: 'admin-1' }], error: null }).then(onFulfilled);

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();

    await operatorController.requestAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ request: expect.objectContaining({ case_id: 'c1' }) })
    );
  });

  test('returns 404 when case not found', async () => {
    chain.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } });

    const req = makeReq({ params: { caseId: 'nonexistent' } });
    const res = makeRes();

    await operatorController.requestAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'NOT_FOUND' }) })
    );
  });

  test('returns 400 when case is already assigned', async () => {
    chain.single = jest.fn().mockResolvedValue({
      data: { id: 'c1', case_number: 'CDL-001', assigned_operator_id: 'other-op' },
      error: null,
    });

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();

    await operatorController.requestAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'ALREADY_ASSIGNED' }) })
    );
  });

  test('returns 400 when duplicate pending request exists', async () => {
    chain.single = jest.fn().mockResolvedValue({
      data: { id: 'c1', case_number: 'CDL-001', assigned_operator_id: null },
      error: null,
    });
    chain.maybeSingle = jest.fn().mockResolvedValue({
      data: { id: 'existing-request' },
      error: null,
    });

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();

    await operatorController.requestAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'DUPLICATE_REQUEST' }) })
    );
  });

  test('returns 500 on insert error', async () => {
    chain.single = jest.fn().mockImplementation(() => {
      // First call: case lookup
      chain.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } });
      return Promise.resolve({ data: { id: 'c1', case_number: 'CDL-001', assigned_operator_id: null }, error: null });
    });
    chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();

    await operatorController.requestAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ============================================================
// getAvailableAttorneys
// ============================================================
describe('getAvailableAttorneys', () => {
  const ATTORNEYS = [
    { id: 'a1', full_name: 'Alice Smith', email: 'alice@law.com', specializations: ['speeding'], jurisdictions: ['CA'] },
    { id: 'a2', full_name: 'Bob Jones', email: 'bob@law.com', specializations: [], jurisdictions: [] },
  ];

  const ACTIVE_CASES = [
    { assigned_attorney_id: 'a1' },
    { assigned_attorney_id: 'a1' },
    { assigned_attorney_id: 'a2' },
  ];

  test('returns attorneys with computed activeCount', async () => {
    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      const result = callCount === 1
        ? { data: ATTORNEYS, error: null }   // attorneys query
        : { data: ACTIVE_CASES, error: null }; // case counts query
      return Promise.resolve(result).then(onFulfilled);
    };

    const req = makeReq();
    const res = makeRes();

    await operatorController.getAvailableAttorneys(req, res);

    const { attorneys } = res.json.mock.calls[0][0];
    expect(attorneys).toHaveLength(2);
    const alice = attorneys.find(a => a.id === 'a1');
    const bob = attorneys.find(a => a.id === 'a2');
    expect(alice.activeCount).toBe(2);
    expect(bob.activeCount).toBe(1);
  });

  test('returns attorneys with activeCount=0 when no active cases', async () => {
    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      const result = callCount === 1
        ? { data: ATTORNEYS, error: null }
        : { data: [], error: null };
      return Promise.resolve(result).then(onFulfilled);
    };

    const req = makeReq();
    const res = makeRes();

    await operatorController.getAvailableAttorneys(req, res);

    const { attorneys } = res.json.mock.calls[0][0];
    expect(attorneys.every(a => a.activeCount === 0)).toBe(true);
  });

  test('handles null assigned_attorney_id gracefully in count map', async () => {
    const casesWithNull = [
      { assigned_attorney_id: 'a1' },
      { assigned_attorney_id: null },  // unassigned case
    ];

    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      const result = callCount === 1
        ? { data: [ATTORNEYS[0]], error: null }
        : { data: casesWithNull, error: null };
      return Promise.resolve(result).then(onFulfilled);
    };

    const req = makeReq();
    const res = makeRes();

    await operatorController.getAvailableAttorneys(req, res);

    const { attorneys } = res.json.mock.calls[0][0];
    expect(attorneys[0].activeCount).toBe(1);
  });

  test('returns 500 when attorney fetch fails', async () => {
    chain.then = (onFulfilled) =>
      Promise.resolve({ data: null, error: { message: 'db error' } }).then(onFulfilled);

    const req = makeReq();
    const res = makeRes();

    await operatorController.getAvailableAttorneys(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('formats attorney response correctly', async () => {
    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      const result = callCount === 1
        ? { data: ATTORNEYS, error: null }
        : { data: [], error: null };
      return Promise.resolve(result).then(onFulfilled);
    };

    const req = makeReq();
    const res = makeRes();

    await operatorController.getAvailableAttorneys(req, res);

    const { attorneys } = res.json.mock.calls[0][0];
    expect(attorneys[0]).toMatchObject({
      id: 'a1',
      fullName: 'Alice Smith',
      email: 'alice@law.com',
      specializations: ['speeding'],
      jurisdictions: ['CA'],
      activeCount: 0,
    });
  });
});

// ============================================================
// getCaseDetail
// ============================================================
describe('getCaseDetail', () => {
  const MOCK_CASE = {
    id: 'c1', case_number: 'CDL-001', status: 'reviewed', state: 'CA',
    violation_type: 'speeding', violation_date: '2026-02-15', county: 'Harris',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    customer_name: 'John Doe', attorney_price: 350,
    assigned_operator_id: 'op-1', assigned_attorney_id: 'att-1',
    driver: { id: 'd1', full_name: 'John Doe', phone: '555-1234', email: 'john@test.com', cdl_number: 'CDL123' },
    attorney: { id: 'att-1', full_name: 'Alice Smith', email: 'alice@law.com', specializations: ['speeding'] },
    court_dates: [
      { id: 'cd1', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), court_name: 'Harris County Court', location: 'Houston TX', status: 'scheduled' },
    ],
  };

  const MOCK_ACTIVITY = [
    { id: 'a1', action: 'status_change', details: { from: 'new', to: 'reviewed' }, created_at: new Date().toISOString(), user_id: 'op-1' },
  ];

  function setupCaseDetailMocks(caseResult, activityResult = { data: MOCK_ACTIVITY, error: null }, assignmentResult = { data: [], error: null }) {
    chain.single = jest.fn().mockResolvedValue(caseResult);
    let thenCallCount = 0;
    chain.then = (onFulfilled) => {
      thenCallCount++;
      const result = thenCallCount === 1 ? activityResult : assignmentResult;
      return Promise.resolve(result).then(onFulfilled);
    };
  }

  test('returns enriched case with driver, attorney, court_dates, and activity for assigned operator', async () => {
    setupCaseDetailMocks({ data: MOCK_CASE, error: null });

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();

    await operatorController.getCaseDetail(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.case).toBeDefined();
    expect(body.case.id).toBe('c1');
    expect(body.case.driver).toMatchObject({ full_name: 'John Doe' });
    expect(body.case.attorney).toMatchObject({ full_name: 'Alice Smith' });
    expect(body.case.fine_amount).toBe(350);
    expect(body.case.court_date).toBeDefined();
    expect(body.case.courthouse).toBe('Harris County Court');
    expect(body.case.priority).toBeDefined();
    expect(body.case.ageHours).toBeGreaterThanOrEqual(1);
    expect(body.activity).toHaveLength(1);
    expect(body.activity[0].action).toBe('status_change');
  });

  test('returns 403 for operator not assigned to the case', async () => {
    const otherCase = { ...MOCK_CASE, assigned_operator_id: 'other-op' };
    chain.single = jest.fn().mockResolvedValue({ data: otherCase, error: null });

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();

    await operatorController.getCaseDetail(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'FORBIDDEN' }) })
    );
  });

  test('returns 404 for non-existent case', async () => {
    chain.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } });

    const req = makeReq({ params: { caseId: 'nonexistent' } });
    const res = makeRes();

    await operatorController.getCaseDetail(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'NOT_FOUND' }) })
    );
  });

  test('returns case for admin regardless of assignment', async () => {
    const otherCase = { ...MOCK_CASE, assigned_operator_id: 'other-op' };
    setupCaseDetailMocks({ data: otherCase, error: null });

    const req = makeReq({
      params: { caseId: 'c1' },
      user: { id: 'admin-1', role: 'admin', full_name: 'Admin User' },
    });
    const res = makeRes();

    await operatorController.getCaseDetail(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.case).toBeDefined();
    expect(body.case.id).toBe('c1');
  });

  test('includes assignment_request when one exists', async () => {
    const pendingReq = { id: 'ar-1', status: 'pending', created_at: new Date().toISOString() };
    setupCaseDetailMocks(
      { data: MOCK_CASE, error: null },
      { data: MOCK_ACTIVITY, error: null },
      { data: [pendingReq], error: null }
    );

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();

    await operatorController.getCaseDetail(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.case.assignment_request).toMatchObject({ id: 'ar-1', status: 'pending' });
  });

  test('returns 500 on supabase error', async () => {
    chain.single = jest.fn().mockRejectedValue(new Error('db failure'));

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();

    await operatorController.getCaseDetail(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'FETCH_ERROR' }) })
    );
  });
});

// ============================================================
// updateCaseStatus
// ============================================================
describe('updateCaseStatus', () => {
  function setupUpdateMocks(caseResult, updateResult = { data: { id: 'c1', status: 'reviewed' }, error: null }) {
    let singleCallCount = 0;
    chain.single = jest.fn().mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) return Promise.resolve(caseResult);
      return Promise.resolve(updateResult);
    });
    chain.then = (onFulfilled) => Promise.resolve({ data: null, error: null }).then(onFulfilled);
  }

  test('updates status and creates activity log entry', async () => {
    setupUpdateMocks(
      { data: { id: 'c1', case_number: 'CDL-001', status: 'new', assigned_operator_id: 'op-1', driver_id: 'd1' }, error: null },
      { data: { id: 'c1', case_number: 'CDL-001', status: 'reviewed' }, error: null }
    );

    const req = makeReq({ params: { caseId: 'c1' }, body: { status: 'reviewed', note: 'Initial review done' } });
    const res = makeRes();

    await operatorController.updateCaseStatus(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.case).toBeDefined();
    expect(body.case.status).toBe('reviewed');
    expect(supabase.from).toHaveBeenCalledWith('activity_log');
  });

  test('rejects invalid status values', async () => {
    const req = makeReq({ params: { caseId: 'c1' }, body: { status: 'invalid_status' } });
    const res = makeRes();

    await operatorController.updateCaseStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'INVALID_STATUS' }) })
    );
  });

  test('rejects empty status', async () => {
    const req = makeReq({ params: { caseId: 'c1' }, body: {} });
    const res = makeRes();

    await operatorController.updateCaseStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 for non-existent case', async () => {
    chain.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } });

    const req = makeReq({ params: { caseId: 'nonexistent' }, body: { status: 'reviewed' } });
    const res = makeRes();

    await operatorController.updateCaseStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 403 for non-assigned operator', async () => {
    chain.single = jest.fn().mockResolvedValue({
      data: { id: 'c1', case_number: 'CDL-001', status: 'new', assigned_operator_id: 'other-op', driver_id: 'd1' },
      error: null,
    });

    const req = makeReq({ params: { caseId: 'c1' }, body: { status: 'reviewed' } });
    const res = makeRes();

    await operatorController.updateCaseStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('admin can update any case regardless of assignment', async () => {
    setupUpdateMocks(
      { data: { id: 'c1', case_number: 'CDL-001', status: 'new', assigned_operator_id: 'other-op', driver_id: 'd1' }, error: null },
      { data: { id: 'c1', status: 'reviewed' }, error: null }
    );

    const req = makeReq({
      params: { caseId: 'c1' },
      body: { status: 'reviewed' },
      user: { id: 'admin-1', role: 'admin', full_name: 'Admin' },
    });
    const res = makeRes();

    await operatorController.updateCaseStatus(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.case).toBeDefined();
  });

  test('triggers driver notification for customer-visible status changes', async () => {
    setupUpdateMocks(
      { data: { id: 'c1', case_number: 'CDL-001', status: 'new', assigned_operator_id: 'op-1', driver_id: 'd1' }, error: null },
      { data: { id: 'c1', status: 'assigned_to_attorney' }, error: null }
    );

    const req = makeReq({ params: { caseId: 'c1' }, body: { status: 'assigned_to_attorney' } });
    const res = makeRes();

    await operatorController.updateCaseStatus(req, res);

    expect(supabase.from).toHaveBeenCalledWith('notifications');
  });

  test('returns 500 on update error', async () => {
    let singleCallCount = 0;
    chain.single = jest.fn().mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        return Promise.resolve({ data: { id: 'c1', case_number: 'CDL-001', status: 'new', assigned_operator_id: 'op-1', driver_id: 'd1' }, error: null });
      }
      return Promise.resolve({ data: null, error: { message: 'update failed' } });
    });

    const req = makeReq({ params: { caseId: 'c1' }, body: { status: 'reviewed' } });
    const res = makeRes();

    await operatorController.updateCaseStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ============================================================
// calculatePriority
// ============================================================
describe('calculatePriority', () => {
  function makeCase(overrides = {}) {
    return {
      created_at: new Date().toISOString(),
      assigned_attorney_id: 'att-1',
      ...overrides,
    };
  }

  function daysFromNow(days) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  function hoursAgo(hours) {
    return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  }

  test('returns critical when court date within 3 days', () => {
    const c = makeCase();
    expect(calculatePriority(c, daysFromNow(2))).toBe('critical');
  });

  test('returns critical when court date is exactly 3 days away', () => {
    const c = makeCase();
    expect(calculatePriority(c, daysFromNow(3))).toBe('critical');
  });

  test('returns critical when age >96h and no attorney', () => {
    const c = makeCase({ created_at: hoursAgo(100), assigned_attorney_id: null });
    expect(calculatePriority(c, null)).toBe('critical');
  });

  test('does NOT return critical for age >96h when attorney is assigned', () => {
    const c = makeCase({ created_at: hoursAgo(100), assigned_attorney_id: 'att-1' });
    expect(calculatePriority(c, null)).not.toBe('critical');
  });

  test('returns high when court date within 7 days', () => {
    const c = makeCase();
    expect(calculatePriority(c, daysFromNow(5))).toBe('high');
  });

  test('returns high when case age >48h', () => {
    const c = makeCase({ created_at: hoursAgo(50) });
    expect(calculatePriority(c, null)).toBe('high');
  });

  test('returns medium when court date within 14 days', () => {
    const c = makeCase();
    expect(calculatePriority(c, daysFromNow(10))).toBe('medium');
  });

  test('returns medium when case age >24h', () => {
    const c = makeCase({ created_at: hoursAgo(30) });
    expect(calculatePriority(c, null)).toBe('medium');
  });

  test('returns low when court date >14 days and age <24h', () => {
    const c = makeCase({ created_at: hoursAgo(5) });
    expect(calculatePriority(c, daysFromNow(30))).toBe('low');
  });

  test('returns low when no court date and age <24h', () => {
    const c = makeCase({ created_at: hoursAgo(5) });
    expect(calculatePriority(c, null)).toBe('low');
  });
});

// ============================================================
// pickNextCourtDate
// ============================================================
describe('pickNextCourtDate', () => {
  function daysFromNow(days) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  function daysAgo(days) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  }

  test('returns null for empty array', () => {
    expect(pickNextCourtDate([])).toBeNull();
  });

  test('returns null for null input', () => {
    expect(pickNextCourtDate(null)).toBeNull();
  });

  test('returns null when all court dates are cancelled', () => {
    const dates = [
      { id: '1', date: daysFromNow(5), court_name: 'Court A', status: 'cancelled' },
    ];
    expect(pickNextCourtDate(dates)).toBeNull();
  });

  test('picks closest future scheduled date', () => {
    const dates = [
      { id: '1', date: daysFromNow(10), court_name: 'Far Court', status: 'scheduled' },
      { id: '2', date: daysFromNow(3), court_name: 'Near Court', status: 'scheduled' },
    ];
    expect(pickNextCourtDate(dates)).toMatchObject({ id: '2', court_name: 'Near Court' });
  });

  test('falls back to most recent past date when all are past', () => {
    const dates = [
      { id: '1', date: daysAgo(10), court_name: 'Old Court', status: 'scheduled' },
      { id: '2', date: daysAgo(2), court_name: 'Recent Court', status: 'scheduled' },
    ];
    expect(pickNextCourtDate(dates)).toMatchObject({ id: '2', court_name: 'Recent Court' });
  });

  test('ignores non-scheduled dates and picks scheduled future', () => {
    const dates = [
      { id: '1', date: daysFromNow(2), court_name: 'Cancelled', status: 'cancelled' },
      { id: '2', date: daysFromNow(5), court_name: 'Scheduled', status: 'scheduled' },
    ];
    expect(pickNextCourtDate(dates)).toMatchObject({ id: '2', court_name: 'Scheduled' });
  });

  test('prefers future over past scheduled dates', () => {
    const dates = [
      { id: '1', date: daysAgo(1), court_name: 'Past', status: 'scheduled' },
      { id: '2', date: daysFromNow(1), court_name: 'Future', status: 'scheduled' },
    ];
    expect(pickNextCourtDate(dates)).toMatchObject({ id: '2', court_name: 'Future' });
  });
});

// ============================================================
// getCaseConversation (OC-4)
// ============================================================
describe('getCaseConversation', () => {
  function setupConversationMocks({ caseResult, convoArrayResult, createResult }) {
    let singleCallCount = 0;
    chain.single = jest.fn().mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) return Promise.resolve(caseResult);
      // create conversation call
      return Promise.resolve(createResult || { data: null, error: null });
    });
    // Conversation query returns array
    chain.then = (onFulfilled) => Promise.resolve(convoArrayResult).then(onFulfilled);
  }

  test('returns existing conversation for case', async () => {
    setupConversationMocks({
      caseResult: { data: { case_id: 'c1', driver_id: 'd1', assigned_operator_id: 'op-1' }, error: null },
      convoArrayResult: { data: [{ id: 'conv-1', case_id: 'c1' }], error: null },
    });

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();
    await operatorController.getCaseConversation(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ id: 'conv-1' }),
    }));
  });

  test('returns 404 if case not found', async () => {
    chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
    const req = makeReq({ params: { caseId: 'missing' } });
    const res = makeRes();
    await operatorController.getCaseConversation(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 403 if operator is not assigned to case', async () => {
    chain.single = jest.fn().mockResolvedValue({
      data: { case_id: 'c1', driver_id: 'd1', assigned_operator_id: 'other-op' },
      error: null,
    });
    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();
    await operatorController.getCaseConversation(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('admin can access any case conversation', async () => {
    setupConversationMocks({
      caseResult: { data: { case_id: 'c1', driver_id: 'd1', assigned_operator_id: 'other-op' }, error: null },
      convoArrayResult: { data: [{ id: 'conv-1', case_id: 'c1' }], error: null },
    });

    const req = makeReq({ params: { caseId: 'c1' }, user: { id: 'admin-1', role: 'admin' } });
    const res = makeRes();
    await operatorController.getCaseConversation(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

// ============================================================
// getCaseMessages (OC-4)
// ============================================================
describe('getCaseMessages', () => {
  test('returns messages for case conversation', async () => {
    const msgs = [
      { id: 'm1', content: 'Hello', sender_id: 'op-1', created_at: '2026-03-10T10:00:00Z' },
    ];
    let singleCallCount = 0;
    chain.single = jest.fn().mockImplementation(() => {
      singleCallCount++;
      return Promise.resolve({ data: { case_id: 'c1', assigned_operator_id: 'op-1' }, error: null });
    });
    let thenCallCount = 0;
    chain.then = (onFulfilled) => {
      thenCallCount++;
      if (thenCallCount === 1) {
        return Promise.resolve({ data: [{ id: 'conv-1' }], error: null }).then(onFulfilled);
      }
      return Promise.resolve({ data: msgs, error: null, count: 1 }).then(onFulfilled);
    };

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();
    await operatorController.getCaseMessages(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ messages: msgs }),
    }));
  });

  test('returns empty array when no conversation exists', async () => {
    chain.single = jest.fn().mockResolvedValue({
      data: { case_id: 'c1', assigned_operator_id: 'op-1' }, error: null,
    });
    chain.then = (onFulfilled) =>
      Promise.resolve({ data: [], error: null }).then(onFulfilled);

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();
    await operatorController.getCaseMessages(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.data.messages).toEqual([]);
  });

  test('returns 403 for non-assigned operator', async () => {
    chain.single = jest.fn().mockResolvedValue({
      data: { case_id: 'c1', assigned_operator_id: 'other-op' }, error: null,
    });

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();
    await operatorController.getCaseMessages(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ============================================================
// sendCaseMessage (OC-4)
// ============================================================
describe('sendCaseMessage', () => {
  test('sends message and returns 201', async () => {
    const msgData = { id: 'm1', content: 'Hello driver', sender_id: 'op-1' };
    let singleCallCount = 0;
    chain.single = jest.fn().mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        return Promise.resolve({ data: { case_id: 'c1', driver_id: 'd1', assigned_operator_id: 'op-1' }, error: null });
      }
      // insert message
      return Promise.resolve({ data: msgData, error: null });
    });
    chain.then = (onFulfilled) =>
      Promise.resolve({ data: [{ id: 'conv-1' }], error: null }).then(onFulfilled);
    chain.catch = jest.fn().mockReturnValue(chain);

    const req = makeReq({ params: { caseId: 'c1' }, body: { content: 'Hello driver' } });
    const res = makeRes();
    await operatorController.sendCaseMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ id: 'm1' }),
    }));
  });

  test('returns 400 for empty content', async () => {
    const req = makeReq({ params: { caseId: 'c1' }, body: { content: '   ' } });
    const res = makeRes();
    await operatorController.sendCaseMessage(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 403 for non-assigned operator', async () => {
    chain.single = jest.fn().mockResolvedValue({
      data: { case_id: 'c1', driver_id: 'd1', assigned_operator_id: 'other-op' }, error: null,
    });

    const req = makeReq({ params: { caseId: 'c1' }, body: { content: 'Hi' } });
    const res = makeRes();
    await operatorController.sendCaseMessage(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 404 for missing case', async () => {
    chain.single = jest.fn().mockResolvedValue({ data: null, error: null });

    const req = makeReq({ params: { caseId: 'missing' }, body: { content: 'Hi' } });
    const res = makeRes();
    await operatorController.sendCaseMessage(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ─── OC-5: Batch OCR ────────────────────────────────────────────────
describe('batchOcr', () => {
  const mockOcrService = { extractTicketData: jest.fn() };

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../services/ocr.service', () => mockOcrService);
    mockOcrService.extractTicketData.mockReset();
  });

  // Re-require the controller after mocking ocr.service so the inline require picks it up
  function getController() {
    // Clear cached controller so fresh require() inside batchOcr finds our mock
    delete require.cache[require.resolve('../../src/controllers/operator.controller')];
    return require('../../src/controllers/operator.controller');
  }

  test('returns 400 when no files uploaded', async () => {
    const ctrl = getController();
    const req = makeReq({ files: [] });
    const res = makeRes();
    await ctrl.batchOcr(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'NO_FILES' }) }),
    );
  });

  test('returns 400 when files is undefined', async () => {
    const ctrl = getController();
    const req = makeReq({ files: undefined });
    const res = makeRes();
    await ctrl.batchOcr(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('processes multiple files successfully', async () => {
    mockOcrService.extractTicketData
      .mockResolvedValueOnce({
        extractedData: { violationType: 'Speeding', violationDate: '2026-01-15', state: 'TX', location: 'Harris', fineAmount: 250, courtDate: '2026-03-01', citationNumber: 'CIT-001' },
        validation: { overallConfidence: 92 },
      })
      .mockResolvedValueOnce({
        extractedData: { violationType: 'Red Light', state: 'CA' },
        confidence: 78,
      });

    const ctrl = getController();
    const req = makeReq({
      files: [
        { originalname: 'ticket1.jpg', buffer: Buffer.from('img1') },
        { originalname: 'ticket2.png', buffer: Buffer.from('img2') },
      ],
    });
    const res = makeRes();
    await ctrl.batchOcr(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        results: [
          {
            filename: 'ticket1.jpg',
            success: true,
            data: expect.objectContaining({ violation_type: 'Speeding', state: 'TX', confidence: 92 }),
          },
          {
            filename: 'ticket2.png',
            success: true,
            data: expect.objectContaining({ violation_type: 'Red Light', state: 'CA', confidence: 78 }),
          },
        ],
        summary: { total: 2, successful: 2, failed: 0 },
      },
    });
  });

  test('continues processing when individual file fails', async () => {
    mockOcrService.extractTicketData
      .mockRejectedValueOnce(new Error('Corrupt image'))
      .mockResolvedValueOnce({
        extractedData: { violationType: 'Speeding' },
        validation: { overallConfidence: 85 },
      });

    const ctrl = getController();
    const req = makeReq({
      files: [
        { originalname: 'bad.jpg', buffer: Buffer.from('bad') },
        { originalname: 'good.png', buffer: Buffer.from('good') },
      ],
    });
    const res = makeRes();
    await ctrl.batchOcr(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.data.results[0]).toEqual(
      expect.objectContaining({ filename: 'bad.jpg', success: false, error: 'Corrupt image' }),
    );
    expect(body.data.results[1]).toEqual(
      expect.objectContaining({ filename: 'good.png', success: true }),
    );
    expect(body.data.summary).toEqual({ total: 2, successful: 1, failed: 1 });
  });

  test('maps OCR fields to snake_case correctly', async () => {
    mockOcrService.extractTicketData.mockResolvedValue({
      extractedData: {
        violationType: 'Parking', violationDate: '2026-02-20', state: 'NY',
        location: 'Manhattan', fineAmount: 100, courtDate: '2026-04-15', citationNumber: 'NYC-999',
      },
      validation: { overallConfidence: 95 },
    });

    const ctrl = getController();
    const req = makeReq({ files: [{ originalname: 'test.jpg', buffer: Buffer.from('x') }] });
    const res = makeRes();
    await ctrl.batchOcr(req, res);

    const result = res.json.mock.calls[0][0].data.results[0].data;
    expect(result).toEqual({
      violation_type: 'Parking',
      violation_date: '2026-02-20',
      state: 'NY',
      county: 'Manhattan',
      fine_amount: 100,
      court_date: '2026-04-15',
      citation_number: 'NYC-999',
      confidence: 95,
    });
  });

  test('uses fallback confidence when validation is missing', async () => {
    mockOcrService.extractTicketData.mockResolvedValue({
      extractedData: { violationType: 'Speeding' },
      confidence: 60,
    });

    const ctrl = getController();
    const req = makeReq({ files: [{ originalname: 'f.jpg', buffer: Buffer.from('x') }] });
    const res = makeRes();
    await ctrl.batchOcr(req, res);

    expect(res.json.mock.calls[0][0].data.results[0].data.confidence).toBe(60);
  });

  test('defaults confidence to 0 when both missing', async () => {
    mockOcrService.extractTicketData.mockResolvedValue({ extractedData: {} });

    const ctrl = getController();
    const req = makeReq({ files: [{ originalname: 'f.jpg', buffer: Buffer.from('x') }] });
    const res = makeRes();
    await ctrl.batchOcr(req, res);

    expect(res.json.mock.calls[0][0].data.results[0].data.confidence).toBe(0);
  });
});

// ============================================================
// getTeamCases
// ============================================================
describe('getTeamCases', () => {
  test('returns all non-closed cases with ageHours and operator_name', async () => {
    const now = Date.now();
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    const teamData = [
      {
        id: 't1', case_number: 'CDL-701', status: 'reviewed', state: 'TX',
        violation_type: 'Speeding', created_at: twoHoursAgo, updated_at: twoHoursAgo,
        customer_name: 'Team Driver', assigned_operator_id: 'op-2',
        operator: { id: 'op-2', full_name: 'Other Operator' },
      },
    ];

    buildChain({ data: teamData, error: null });

    const req = makeReq();
    const res = makeRes();
    await operatorController.getTeamCases(req, res);

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.cases).toHaveLength(1);
    expect(body.cases[0].operator_name).toBe('Other Operator');
    expect(body.cases[0].ageHours).toBeGreaterThanOrEqual(2);
    // operator relation should be cleaned up
    expect(body.cases[0].operator).toBeUndefined();
  });

  test('returns empty array when no active cases', async () => {
    buildChain({ data: [], error: null });

    const req = makeReq();
    const res = makeRes();
    await operatorController.getTeamCases(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.cases).toEqual([]);
  });

  test('returns 500 on DB error', async () => {
    const dbErr = new Error('DB fail');
    buildChain({ data: null, error: null });
    chain.then = (onFulfilled, onRejected) => Promise.reject(dbErr).then(onFulfilled, onRejected);

    const req = makeReq();
    const res = makeRes();
    await operatorController.getTeamCases(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error.code).toBe('FETCH_ERROR');
  });

  test('handles null operator gracefully', async () => {
    buildChain({
      data: [{
        id: 't1', case_number: 'CDL-701', status: 'new', state: 'TX',
        violation_type: 'Speeding', created_at: new Date().toISOString(),
        customer_name: 'Unassigned', assigned_operator_id: null, operator: null,
      }],
      error: null,
    });

    const req = makeReq();
    const res = makeRes();
    await operatorController.getTeamCases(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.cases[0].operator_name).toBeNull();
  });
});

// ============================================================
// getClosedCases
// ============================================================
describe('getClosedCases', () => {
  test('returns closed/resolved cases for the requesting operator', async () => {
    const closedCases = [
      { id: 'a1', case_number: 'CDL-501', status: 'closed', state: 'FL',
        violation_type: 'Logbook', customer_name: 'Archived Driver',
        created_at: '2026-02-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
      { id: 'a2', case_number: 'CDL-502', status: 'resolved', state: 'CA',
        violation_type: 'Equipment', customer_name: 'Resolved Driver',
        created_at: '2026-01-15T00:00:00Z', updated_at: '2026-02-15T00:00:00Z' },
    ];

    buildChain({ data: closedCases, error: null });

    const req = makeReq();
    const res = makeRes();
    await operatorController.getClosedCases(req, res);

    expect(chain.eq).toHaveBeenCalledWith('assigned_operator_id', 'op-1');
    expect(chain.in).toHaveBeenCalledWith('status', ['closed', 'resolved']);
    expect(chain.order).toHaveBeenCalledWith('updated_at', { ascending: false });

    const body = res.json.mock.calls[0][0];
    expect(body.cases).toHaveLength(2);
    expect(body.cases[0].case_number).toBe('CDL-501');
  });

  test('returns empty array when operator has no closed cases', async () => {
    buildChain({ data: [], error: null });

    const req = makeReq();
    const res = makeRes();
    await operatorController.getClosedCases(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.cases).toEqual([]);
  });

  test('returns 500 on DB error', async () => {
    const dbErr = new Error('DB fail');
    buildChain({ data: null, error: null });
    chain.then = (onFulfilled, onRejected) => Promise.reject(dbErr).then(onFulfilled, onRejected);

    const req = makeReq();
    const res = makeRes();
    await operatorController.getClosedCases(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error.code).toBe('FETCH_ERROR');
  });
});

// ═══════════════════════════════════════════════
// getAllCasesTable — full case table with 19 fields
// ═══════════════════════════════════════════════
describe('getAllCasesTable', () => {
  // Helper: builds mock chains for getAllCasesTable (call 1 = main, call 2 = case_files)
  function setupCasesTable(rawCases, { total, fileRows = [] } = {}) {
    let mainChain;
    let fromCallCount = 0;
    supabase.from.mockImplementation(() => {
      fromCallCount++;
      const c = {};
      ['select', 'eq', 'neq', 'not', 'gte', 'is', 'in', 'or', 'ilike', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.single = jest.fn().mockResolvedValue({ data: null, error: null });
      c.catch = jest.fn().mockReturnValue(Promise.resolve());

      if (fromCallCount === 1) {
        c.then = (onFulfilled) => Promise.resolve({
          data: rawCases, count: total ?? rawCases.length, error: null,
        }).then(onFulfilled);
        mainChain = c;
      } else {
        c.then = (onFulfilled) => Promise.resolve({ data: fileRows, error: null }).then(onFulfilled);
      }
      return c;
    });
    return { getMainChain: () => mainChain };
  }

  const fullCase = {
    id: 'c1', case_number: 'CDL-001', status: 'reviewed', state: 'TX',
    violation_type: 'Speeding', violation_date: '2026-01-01',
    customer_name: 'Miguel', customer_email: 'miguel@test.com',
    driver_phone: '555-1234', customer_type: 'driver',
    court_date: '2026-04-01', next_action_date: '2026-03-20',
    assigned_operator_id: 'op-1', assigned_attorney_id: 'att-1',
    attorney_price: '350.00', price_cdl: '150.00',
    subscriber_paid: true, court_fee: '75.00', court_fee_paid_by: 'driver',
    carrier: 'Swift Transport', who_sent: 'driver',
    operator: { id: 'op-1', full_name: 'Lisa M.' },
    attorney: { id: 'att-1', full_name: 'James H.' },
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: '2026-03-10',
  };

  test('returns all 19 fields with file count and total', async () => {
    setupCasesTable([fullCase], { total: 1, fileRows: [{ case_id: 'c1' }, { case_id: 'c1' }, { case_id: 'c1' }] });

    const req = makeReq({ query: {} });
    const res = makeRes();
    await operatorController.getAllCasesTable(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.cases).toHaveLength(1);
    const c = body.cases[0];
    expect(c).toMatchObject({
      case_number: 'CDL-001', status: 'reviewed', state: 'TX',
      violation_type: 'Speeding', customer_name: 'Miguel',
      driver_phone: '555-1234', customer_type: 'driver',
      operator_name: 'Lisa M.', attorney_name: 'James H.',
      carrier: 'Swift Transport', who_sent: 'driver',
    });
    expect(c.attorney_price).toBe(350);
    expect(c.price_cdl).toBe(150);
    expect(c.court_fee).toBe(75);
    expect(c.file_count).toBe(3);
    expect(c.ageHours).toBeGreaterThanOrEqual(2);
    expect(body.total).toBe(1);
  });

  test('applies operator-scoped visibility filter via or()', async () => {
    const { getMainChain } = setupCasesTable([]);
    const req = makeReq({ query: {} });
    const res = makeRes();
    await operatorController.getAllCasesTable(req, res);

    expect(getMainChain().or).toHaveBeenCalledWith(
      expect.stringContaining('assigned_operator_id.eq.op-1'),
    );
    expect(getMainChain().or).toHaveBeenCalledWith(
      expect.stringContaining('status.neq.closed'),
    );
  });

  test('applies single status filter', async () => {
    const { getMainChain } = setupCasesTable([]);
    const req = makeReq({ query: { status: 'new' } });
    const res = makeRes();
    await operatorController.getAllCasesTable(req, res);
    expect(getMainChain().eq).toHaveBeenCalledWith('status', 'new');
  });

  test('applies multi-value status filter', async () => {
    const { getMainChain } = setupCasesTable([]);
    const req = makeReq({ query: { status: 'new,reviewed' } });
    const res = makeRes();
    await operatorController.getAllCasesTable(req, res);
    expect(getMainChain().in).toHaveBeenCalledWith('status', ['new', 'reviewed']);
  });

  test('applies state filter (uppercased)', async () => {
    const { getMainChain } = setupCasesTable([]);
    const req = makeReq({ query: { state: 'ca' } });
    const res = makeRes();
    await operatorController.getAllCasesTable(req, res);
    expect(getMainChain().eq).toHaveBeenCalledWith('state', 'CA');
  });

  test('applies carrier ilike filter', async () => {
    const { getMainChain } = setupCasesTable([]);
    const req = makeReq({ query: { carrier: 'swift' } });
    const res = makeRes();
    await operatorController.getAllCasesTable(req, res);
    expect(getMainChain().ilike).toHaveBeenCalledWith('carrier', '%swift%');
  });

  test('applies search across multiple fields via or()', async () => {
    const { getMainChain } = setupCasesTable([]);
    const req = makeReq({ query: { search: 'santos' } });
    const res = makeRes();
    await operatorController.getAllCasesTable(req, res);

    // The second or() call is the search (first is the scoping filter)
    const orCalls = getMainChain().or.mock.calls;
    const searchCall = orCalls.find(c => c[0].includes('customer_name.ilike'));
    expect(searchCall).toBeTruthy();
    expect(searchCall[0]).toContain('carrier.ilike.%santos%');
  });

  test('applies sort_by and sort_dir', async () => {
    const { getMainChain } = setupCasesTable([]);
    const req = makeReq({ query: { sort_by: 'court_date', sort_dir: 'asc' } });
    const res = makeRes();
    await operatorController.getAllCasesTable(req, res);
    expect(getMainChain().order).toHaveBeenCalledWith('court_date', { ascending: true });
  });

  test('falls back to created_at for invalid sort_by', async () => {
    const { getMainChain } = setupCasesTable([]);
    const req = makeReq({ query: { sort_by: 'invalid_column' } });
    const res = makeRes();
    await operatorController.getAllCasesTable(req, res);
    expect(getMainChain().order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  test('returns 500 on database error', async () => {
    supabase.from.mockImplementation(() => {
      const c = {};
      ['select', 'eq', 'neq', 'not', 'gte', 'is', 'in', 'or', 'ilike', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.then = (onFulfilled) => Promise.resolve({ data: null, error: { message: 'fail' } }).then(onFulfilled);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());
      return c;
    });

    const req = makeReq({ query: {} });
    const res = makeRes();
    await operatorController.getAllCasesTable(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error.code).toBe('FETCH_FAILED');
  });
});
