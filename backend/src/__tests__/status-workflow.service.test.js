const {
  validateTransition,
  getNextStatuses,
  buildRequiresNoteMap,
  TRANSITIONS,
  REQUIRES_NOTE,
} = require('../services/status-workflow.service');

// ============================================================
// validateTransition
// ============================================================
describe('validateTransition', () => {
  test('allows new → reviewed', () => {
    const result = validateTransition('new', 'reviewed');
    expect(result).toEqual({ allowed: true, requiresNote: false });
  });

  test('rejects new → closed (can\'t skip)', () => {
    const result = validateTransition('new', 'closed');
    expect(result.allowed).toBe(false);
    expect(result.error).toMatch(/Cannot transition/);
  });

  test('rejects closed → new (terminal status)', () => {
    const result = validateTransition('closed', 'new');
    expect(result.allowed).toBe(false);
    expect(result.error).toMatch(/terminal status/);
  });

  test('allows call_court → closed with requiresNote=true', () => {
    const result = validateTransition('call_court', 'closed');
    expect(result).toEqual({ allowed: true, requiresNote: true });
  });

  test('allows reviewed → assigned_to_attorney (no note)', () => {
    const result = validateTransition('reviewed', 'assigned_to_attorney');
    expect(result).toEqual({ allowed: true, requiresNote: false });
  });

  test('flags check_with_manager as requiresNote', () => {
    const result = validateTransition('assigned_to_attorney', 'check_with_manager');
    expect(result).toEqual({ allowed: true, requiresNote: true });
  });

  test('returns error for unknown current status', () => {
    const result = validateTransition('nonexistent', 'reviewed');
    expect(result.allowed).toBe(false);
    expect(result.error).toMatch(/Unknown current status/);
  });

  test('allows pay_attorney → attorney_paid', () => {
    const result = validateTransition('pay_attorney', 'attorney_paid');
    expect(result).toEqual({ allowed: true, requiresNote: false });
  });

  test('rejects pay_attorney → closed (not allowed)', () => {
    const result = validateTransition('pay_attorney', 'closed');
    expect(result.allowed).toBe(false);
  });
});

// ============================================================
// getNextStatuses
// ============================================================
describe('getNextStatuses', () => {
  test('new returns only reviewed', () => {
    expect(getNextStatuses('new')).toEqual(['reviewed']);
  });

  test('assigned_to_attorney returns 5 options', () => {
    const next = getNextStatuses('assigned_to_attorney');
    expect(next).toHaveLength(5);
    expect(next).toEqual([
      'send_info_to_attorney', 'waiting_for_driver',
      'call_court', 'check_with_manager', 'closed',
    ]);
  });

  test('closed returns empty array', () => {
    expect(getNextStatuses('closed')).toEqual([]);
  });

  test('resolved returns only closed', () => {
    expect(getNextStatuses('resolved')).toEqual(['closed']);
  });

  test('unknown status returns empty array', () => {
    expect(getNextStatuses('nonexistent')).toEqual([]);
  });
});

// ============================================================
// buildRequiresNoteMap
// ============================================================
describe('buildRequiresNoteMap', () => {
  test('returns note flags only for statuses that require notes', () => {
    const map = buildRequiresNoteMap(['closed', 'reviewed', 'check_with_manager']);
    expect(map).toEqual({ closed: true, check_with_manager: true });
  });

  test('returns empty object when no statuses require notes', () => {
    expect(buildRequiresNoteMap(['reviewed', 'pay_attorney'])).toEqual({});
  });
});

// ============================================================
// Exports sanity
// ============================================================
describe('module exports', () => {
  test('TRANSITIONS covers all 11 statuses', () => {
    expect(Object.keys(TRANSITIONS)).toHaveLength(11);
  });

  test('REQUIRES_NOTE lists closed and check_with_manager', () => {
    expect(REQUIRES_NOTE).toEqual(['closed', 'check_with_manager']);
  });
});
