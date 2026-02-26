/**
 * Workflow Service - Status transitions and SLA tracking
 * Location: backend/src/services/workflow.service.js
 */

const { supabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Valid status transitions
 */
const STATUS_TRANSITIONS = {
  'new': ['pending_documents', 'under_review', 'assigned', 'withdrawn'],
  'pending_documents': ['under_review', 'assigned', 'withdrawn'],
  'under_review': ['assigned', 'pending_documents', 'withdrawn'],
  'assigned': ['in_progress', 'withdrawn'],
  'in_progress': ['pending_court', 'pending_client', 'resolved', 'withdrawn'],
  'pending_court': ['in_progress', 'resolved', 'withdrawn'],
  'pending_client': ['in_progress', 'resolved', 'withdrawn'],
  'resolved': ['closed'],
  'closed': [],
  'withdrawn': [],
  'dismissed': []
};

/**
 * SLA thresholds (in hours)
 */
const SLA_THRESHOLDS = {
  'new': 24,                    // Must be reviewed within 24 hours
  'pending_documents': 72,      // Documents must be submitted within 72 hours
  'under_review': 48,           // Review must complete within 48 hours
  'assigned': 24,               // Attorney must start work within 24 hours
  'in_progress': 168,           // Case should progress within 7 days
  'pending_court': 336,         // Court date typically within 14 days
  'pending_client': 48,         // Client response needed within 48 hours
  'resolved': 24                // Should be closed within 24 hours of resolution
};

/**
 * Validate if status transition is allowed
 * @param {string} currentStatus - Current case status
 * @param {string} newStatus - Desired new status
 * @returns {Object} Validation result
 */
const validateStatusTransition = (currentStatus, newStatus) => {
  try {
    if (!currentStatus || !newStatus) {
      return {
        valid: false,
        error: 'Current status and new status are required'
      };
    }

    if (!STATUS_TRANSITIONS[currentStatus]) {
      return {
        valid: false,
        error: `Invalid current status: ${currentStatus}`
      };
    }

    const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
    
    if (!allowedTransitions.includes(newStatus)) {
      return {
        valid: false,
        error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ')}`
      };
    }

    return {
      valid: true,
      currentStatus,
      newStatus
    };
  } catch (error) {
    logger.error('Error validating status transition:', error);
    return {
      valid: false,
      error: error.message
    };
  }
};

/**
 * Track SLA for a case
 * @param {string} caseId - Case UUID
 * @param {string} status - Current status
 * @returns {Promise<Object>} SLA tracking data
 */
const trackSLA = async (caseId, status) => {
  try {
    // Get case status history
    const { data: history, error: historyError } = await supabase
      .from('case_status_history')
      .select('*')
      .eq('case_id', caseId)
      .eq('status', status)
      .order('changed_at', { ascending: false })
      .limit(1);

    if (historyError) throw historyError;

    const statusChangedAt = history && history.length > 0 
      ? new Date(history[0].changed_at) 
      : new Date();

    const now = new Date();
    const hoursInStatus = (now - statusChangedAt) / (1000 * 60 * 60);
    const slaThreshold = SLA_THRESHOLDS[status] || 24;
    const remainingHours = slaThreshold - hoursInStatus;
    const isBreached = remainingHours < 0;
    const isAtRisk = remainingHours > 0 && remainingHours < (slaThreshold * 0.2); // Within 20% of deadline

    // Update or create SLA tracking record
    const { data: existingTracking, error: trackingError } = await supabase
      .from('case_sla_tracking')
      .select('*')
      .eq('case_id', caseId)
      .eq('status', status)
      .single();

    const slaData = {
      case_id: caseId,
      status,
      status_changed_at: statusChangedAt.toISOString(),
      sla_threshold_hours: slaThreshold,
      hours_in_status: Math.round(hoursInStatus * 10) / 10,
      remaining_hours: Math.round(remainingHours * 10) / 10,
      is_breached: isBreached,
      is_at_risk: isAtRisk,
      checked_at: now.toISOString()
    };

    if (existingTracking) {
      await supabase
        .from('case_sla_tracking')
        .update(slaData)
        .eq('case_id', caseId)
        .eq('status', status);
    } else {
      await supabase
        .from('case_sla_tracking')
        .insert(slaData);
    }

    logger.info(`SLA tracked for case ${caseId}, status ${status}: ${isBreached ? 'BREACHED' : isAtRisk ? 'AT RISK' : 'OK'}`);

    return slaData;
  } catch (error) {
    logger.error('Error tracking SLA:', error);
    throw error;
  }
};

/**
 * Check for SLA breaches across all active cases
 * @returns {Promise<Array>} Cases with SLA breaches or at risk
 */
const checkSLABreaches = async () => {
  try {
    // Get all active cases
    const { data: cases, error } = await supabase
      .from('cases')
      .select('case_id, case_number, status, assigned_attorney_id, assigned_operator_id')
      .not('status', 'in', '(closed,withdrawn,dismissed)');

    if (error) throw error;

    const breachedCases = [];
    const atRiskCases = [];

    // Check SLA for each case
    for (const case_ of cases) {
      const slaData = await trackSLA(case_.case_id, case_.status);
      
      if (slaData.is_breached) {
        breachedCases.push({
          ...case_,
          sla: slaData
        });
      } else if (slaData.is_at_risk) {
        atRiskCases.push({
          ...case_,
          sla: slaData
        });
      }
    }

    logger.info(`SLA check complete: ${breachedCases.length} breached, ${atRiskCases.length} at risk`);

    return {
      breachedCases,
      atRiskCases,
      totalChecked: cases.length,
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error checking SLA breaches:', error);
    throw error;
  }
};

/**
 * Escalate a case
 * @param {string} caseId - Case UUID
 * @param {string} reason - Escalation reason
 * @param {string} escalatedBy - User ID of person escalating
 * @returns {Promise<Object>} Escalation result
 */
const escalateCase = async (caseId, reason, escalatedBy = null) => {
  try {
    // Get case details
    const { data: case_, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('case_id', caseId)
      .single();

    if (caseError) throw caseError;
    if (!case_) throw new Error('Case not found');

    // Update case with escalation flag
    const { data: updatedCase, error: updateError } = await supabase
      .from('cases')
      .update({
        is_escalated: true,
        escalated_at: new Date().toISOString(),
        escalation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('case_id', caseId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log escalation in case history
    await supabase
      .from('case_status_history')
      .insert({
        case_id: caseId,
        status: case_.status,
        changed_by: escalatedBy,
        notes: `Case escalated: ${reason}`,
        changed_at: new Date().toISOString()
      });

    // TODO: Send notifications to relevant parties

    logger.info(`Case ${caseId} escalated: ${reason}`);

    return {
      success: true,
      caseId,
      escalatedAt: updatedCase.escalated_at,
      reason
    };
  } catch (error) {
    logger.error('Error escalating case:', error);
    throw error;
  }
};

/**
 * Update case status with validation and history tracking
 * @param {string} caseId - Case UUID
 * @param {string} newStatus - New status
 * @param {string} changedBy - User ID making the change
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} Updated case
 */
const updateCaseStatus = async (caseId, newStatus, changedBy = null, notes = null) => {
  try {
    // Get current case
    const { data: case_, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('case_id', caseId)
      .single();

    if (caseError) throw caseError;
    if (!case_) throw new Error('Case not found');

    // Validate transition
    const validation = validateStatusTransition(case_.status, newStatus);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Update case status
    const { data: updatedCase, error: updateError } = await supabase
      .from('cases')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('case_id', caseId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Record status history
    await supabase
      .from('case_status_history')
      .insert({
        case_id: caseId,
        status: newStatus,
        previous_status: case_.status,
        changed_by: changedBy,
        notes,
        changed_at: new Date().toISOString()
      });

    // Track SLA for new status
    await trackSLA(caseId, newStatus);

    logger.info(`Case ${caseId} status changed from ${case_.status} to ${newStatus}`);

    return {
      success: true,
      case: updatedCase,
      previousStatus: case_.status,
      newStatus
    };
  } catch (error) {
    logger.error('Error updating case status:', error);
    throw error;
  }
};

/**
 * Get case status history
 * @param {string} caseId - Case UUID
 * @returns {Promise<Array>} Status history
 */
const getCaseStatusHistory = async (caseId) => {
  try {
    const { data, error } = await supabase
      .from('case_status_history')
      .select(`
        *,
        changed_by_user:users!case_status_history_changed_by_fkey(
          user_id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('case_id', caseId)
      .order('changed_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error getting case status history:', error);
    throw error;
  }
};

/**
 * Get SLA status for a case
 * @param {string} caseId - Case UUID
 * @returns {Promise<Object>} SLA status
 */
const getCaseSLAStatus = async (caseId) => {
  try {
    const { data: case_, error: caseError } = await supabase
      .from('cases')
      .select('case_id, status')
      .eq('case_id', caseId)
      .single();

    if (caseError) throw caseError;
    if (!case_) throw new Error('Case not found');

    const slaData = await trackSLA(caseId, case_.status);

    return slaData;
  } catch (error) {
    logger.error('Error getting case SLA status:', error);
    throw error;
  }
};

module.exports = {
  validateStatusTransition,
  trackSLA,
  checkSLABreaches,
  escalateCase,
  updateCaseStatus,
  getCaseStatusHistory,
  getCaseSLAStatus,
  STATUS_TRANSITIONS,
  SLA_THRESHOLDS
};
