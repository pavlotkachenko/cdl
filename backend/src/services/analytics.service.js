/**
 * Analytics Service - Data aggregation and metrics calculation
 * Location: backend/src/services/analytics.service.js
 */

const { supabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get case analytics with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Case analytics data
 */
const getCaseAnalytics = async (filters = {}) => {
  try {
    const {
      startDate,
      endDate,
      status,
      violationType,
      state,
      attorneyId,
      operatorId
    } = filters;

    // Build query
    let query = supabase
      .from('cases')
      .select('*');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (violationType) {
      query = query.eq('violation_type', violationType);
    }
    if (state) {
      query = query.eq('violation_state', state);
    }
    if (attorneyId) {
      query = query.eq('assigned_attorney_id', attorneyId);
    }
    if (operatorId) {
      query = query.eq('assigned_operator_id', operatorId);
    }

    const { data: cases, error } = await query;

    if (error) throw error;

    // Calculate metrics
    const totalCases = cases.length;
    const statusDistribution = {};
    const violationTypeDistribution = {};
    const stateDistribution = {};
    const outcomeDistribution = {};
    
    let totalResolutionTime = 0;
    let resolvedCases = 0;
    let totalRevenue = 0;

    cases.forEach(case_ => {
      // Status distribution
      statusDistribution[case_.status] = (statusDistribution[case_.status] || 0) + 1;

      // Violation type distribution
      if (case_.violation_type) {
        violationTypeDistribution[case_.violation_type] = 
          (violationTypeDistribution[case_.violation_type] || 0) + 1;
      }

      // State distribution
      if (case_.violation_state) {
        stateDistribution[case_.violation_state] = 
          (stateDistribution[case_.violation_state] || 0) + 1;
      }

      // Outcome distribution
      if (case_.outcome) {
        outcomeDistribution[case_.outcome] = (outcomeDistribution[case_.outcome] || 0) + 1;
      }

      // Resolution time for closed cases
      if (case_.status === 'closed' && case_.closed_at) {
        const created = new Date(case_.created_at);
        const closed = new Date(case_.closed_at);
        const resolutionDays = (closed - created) / (1000 * 60 * 60 * 24);
        totalResolutionTime += resolutionDays;
        resolvedCases++;
      }

      // Revenue
      if (case_.fee_amount) {
        totalRevenue += parseFloat(case_.fee_amount);
      }
    });

    const avgResolutionTime = resolvedCases > 0 ? totalResolutionTime / resolvedCases : 0;

    return {
      summary: {
        totalCases,
        resolvedCases,
        pendingCases: totalCases - resolvedCases,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        totalRevenue: Math.round(totalRevenue * 100) / 100
      },
      distributions: {
        status: statusDistribution,
        violationType: violationTypeDistribution,
        state: stateDistribution,
        outcome: outcomeDistribution
      }
    };
  } catch (error) {
    logger.error('Error getting case analytics:', error);
    throw error;
  }
};

/**
 * Get attorney analytics
 * @param {string} attorneyId - Attorney user ID
 * @param {Object} dateRange - Date range filters
 * @returns {Promise<Object>} Attorney analytics data
 */
const getAttorneyAnalytics = async (attorneyId, dateRange = {}) => {
  try {
    const { startDate, endDate } = dateRange;

    // Get attorney's cases
    let query = supabase
      .from('cases')
      .select('*')
      .eq('assigned_attorney_id', attorneyId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: cases, error } = await query;

    if (error) throw error;

    // Calculate metrics
    const totalCases = cases.length;
    const activeCases = cases.filter(c => 
      !['closed', 'dismissed', 'withdrawn'].includes(c.status)
    ).length;
    const closedCases = cases.filter(c => c.status === 'closed').length;
    
    const wonCases = cases.filter(c => 
      c.outcome && ['dismissed', 'reduced', 'won'].includes(c.outcome.toLowerCase())
    ).length;
    
    const successRate = closedCases > 0 ? (wonCases / closedCases) * 100 : 0;

    let totalRevenue = 0;
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    cases.forEach(case_ => {
      if (case_.fee_amount) {
        totalRevenue += parseFloat(case_.fee_amount);
      }

      if (case_.status === 'closed' && case_.closed_at) {
        const created = new Date(case_.created_at);
        const closed = new Date(case_.closed_at);
        const days = (closed - created) / (1000 * 60 * 60 * 24);
        totalResolutionTime += days;
        resolvedCount++;
      }
    });

    const avgResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

    // Get cases by status for timeline
    const casesByStatus = cases.reduce((acc, case_) => {
      acc[case_.status] = (acc[case_.status] || 0) + 1;
      return acc;
    }, {});

    // Get recent activity
    const recentCases = cases
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 10)
      .map(c => ({
        caseId: c.case_id,
        caseNumber: c.case_number,
        status: c.status,
        violationType: c.violation_type,
        updatedAt: c.updated_at
      }));

    return {
      attorneyId,
      summary: {
        totalCases,
        activeCases,
        closedCases,
        successRate: Math.round(successRate * 10) / 10,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10
      },
      casesByStatus,
      recentActivity: recentCases
    };
  } catch (error) {
    logger.error('Error getting attorney analytics:', error);
    throw error;
  }
};

/**
 * Get operator analytics
 * @param {string} operatorId - Operator user ID
 * @param {Object} dateRange - Date range filters
 * @returns {Promise<Object>} Operator analytics data
 */
