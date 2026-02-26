/**
 * Analytics Controller - Analytics and reporting endpoints
 * Location: backend/src/controllers/analytics.controller.js
 */

const analyticsService = require('../services/analytics.service');
const logger = require('../utils/logger');

/**
 * Get case analytics
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getCaseAnalytics = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status,
      violationType: req.query.violationType,
      state: req.query.state,
      attorneyId: req.query.attorneyId,
      operatorId: req.query.operatorId
    };

    const analytics = await analyticsService.getCaseAnalytics(filters);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting case analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get attorney analytics
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getAttorneyAnalytics = async (req, res) => {
  try {
    const { attorneyId } = req.params;
    const dateRange = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    if (!attorneyId) {
      return res.status(400).json({
        success: false,
        error: 'Attorney ID is required'
      });
    }

    const analytics = await analyticsService.getAttorneyAnalytics(attorneyId, dateRange);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting attorney analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get operator analytics
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getOperatorAnalytics = async (req, res) => {
  try {
    const { operatorId } = req.params;
    const dateRange = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    if (!operatorId) {
      return res.status(400).json({
        success: false,
        error: 'Operator ID is required'
      });
    }

    const analytics = await analyticsService.getOperatorAnalytics(operatorId, dateRange);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting operator analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get revenue analytics
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getRevenueAnalytics = async (req, res) => {
  try {
    const dateRange = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const analytics = await analyticsService.getRevenueAnalytics(dateRange);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get dashboard metrics
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getDashboardMetrics = async (req, res) => {
  try {
    const filters = {
      role: req.query.role || req.user?.role,
      userId: req.query.userId || req.user?.userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const metrics = await analyticsService.getDashboardMetrics(filters);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getCaseAnalytics,
  getAttorneyAnalytics,
  getOperatorAnalytics,
  getRevenueAnalytics,
  getDashboardMetrics
};
