/**
 * Dashboard Controller - Role-specific dashboard data endpoints
 * Location: backend/src/controllers/dashboard.controller.js
 */

const analyticsService = require('../services/analytics.service');
const workflowService = require('../services/workflow.service');
const { supabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get operator dashboard data
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getOperatorDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    // Get operator analytics
    const analytics = await analyticsService.getOperatorAnalytics(userId, {
      startDate,
      endDate
    });

    // Get new cases queue
    const { data: newCases, error: newCasesError } = await supabase
      .from('cases')
      .select('*')
      .eq('assigned_operator_id', userId)
      .eq('status', 'new')
      .order('created_at', { ascending: true })
      .limit(20);

    if (newCasesError) throw newCasesError;

    // Get SLA breaches
    const slaStatus = await workflowService.checkSLABreaches();

    // Get workload distribution
    const { data: workloadData, error: workloadError } = await supabase
      .from('cases')
      .select('status')
      .eq('assigned_operator_id', userId)
      .not('status', 'in', '(closed,withdrawn,dismissed)');

    if (workloadError) throw workloadError;

    const workloadDistribution = workloadData.reduce((acc, case_) => {
      acc[case_.status] = (acc[case_.status] || 0) + 1;
      return acc;
    }, {});

    // Get recent activity
    const { data: recentActivity, error: activityError } = await supabase
      .from('case_status_history')
      .select(`
        *,
        case:cases(case_number, status),
        changed_by_user:users(first_name, last_name)
      `)
      .order('changed_at', { ascending: false })
      .limit(10);

    if (activityError) throw activityError;

    res.json({
      success: true,
      data: {
        analytics,
        newCasesQueue: newCases,
        slaBreaches: slaStatus.breachedCases,
        atRiskCases: slaStatus.atRiskCases,
        workloadDistribution,
        recentActivity
      }
    });
  } catch (error) {
    logger.error('Error getting operator dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get attorney dashboard data
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getAttorneyDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    // Get attorney analytics
    const analytics = await analyticsService.getAttorneyAnalytics(userId, {
      startDate,
      endDate
    });

    // Get active cases
    const { data: activeCases, error: activeCasesError } = await supabase
      .from('cases')
      .select(`
        *,
        driver:users!cases_driver_id_fkey(first_name, last_name, email, phone)
      `)
      .eq('assigned_attorney_id', userId)
      .not('status', 'in', '(closed,withdrawn,dismissed)')
      .order('updated_at', { ascending: false });

    if (activeCasesError) throw activeCasesError;

    // Get upcoming deadlines
    const { data: upcomingDeadlines, error: deadlinesError } = await supabase
      .from('cases')
      .select('case_id, case_number, court_date, status')
      .eq('assigned_attorney_id', userId)
      .not('court_date', 'is', null)
      .gte('court_date', new Date().toISOString())
      .order('court_date', { ascending: true })
      .limit(10);

    if (deadlinesError) throw deadlinesError;

    // Get performance metrics
    const { data: casesForMetrics, error: metricsError } = await supabase
      .from('cases')
      .select('outcome, status, created_at, closed_at')
      .eq('assigned_attorney_id', userId);

    if (metricsError) throw metricsError;

    const performanceMetrics = {
      totalCases: casesForMetrics.length,
      closedCases: casesForMetrics.filter(c => c.status === 'closed').length,
      wonCases: casesForMetrics.filter(c => 
        c.outcome && ['dismissed', 'reduced', 'won'].includes(c.outcome.toLowerCase())
      ).length,
      activeCases: casesForMetrics.filter(c => 
        !['closed', 'withdrawn', 'dismissed'].includes(c.status)
      ).length
    };

    performanceMetrics.successRate = performanceMetrics.closedCases > 0
      ? Math.round((performanceMetrics.wonCases / performanceMetrics.closedCases) * 100)
      : 0;

    // Get revenue
    const { data: revenueData, error: revenueError } = await supabase
      .from('cases')
      .select('fee_amount, fee_status')
      .eq('assigned_attorney_id', userId);

    if (revenueError) throw revenueError;

    const revenue = {
      total: revenueData.reduce((sum, c) => sum + (parseFloat(c.fee_amount) || 0), 0),
      paid: revenueData
        .filter(c => c.fee_status === 'paid')
        .reduce((sum, c) => sum + (parseFloat(c.fee_amount) || 0), 0)
    };

    res.json({
      success: true,
      data: {
        analytics,
        activeCases,
        upcomingDeadlines,
        performanceMetrics,
        revenue
      }
    });
  } catch (error) {
    logger.error('Error getting attorney dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get driver dashboard data
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getDriverDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get driver's cases
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select(`
        *,
        attorney:users!cases_assigned_attorney_id_fkey(first_name, last_name, email, phone),
        operator:users!cases_assigned_operator_id_fkey(first_name, last_name, email)
      `)
      .eq('driver_id', userId)
      .order('created_at', { ascending: false });

    if (casesError) throw casesError;

    // Get case status timeline for active case
    const activeCase = cases.find(c => !['closed', 'withdrawn', 'dismissed'].includes(c.status));
    
    let statusTimeline = [];
    if (activeCase) {
      const { data: timeline, error: timelineError } = await supabase
        .from('case_status_history')
        .select('*')
        .eq('case_id', activeCase.case_id)
        .order('changed_at', { ascending: true });

      if (!timelineError) {
        statusTimeline = timeline;
      }
    }

    // Get document checklist
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .in('case_id', cases.map(c => c.case_id))
      .order('uploaded_at', { ascending: false });

    if (docsError) throw docsError;

    // Get upcoming court dates
    const upcomingCourtDates = cases
      .filter(c => c.court_date && new Date(c.court_date) >= new Date())
      .map(c => ({
        caseId: c.case_id,
        caseNumber: c.case_number,
        courtDate: c.court_date,
        violationType: c.violation_type
      }))
      .sort((a, b) => new Date(a.courtDate) - new Date(b.courtDate));

    // Get recent messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(first_name, last_name, role)
      `)
      .in('case_id', cases.map(c => c.case_id))
      .order('created_at', { ascending: false })
      .limit(10);

    if (messagesError) throw messagesError;

    // Summary stats
    const summary = {
      totalCases: cases.length,
      activeCases: cases.filter(c => !['closed', 'withdrawn', 'dismissed'].includes(c.status)).length,
      closedCases: cases.filter(c => c.status === 'closed').length,
      pendingDocuments: documents.filter(d => d.status === 'pending').length,
      unreadMessages: messages.filter(m => !m.is_read && m.sender_id !== userId).length
    };

    res.json({
      success: true,
      data: {
        summary,
        cases,
        activeCase,
        statusTimeline,
        documents,
        upcomingCourtDates,
        recentMessages: messages
      }
    });
  } catch (error) {
    logger.error('Error getting driver dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get dashboard metrics summary
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getDashboardMetrics = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { startDate, endDate } = req.query;

    const metrics = await analyticsService.getDashboardMetrics({
      role,
      userId,
      startDate,
      endDate
    });

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
  getOperatorDashboard,
  getAttorneyDashboard,
  getDriverDashboard,
  getDashboardMetrics
};