const getOperatorAnalytics = async (operatorId, dateRange = {}) => {
  try {
    const { startDate, endDate } = dateRange;

    // Get operator's cases
    let query = supabase
      .from('cases')
      .select('*')
      .eq('assigned_operator_id', operatorId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: cases, error } = await query;

    if (error) throw error;

    const totalCases = cases.length;
    const newCases = cases.filter(c => c.status === 'new').length;
    const inProgressCases = cases.filter(c => 
      ['pending_documents', 'under_review', 'assigned'].includes(c.status)
    ).length;
    const completedCases = cases.filter(c => c.status === 'closed').length;

    let totalProcessingTime = 0;
    let processedCount = 0;

    cases.forEach(case_ => {
      if (case_.status !== 'new' && case_.assigned_at) {
        const created = new Date(case_.created_at);
        const assigned = new Date(case_.assigned_at);
        const hours = (assigned - created) / (1000 * 60 * 60);
        totalProcessingTime += hours;
        processedCount++;
      }
    });

    const avgProcessingTime = processedCount > 0 ? totalProcessingTime / processedCount : 0;

    // Cases by status
    const casesByStatus = cases.reduce((acc, case_) => {
      acc[case_.status] = (acc[case_.status] || 0) + 1;
      return acc;
    }, {});

    // Daily activity
    const dailyActivity = cases.reduce((acc, case_) => {
      const date = new Date(case_.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return {
      operatorId,
      summary: {
        totalCases,
        newCases,
        inProgressCases,
        completedCases,
        avgProcessingTime: Math.round(avgProcessingTime * 10) / 10
      },
      casesByStatus,
      dailyActivity
    };
  } catch (error) {
    logger.error('Error getting operator analytics:', error);
    throw error;
  }
};

/**
 * Get revenue analytics
 * @param {Object} dateRange - Date range filters
 * @returns {Promise<Object>} Revenue analytics data
 */
const getRevenueAnalytics = async (dateRange = {}) => {
  try {
    const { startDate, endDate } = dateRange;

    let query = supabase
      .from('cases')
      .select('fee_amount, fee_status, payment_date, created_at, violation_state');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: cases, error } = await query;

    if (error) throw error;

    let totalRevenue = 0;
    let paidRevenue = 0;
    let pendingRevenue = 0;
    const revenueByState = {};
    const revenueByMonth = {};

    cases.forEach(case_ => {
      const amount = parseFloat(case_.fee_amount) || 0;
      totalRevenue += amount;

      if (case_.fee_status === 'paid') {
        paidRevenue += amount;
      } else if (case_.fee_status === 'pending') {
        pendingRevenue += amount;
      }

      // Revenue by state
      if (case_.violation_state) {
        revenueByState[case_.violation_state] = 
          (revenueByState[case_.violation_state] || 0) + amount;
      }

      // Revenue by month
      const month = new Date(case_.created_at).toISOString().substring(0, 7);
      revenueByMonth[month] = (revenueByMonth[month] || 0) + amount;
    });

    return {
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        paidRevenue: Math.round(paidRevenue * 100) / 100,
        pendingRevenue: Math.round(pendingRevenue * 100) / 100,
        collectionRate: totalRevenue > 0 ? 
          Math.round((paidRevenue / totalRevenue) * 100 * 10) / 10 : 0
      },
      revenueByState,
      revenueByMonth
    };
  } catch (error) {
    logger.error('Error getting revenue analytics:', error);
    throw error;
  }
};

/**
 * Get dashboard metrics for all roles
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Dashboard metrics
 */
const getDashboardMetrics = async (filters = {}) => {
  try {
    const { role, userId, startDate, endDate } = filters;

    let baseQuery = supabase.from('cases').select('*');

    if (startDate) {
      baseQuery = baseQuery.gte('created_at', startDate);
    }
    if (endDate) {
      baseQuery = baseQuery.lte('created_at', endDate);
    }

    // Role-specific filtering
    if (role === 'attorney' && userId) {
      baseQuery = baseQuery.eq('assigned_attorney_id', userId);
    } else if (role === 'operator' && userId) {
      baseQuery = baseQuery.eq('assigned_operator_id', userId);
    } else if (role === 'driver' && userId) {
      baseQuery = baseQuery.eq('driver_id', userId);
    }

    const { data: cases, error } = await baseQuery;

    if (error) throw error;

    const metrics = {
      totalCases: cases.length,
      newCases: cases.filter(c => c.status === 'new').length,
      activeCases: cases.filter(c => 
        !['closed', 'dismissed', 'withdrawn'].includes(c.status)
      ).length,
      closedCases: cases.filter(c => c.status === 'closed').length,
      statusBreakdown: {},
      recentActivity: []
    };

    // Status breakdown
    cases.forEach(case_ => {
      metrics.statusBreakdown[case_.status] = 
        (metrics.statusBreakdown[case_.status] || 0) + 1;
    });

    // Recent activity (last 5 cases)
    metrics.recentActivity = cases
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5)
      .map(c => ({
        caseId: c.case_id,
        caseNumber: c.case_number,
        status: c.status,
        updatedAt: c.updated_at
      }));

    return metrics;
  } catch (error) {
    logger.error('Error getting dashboard metrics:', error);
    throw error;
  }
};

module.exports = {
  getCaseAnalytics,
  getAttorneyAnalytics,
  getOperatorAnalytics,
  getRevenueAnalytics,
  getDashboardMetrics
};
