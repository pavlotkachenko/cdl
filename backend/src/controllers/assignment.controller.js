/**
 * Assignment Controller - Smart attorney assignment endpoints
 * Location: backend/src/controllers/assignment.controller.js
 */

const assignmentService = require('../services/assignment.service');
const logger = require('../utils/logger');

/**
 * Get ranked attorneys for a case
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getRankedAttorneys = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { limit, includeUnavailable } = req.query;

    if (!caseId) {
      return res.status(400).json({
        success: false,
        error: 'Case ID is required'
      });
    }

    const rankedAttorneys = await assignmentService.rankAttorneys(caseId);

    // Filter if needed
    let filteredAttorneys = rankedAttorneys;
    if (includeUnavailable !== 'true') {
      filteredAttorneys = rankedAttorneys.filter(
        a => a.availabilityStatus !== 'unavailable'
      );
    }

    // Apply limit
    if (limit) {
      filteredAttorneys = filteredAttorneys.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: {
        attorneys: filteredAttorneys,
        total: filteredAttorneys.length,
        caseId
      }
    });
  } catch (error) {
    logger.error('Error getting ranked attorneys:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Auto-assign case to best attorney
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const autoAssignCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user?.userId;

    if (!caseId) {
      return res.status(400).json({
        success: false,
        error: 'Case ID is required'
      });
    }

    const result = await assignmentService.autoAssign(caseId, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'No attorneys available at this time'
      });
    }

    res.json({
      success: true,
      message: 'Case auto-assigned successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error auto-assigning case:', error);
    const status = error.message.includes('already assigned') ? 409
      : error.message.includes('No eligible') ? 404
      : 500;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Manually assign case to specific attorney
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const manualAssignCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { attorneyId } = req.body;
    const userId = req.user?.userId;

    if (!caseId || !attorneyId) {
      return res.status(400).json({
        success: false,
        error: 'Case ID and Attorney ID are required'
      });
    }

    const result = await assignmentService.manualAssign(caseId, attorneyId, userId);

    res.json({
      success: true,
      message: 'Case assigned successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error manually assigning case:', error);
    const status = error.message.includes('already assigned') ? 409
      : error.message.includes('not active') ? 400
      : error.message.includes('not found') ? 404
      : 500;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Calculate score for specific attorney and case
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const calculateAttorneyScore = async (req, res) => {
  try {
    const { caseId, attorneyId } = req.params;

    if (!caseId || !attorneyId) {
      return res.status(400).json({
        success: false,
        error: 'Case ID and Attorney ID are required'
      });
    }

    // Get case and attorney data
    const { supabase } = require('../config/database');

    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('case_id', caseId)
      .single();

    if (caseError) throw caseError;
    if (!caseData) throw new Error('Case not found');

    const { data: attorney, error: attorneyError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', attorneyId)
      .eq('role', 'attorney')
      .single();

    if (attorneyError) throw attorneyError;
    if (!attorney) throw new Error('Attorney not found');

    // Calculate score
    const scoreData = assignmentService.calculateScore(attorney, caseData);

    res.json({
      success: true,
      data: {
        caseId,
        attorneyId,
        attorneyName: `${attorney.first_name} ${attorney.last_name}`,
        score: scoreData.totalScore,
        breakdown: scoreData.breakdown,
        weights: scoreData.weights
      }
    });
  } catch (error) {
    logger.error('Error calculating attorney score:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getRankedAttorneys,
  autoAssignCase,
  manualAssignCase,
  calculateAttorneyScore
};
