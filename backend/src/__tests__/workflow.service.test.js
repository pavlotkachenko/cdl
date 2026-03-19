/**
 * Unit tests for workflow.service.js
 * Covers: validateStatusTransition (pure), updateCaseStatus (DB mocked)
 */

// ── Mocks ────────────────────────────────────────────────────────────────────
const chain = {
  select: jest.fn(), insert: jest.fn(), update: jest.fn(),
  eq: jest.fn(), order: jest.fn(), limit: jest.fn(),
  single: jest.fn(), maybeSingle: jest.fn(),
};
const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock('../config/database', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(),
}));
jest.mock('../services/email.service', () => ({
  sendCaseStatusEmail: jest.fn(),
}));

const { sendCaseStatusEmail } = require('../services/email.service');
const {
  validateStatusTransition,
  updateCaseStatus,
  STATUS_TRANSITIONS,
} = require('../services/workflow.service');

// ── Helpers ───────────────────────────────────────────────────────────────────
function setupChain() {
  Object.keys(chain).forEach(k => {
    if (['single', 'maybeSingle'].includes(k)) return;
    chain[k].mockReturnValue(chain);
  });
  mockFrom.mockReturnValue(chain);
}

beforeEach(() => {
  jest.resetAllMocks();
  setupChain();
});

// ── validateStatusTransition ─────────────────────────────────────────────────
describe('validateStatusTransition', () => {
  it('returns valid:true for allowed transitions', () => {
    expect(validateStatusTransition('new', 'assigned').valid).toBe(true);
    expect(validateStatusTransition('assigned', 'in_progress').valid).toBe(true);
    expect(validateStatusTransition('in_progress', 'resolved').valid).toBe(true);
    expect(validateStatusTransition('resolved', 'closed').valid).toBe(true);
  });

  it('returns valid:false with error for disallowed transitions', () => {
    const result = validateStatusTransition('closed', 'new');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Cannot transition/);
  });

  it('returns valid:false when current status is missing', () => {
    const result = validateStatusTransition(null, 'assigned');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/);
  });

  it('returns valid:false when new status is missing', () => {
    const result = validateStatusTransition('new', null);
    expect(result.valid).toBe(false);
  });

  it('returns valid:false for unknown current status', () => {
    const result = validateStatusTransition('ghost_status', 'assigned');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Invalid current status/);
  });

  it('terminal statuses (closed, withdrawn) have no allowed transitions', () => {
    expect(STATUS_TRANSITIONS['closed']).toHaveLength(0);
    expect(STATUS_TRANSITIONS['withdrawn']).toHaveLength(0);
  });
});

// ── updateCaseStatus ──────────────────────────────────────────────────────────
describe('updateCaseStatus', () => {
  const caseId = 'case-uuid-1';
  const existingCase = {
    case_id: caseId,
    status: 'new',
    driver_id: 'driver-uuid-1',
  };
  const updatedCase = { ...existingCase, status: 'assigned' };

  it('transitions status and returns success result', async () => {
    // 1st single() → get current case
    chain.single
      .mockResolvedValueOnce({ data: existingCase, error: null })
      // 2nd single() → updated case
      .mockResolvedValueOnce({ data: updatedCase, error: null });
    // insert (history) — no .single(), just resolves
    chain.insert.mockReturnValue({ ...chain, then: undefined });

    // trackSLA queries
    chain.single
      .mockResolvedValueOnce({ data: [], error: null })  // history query
      .mockResolvedValueOnce({ data: null, error: null }); // existing sla tracking
    chain.maybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await updateCaseStatus(caseId, 'assigned');

    expect(result.success).toBe(true);
    expect(result.newStatus).toBe('assigned');
    expect(result.previousStatus).toBe('new');
  });

  it('throws if case not found', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: null });

    await expect(updateCaseStatus(caseId, 'assigned')).rejects.toThrow('Case not found');
  });

  it('throws if DB returns error fetching case', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: new Error('db error') });

    await expect(updateCaseStatus(caseId, 'assigned')).rejects.toThrow('db error');
  });

  it('throws if transition is invalid', async () => {
    chain.single.mockResolvedValueOnce({
      data: { ...existingCase, status: 'closed' },
      error: null,
    });

    await expect(updateCaseStatus(caseId, 'new')).rejects.toThrow(/Cannot transition/);
  });

  it('triggers status email for driver-visible statuses', async () => {
    const driver = { full_name: 'John Driver', email: 'john@test.com' };
    chain.single
      .mockResolvedValueOnce({ data: existingCase, error: null })  // current case
      .mockResolvedValueOnce({ data: updatedCase, error: null });  // updated case
    // trackSLA internals
    chain.single
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    chain.maybeSingle
      .mockResolvedValueOnce({ data: driver, error: null }); // driver lookup (only maybeSingle call)

    await updateCaseStatus(caseId, 'assigned');

    // Email is fire-and-forget; give microtask queue a tick
    await new Promise(r => setImmediate(r));
    expect(sendCaseStatusEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: driver.email, newStatus: 'assigned', caseId })
    );
  });

  it('does NOT send email for internal status transitions (under_review)', async () => {
    const internalCase = { case_id: caseId, status: 'new', driver_id: 'driver-uuid-1' };
    chain.single
      .mockResolvedValueOnce({ data: internalCase, error: null })
      .mockResolvedValueOnce({ data: { ...internalCase, status: 'under_review' }, error: null });
    chain.single
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    chain.maybeSingle.mockResolvedValue({ data: null, error: null });

    await updateCaseStatus(caseId, 'under_review');
    await new Promise(r => setImmediate(r));

    expect(sendCaseStatusEmail).not.toHaveBeenCalled();
  });
});
