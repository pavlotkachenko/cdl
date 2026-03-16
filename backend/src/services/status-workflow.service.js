/**
 * Status Workflow Service — Transition rules for case_status enum
 * Location: backend/src/services/status-workflow.service.js
 *
 * Enforces the valid state machine for case progression.
 * Used by case.controller.changeStatus (server-side) and exposed
 * via GET /api/cases/:id/next-statuses (client-side).
 */

const TRANSITIONS = {
  'new':                    ['reviewed'],
  'reviewed':               ['assigned_to_attorney', 'closed'],
  'assigned_to_attorney':   ['send_info_to_attorney', 'waiting_for_driver', 'call_court', 'check_with_manager', 'closed'],
  'send_info_to_attorney':  ['waiting_for_driver', 'call_court', 'check_with_manager'],
  'waiting_for_driver':     ['send_info_to_attorney', 'call_court', 'check_with_manager'],
  'call_court':             ['waiting_for_driver', 'pay_attorney', 'check_with_manager', 'resolved', 'closed'],
  'check_with_manager':     ['assigned_to_attorney', 'call_court', 'pay_attorney', 'closed'],
  'pay_attorney':           ['attorney_paid'],
  'attorney_paid':          ['resolved', 'closed'],
  'resolved':               ['closed'],
  'closed':                 [],
};

const REQUIRES_NOTE = ['closed', 'check_with_manager'];

/**
 * Check if a status transition is allowed.
 * @param {string} from - Current status
 * @param {string} to - Target status
 * @returns {{ allowed: boolean, requiresNote: boolean, error?: string }}
 */
function validateTransition(from, to) {
  const allowed = TRANSITIONS[from];

  if (!allowed) {
    return {
      allowed: false,
      requiresNote: false,
      error: `Unknown current status: "${from}"`,
    };
  }

  if (!allowed.includes(to)) {
    return {
      allowed: false,
      requiresNote: false,
      error: `Cannot transition from "${from}" to "${to}". Allowed: ${allowed.join(', ') || 'none (terminal status)'}`,
    };
  }

  return {
    allowed: true,
    requiresNote: REQUIRES_NOTE.includes(to),
  };
}

/**
 * Get the list of statuses reachable from the current one.
 * @param {string} currentStatus
 * @returns {string[]}
 */
function getNextStatuses(currentStatus) {
  return TRANSITIONS[currentStatus] || [];
}

/**
 * Build the requiresNote map for a set of statuses.
 * @param {string[]} statuses
 * @returns {Record<string, boolean>}
 */
function buildRequiresNoteMap(statuses) {
  const map = {};
  for (const s of statuses) {
    if (REQUIRES_NOTE.includes(s)) {
      map[s] = true;
    }
  }
  return map;
}

module.exports = {
  validateTransition,
  getNextStatuses,
  buildRequiresNoteMap,
  TRANSITIONS,
  REQUIRES_NOTE,
};
