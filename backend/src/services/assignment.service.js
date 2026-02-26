/**
 * Assignment Service - Smart attorney assignment with scoring algorithm
 * Location: backend/src/services/assignment.service.js
 */

const { supabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Scoring weights for attorney matching algorithm
 */
const SCORING_WEIGHTS = {
  specialization: 0.30,    // 30% - Match with case type
  stateLicense: 0.25,      // 25% - Licensed in violation state
  workload: 0.20,          // 20% - Current case load
  successRate: 0.15,       // 15% - Historical success rate
  availability: 0.10       // 10% - Current availability status
};

/**
 * Calculate attorney score for a specific case
 * @param {Object} attorney - Attorney user object
 * @param {Object} caseData - Case details
 * @returns {Object} Score breakdown and total
 */
const calculateScore = (attorney, caseData) => {
  try {
    const breakdown = {
      specialization: 0,
      stateLicense: 0,
      workload: 0,
      successRate: 0,
      availability: 0
    };

    // 1. Specialization Score (0-100)
    if (attorney.specializations && Array.isArray(attorney.specializations)) {
      const caseType = caseData.violation_type || caseData.violationType || '';
      const hasMatch = attorney.specializations.some(spec => 
        caseType.toLowerCase().includes(spec.toLowerCase()) ||
        spec.toLowerCase().includes(caseType.toLowerCase())
      );
      breakdown.specialization = hasMatch ? 100 : 50; // 50 for general practice
    } else {
      breakdown.specialization = 50; // Default for no specialization data
    }

    // 2. State License Score (0-100)
    if (attorney.state_licenses && Array.isArray(attorney.state_licenses)) {
      const caseState = caseData.violation_state || caseData.violationState || '';
      const isLicensed = attorney.state_licenses.includes(caseState);
      breakdown.stateLicense = isLicensed ? 100 : 0;
    } else {
      breakdown.stateLicense = 0;
    }

    // 3. Workload Score (0-100) - inverse score, lower workload = higher score
    const currentWorkload = attorney.current_cases_count || 0;
    const maxWorkload = 50; // Assume max comfortable workload is 50 cases
    breakdown.workload = Math.max(0, 100 - (currentWorkload / maxWorkload * 100));

    // 4. Success Rate Score (0-100)
    const successRate = attorney.success_rate || 0;
    breakdown.successRate = successRate * 100; // Assuming success_rate is 0-1 decimal

    // 5. Availability Score (0-100)
    const availabilityStatus = attorney.availability_status || 'available';
    const availabilityScores = {
      'available': 100,
      'limited': 60,
      'busy': 30,
      'unavailable': 0
    };
    breakdown.availability = availabilityScores[availabilityStatus] || 50;

    // Calculate weighted total score
    const totalScore = 
      (breakdown.specialization * SCORING_WEIGHTS.specialization) +
      (breakdown.stateLicense * SCORING_WEIGHTS.stateLicense) +
      (breakdown.workload * SCORING_WEIGHTS.workload) +
      (breakdown.successRate * SCORING_WEIGHTS.successRate) +
      (breakdown.availability * SCORING_WEIGHTS.availability);

    return {
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown,
      weights: SCORING_WEIGHTS
    };
  } catch (error) {
    logger.error('Error calculating attorney score:', error);
    throw error;
  }
};

/**
 * Get eligible attorneys and rank them by score
 * @param {string} caseId - Case UUID
 * @returns {Promise<Array>} Sorted array of attorneys with scores
 */
const rankAttorneys = async (caseId) => {
  try {
    // Get case details
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('case_id', caseId)
      .single();

    if (caseError) throw caseError;
    if (!caseData) throw new Error('Case not found');

    // Get all active attorneys
    const { data: attorneys, error: attorneyError } = await supabase
      .from('users')
      .select(`
        user_id,
        first_name,
        last_name,
        email,
        specializations,
        state_licenses,
        success_rate,
        availability_status,
        current_cases_count
      `)
      .eq('role', 'attorney')
      .eq('is_active', true);

    if (attorneyError) throw attorneyError;

    // Calculate scores for each attorney
    const scoredAttorneys = attorneys.map(attorney => {
      const scoreData = calculateScore(attorney, caseData);
      return {
        userId: attorney.user_id,
        firstName: attorney.first_name,
        lastName: attorney.last_name,
        email: attorney.email,
        specializations: attorney.specializations,
        stateLicenses: attorney.state_licenses,
        successRate: attorney.success_rate,
        availabilityStatus: attorney.availability_status,
        currentCases: attorney.current_cases_count || 0,
        score: scoreData.totalScore,
        scoreBreakdown: scoreData.breakdown
      };
    });

    // Sort by score descending
    const rankedAttorneys = scoredAttorneys.sort((a, b) => b.score - a.score);

    logger.info(`Ranked ${rankedAttorneys.length} attorneys for case ${caseId}`);
    return rankedAttorneys;
  } catch (error) {
    logger.error('Error ranking attorneys:', error);
    throw error;
  }
};

/**
 * Auto-assign case to highest-scoring attorney
 * @param {string} caseId - Case UUID
 * @param {string} assignedBy - User ID of person performing assignment
 * @returns {Promise<Object>} Assignment result
 */
const autoAssign = async (caseId, assignedBy = null) => {
  try {
    // Get ranked attorneys
    const rankedAttorneys = await rankAttorneys(caseId);

    if (rankedAttorneys.length === 0) {
      throw new Error('No eligible attorneys found');
    }

    // Filter out unavailable attorneys
    const availableAttorneys = rankedAttorneys.filter(
      attorney => attorney.availabilityStatus !== 'unavailable'
    );

    if (availableAttorneys.length === 0) {
      throw new Error('No available attorneys found');
    }

    // Select highest-scoring available attorney
    const selectedAttorney = availableAttorneys[0];

    // Check if case is already assigned
    const { data: existingCase, error: checkError } = await supabase
      .from('cases')
      .select('assigned_attorney_id')
      .eq('case_id', caseId)
      .single();

    if (checkError) throw checkError;

    if (existingCase.assigned_attorney_id) {
      throw new Error('Case is already assigned');
    }

    // Perform assignment
    const { data: updatedCase, error: assignError } = await supabase
      .from('cases')
      .update({
        assigned_attorney_id: selectedAttorney.userId,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('case_id', caseId)
      .select()
      .single();

    if (assignError) throw assignError;

    // Record assignment history
    await supabase
      .from('case_assignments')
      .insert({
        case_id: caseId,
        attorney_id: selectedAttorney.userId,
        assigned_by: assignedBy,
        assignment_method: 'auto',
        assignment_score: selectedAttorney.score,
        score_breakdown: selectedAttorney.scoreBreakdown,
        assigned_at: new Date().toISOString()
      });

    // Increment attorney's case count
    await supabase.rpc('increment_attorney_cases', {
      attorney_id: selectedAttorney.userId
    });

    logger.info(`Auto-assigned case ${caseId} to attorney ${selectedAttorney.userId} (score: ${selectedAttorney.score})`);

    return {
      success: true,
      caseId,
      assignedAttorney: {
        userId: selectedAttorney.userId,
        name: `${selectedAttorney.firstName} ${selectedAttorney.lastName}`,
        email: selectedAttorney.email,
        score: selectedAttorney.score,
        scoreBreakdown: selectedAttorney.scoreBreakdown
      },
      case: updatedCase
    };
  } catch (error) {
    logger.error('Error in auto-assignment:', error);
    throw error;
  }
};

/**
 * Manually assign case to specific attorney
 * @param {string} caseId - Case UUID
 * @param {string} attorneyId - Attorney user ID
 * @param {string} assignedBy - User ID of person performing assignment
 * @returns {Promise<Object>} Assignment result
 */
const manualAssign = async (caseId, attorneyId, assignedBy = null) => {
  try {
    // Verify attorney exists and is active
    const { data: attorney, error: attorneyError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, email, role, is_active')
      .eq('user_id', attorneyId)
      .single();

    if (attorneyError) throw attorneyError;
    if (!attorney) throw new Error('Attorney not found');
    if (attorney.role !== 'attorney') throw new Error('User is not an attorney');
    if (!attorney.is_active) throw new Error('Attorney is not active');

    // Get case to calculate score
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('case_id', caseId)
      .single();

    if (caseError) throw caseError;
    if (!caseData) throw new Error('Case not found');

    if (caseData.assigned_attorney_id) {
      throw new Error('Case is already assigned');
    }

    // Calculate score for the selected attorney
    const { data: attorneyDetails, error: detailsError } = await supabase
      .from('users')
      .select('specializations, state_licenses, success_rate, availability_status, current_cases_count')
      .eq('user_id', attorneyId)
      .single();

    if (detailsError) throw detailsError;

    const scoreData = calculateScore(attorneyDetails, caseData);

    // Perform assignment
    const { data: updatedCase, error: assignError } = await supabase
      .from('cases')
      .update({
        assigned_attorney_id: attorneyId,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('case_id', caseId)
      .select()
      .single();

    if (assignError) throw assignError;

    // Record assignment history
    await supabase
      .from('case_assignments')
      .insert({
        case_id: caseId,
        attorney_id: attorneyId,
        assigned_by: assignedBy,
        assignment_method: 'manual',
        assignment_score: scoreData.totalScore,
        score_breakdown: scoreData.breakdown,
        assigned_at: new Date().toISOString()
      });

    // Increment attorney's case count
    await supabase.rpc('increment_attorney_cases', {
      attorney_id: attorneyId
    });

    logger.info(`Manually assigned case ${caseId} to attorney ${attorneyId}`);

    return {
      success: true,
      caseId,
      assignedAttorney: {
        userId: attorney.user_id,
        name: `${attorney.first_name} ${attorney.last_name}`,
        email: attorney.email,
        score: scoreData.totalScore,
        scoreBreakdown: scoreData.breakdown
      },
      case: updatedCase
    };
  } catch (error) {
    logger.error('Error in manual assignment:', error);
    throw error;
  }
};

module.exports = {
  calculateScore,
  rankAttorneys,
  autoAssign,
  manualAssign,
  SCORING_WEIGHTS
};
