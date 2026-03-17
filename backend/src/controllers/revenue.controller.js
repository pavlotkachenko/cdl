// ============================================
// REVENUE CONTROLLER
// Handle HTTP requests for revenue analytics
// ============================================

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Helper: query payments table; if it fails (table may not exist), return null.
 */
async function queryPayments(builder) {
  try {
    const result = await builder;
    if (result.error) throw result.error;
    return result.data;
  } catch {
    return null;
  }
}

/**
 * Helper: apply optional date range filters to a query builder.
 */
function applyDateRange(query, startDate, endDate, column = 'created_at') {
  if (startDate) query = query.gte(column, startDate);
  if (endDate) query = query.lte(column, endDate);
  return query;
}

/**
 * GET /api/revenue/metrics
 * Aggregate revenue metrics for a date range.
 */
const getRevenueMetrics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // --- Try payments table first ---
    let baseQuery = supabase.from('payments').select('amount, status, payment_method, created_at');
    baseQuery = applyDateRange(baseQuery, start_date, end_date);
    const payments = await queryPayments(baseQuery);

    if (payments) {
      const succeeded = payments.filter(p => p.status === 'succeeded');
      const refunded = payments.filter(p => p.status === 'refunded');
      const failed = payments.filter(p => p.status === 'failed');

      const totalRevenue = succeeded.reduce((sum, p) => sum + (p.amount || 0), 0);
      const refundedAmount = refunded.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalTransactions = payments.length;
      const failedTransactions = failed.length;
      const successRate = totalTransactions > 0
        ? Math.round((succeeded.length / totalTransactions) * 10000) / 100
        : 0;
      const averageTransaction = succeeded.length > 0
        ? Math.round(totalRevenue / succeeded.length)
        : 0;

      // MRR approximation: revenue from the current calendar month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const monthSucceeded = succeeded.filter(p => p.created_at >= monthStart);
      const monthlyRecurringRevenue = monthSucceeded.reduce((sum, p) => sum + (p.amount || 0), 0);

      return res.json({
        total_revenue: totalRevenue,
        refunded_amount: refundedAmount,
        total_transactions: totalTransactions,
        failed_transactions: failedTransactions,
        success_rate: successRate,
        monthly_recurring_revenue: monthlyRecurringRevenue,
        average_transaction: averageTransaction,
      });
    }

    // --- Fallback: cases table ---
    let casesQuery = supabase.from('cases').select('fee_amount, fee_status, created_at');
    casesQuery = applyDateRange(casesQuery, start_date, end_date);
    const { data: cases, error: casesErr } = await casesQuery;
    if (casesErr) throw casesErr;

    const paidCases = (cases || []).filter(c => c.fee_status === 'paid');
    const totalRevenue = paidCases.reduce((sum, c) => sum + (c.fee_amount || 0), 0);
    const totalTransactions = (cases || []).length;
    const averageTransaction = paidCases.length > 0
      ? Math.round(totalRevenue / paidCases.length)
      : 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const monthPaid = paidCases.filter(c => c.created_at >= monthStart);
    const monthlyRecurringRevenue = monthPaid.reduce((sum, c) => sum + (c.fee_amount || 0), 0);

    return res.json({
      total_revenue: totalRevenue,
      refunded_amount: 0,
      total_transactions: totalTransactions,
      failed_transactions: 0,
      success_rate: totalTransactions > 0 ? 100 : 0,
      monthly_recurring_revenue: monthlyRecurringRevenue,
      average_transaction: averageTransaction,
    });
  } catch (error) {
    logger.error('getRevenueMetrics error:', error);
    res.status(500).json({
      error: { code: 'REVENUE_METRICS_ERROR', message: 'Failed to retrieve revenue metrics' },
    });
  }
};

/**
 * GET /api/revenue/daily
 * Daily revenue breakdown for a date range.
 */
const getDailyRevenue = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // --- Try payments table ---
    let baseQuery = supabase.from('payments').select('amount, status, created_at');
    baseQuery = applyDateRange(baseQuery, start_date, end_date);
    const payments = await queryPayments(baseQuery);

    if (payments) {
      const succeeded = payments.filter(p => p.status === 'succeeded');
      const grouped = {};
      for (const p of succeeded) {
        const date = p.created_at ? p.created_at.slice(0, 10) : 'unknown';
        if (!grouped[date]) grouped[date] = { revenue: 0, transactions: 0 };
        grouped[date].revenue += p.amount || 0;
        grouped[date].transactions += 1;
      }
      const result = Object.entries(grouped)
        .map(([date, data]) => ({ date, revenue: data.revenue, transactions: data.transactions }))
        .sort((a, b) => a.date.localeCompare(b.date));
      return res.json(result);
    }

    // --- Fallback: cases table ---
    let casesQuery = supabase.from('cases').select('fee_amount, fee_status, created_at');
    casesQuery = applyDateRange(casesQuery, start_date, end_date);
    const { data: cases, error: casesErr } = await casesQuery;
    if (casesErr) throw casesErr;

    const paidCases = (cases || []).filter(c => c.fee_status === 'paid');
    const grouped = {};
    for (const c of paidCases) {
      const date = c.created_at ? c.created_at.slice(0, 10) : 'unknown';
      if (!grouped[date]) grouped[date] = { revenue: 0, transactions: 0 };
      grouped[date].revenue += c.fee_amount || 0;
      grouped[date].transactions += 1;
    }
    const result = Object.entries(grouped)
      .map(([date, data]) => ({ date, revenue: data.revenue, transactions: data.transactions }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return res.json(result);
  } catch (error) {
    logger.error('getDailyRevenue error:', error);
    res.status(500).json({
      error: { code: 'DAILY_REVENUE_ERROR', message: 'Failed to retrieve daily revenue' },
    });
  }
};

/**
 * GET /api/revenue/by-method
 * Revenue grouped by payment method.
 */
const getRevenueByMethod = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // --- Try payments table ---
    let baseQuery = supabase.from('payments').select('amount, status, payment_method, created_at');
    baseQuery = applyDateRange(baseQuery, start_date, end_date);
    const payments = await queryPayments(baseQuery);

    if (payments) {
      const succeeded = payments.filter(p => p.status === 'succeeded');
      const grouped = {};
      let totalRevenue = 0;
      for (const p of succeeded) {
        const method = p.payment_method || 'unknown';
        if (!grouped[method]) grouped[method] = 0;
        grouped[method] += p.amount || 0;
        totalRevenue += p.amount || 0;
      }
      const result = Object.entries(grouped).map(([method, revenue]) => ({
        method,
        revenue,
        percentage: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 10000) / 100 : 0,
      }));
      return res.json(result);
    }

    // --- Fallback: cases don't have payment_method, return single bucket ---
    let casesQuery = supabase.from('cases').select('fee_amount, fee_status, created_at');
    casesQuery = applyDateRange(casesQuery, start_date, end_date);
    const { data: cases, error: casesErr } = await casesQuery;
    if (casesErr) throw casesErr;

    const paidCases = (cases || []).filter(c => c.fee_status === 'paid');
    const totalRevenue = paidCases.reduce((sum, c) => sum + (c.fee_amount || 0), 0);
    return res.json([
      { method: 'case_fee', revenue: totalRevenue, percentage: 100 },
    ]);
  } catch (error) {
    logger.error('getRevenueByMethod error:', error);
    res.status(500).json({
      error: { code: 'REVENUE_BY_METHOD_ERROR', message: 'Failed to retrieve revenue by method' },
    });
  }
};

/**
 * GET /api/revenue/by-attorney
 * Revenue grouped by attorney.
 */
const getRevenueByAttorney = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // --- Try payments table joined with cases ---
    let paymentsQuery = supabase
      .from('payments')
      .select('amount, status, case_id, created_at');
    paymentsQuery = applyDateRange(paymentsQuery, start_date, end_date);
    const payments = await queryPayments(paymentsQuery);

    if (payments) {
      const succeeded = payments.filter(p => p.status === 'succeeded');
      const caseIds = [...new Set(succeeded.map(p => p.case_id).filter(Boolean))];

      // Fetch cases with attorney info
      let casesMap = {};
      if (caseIds.length > 0) {
        const { data: cases } = await supabase
          .from('cases')
          .select('id, assigned_attorney_id')
          .in('id', caseIds);
        for (const c of (cases || [])) {
          casesMap[c.id] = c.assigned_attorney_id;
        }
      }

      // Gather unique attorney IDs
      const attorneyIds = [...new Set(Object.values(casesMap).filter(Boolean))];
      let attorneyMap = {};
      if (attorneyIds.length > 0) {
        const { data: attorneys } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', attorneyIds);
        for (const a of (attorneys || [])) {
          attorneyMap[a.id] = a.full_name || 'Unknown';
        }
      }

      // Aggregate by attorney
      const grouped = {};
      for (const p of succeeded) {
        const attorneyId = casesMap[p.case_id] || 'unassigned';
        if (!grouped[attorneyId]) grouped[attorneyId] = { revenue: 0, transactions: 0 };
        grouped[attorneyId].revenue += p.amount || 0;
        grouped[attorneyId].transactions += 1;
      }

      const result = Object.entries(grouped).map(([attorney_id, data]) => ({
        attorney_id,
        attorney_name: attorneyMap[attorney_id] || 'Unassigned',
        revenue: data.revenue,
        transactions: data.transactions,
      }));
      return res.json(result);
    }

    // --- Fallback: cases table with fee data ---
    let casesQuery = supabase
      .from('cases')
      .select('assigned_attorney_id, fee_amount, fee_status, created_at');
    casesQuery = applyDateRange(casesQuery, start_date, end_date);
    const { data: cases, error: casesErr } = await casesQuery;
    if (casesErr) throw casesErr;

    const paidCases = (cases || []).filter(c => c.fee_status === 'paid');

    // Gather attorney names
    const attorneyIds = [...new Set(paidCases.map(c => c.assigned_attorney_id).filter(Boolean))];
    let attorneyMap = {};
    if (attorneyIds.length > 0) {
      const { data: attorneys } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', attorneyIds);
      for (const a of (attorneys || [])) {
        attorneyMap[a.id] = a.full_name || 'Unknown';
      }
    }

    const grouped = {};
    for (const c of paidCases) {
      const attorneyId = c.assigned_attorney_id || 'unassigned';
      if (!grouped[attorneyId]) grouped[attorneyId] = { revenue: 0, transactions: 0 };
      grouped[attorneyId].revenue += c.fee_amount || 0;
      grouped[attorneyId].transactions += 1;
    }

    const result = Object.entries(grouped).map(([attorney_id, data]) => ({
      attorney_id,
      attorney_name: attorneyMap[attorney_id] || 'Unassigned',
      revenue: data.revenue,
      transactions: data.transactions,
    }));
    return res.json(result);
  } catch (error) {
    logger.error('getRevenueByAttorney error:', error);
    res.status(500).json({
      error: { code: 'REVENUE_BY_ATTORNEY_ERROR', message: 'Failed to retrieve revenue by attorney' },
    });
  }
};

/**
 * GET /api/revenue/transactions
 * Last 20 transactions.
 */
const getRecentTransactions = async (req, res) => {
  try {
    // --- Try payments table ---
    const paymentsResult = await queryPayments(
      supabase
        .from('payments')
        .select('id, user_id, amount, status, payment_method, created_at')
        .order('created_at', { ascending: false })
        .limit(20)
    );

    if (paymentsResult) {
      // Look up user names for client column
      const userIds = [...new Set(paymentsResult.map(p => p.user_id).filter(Boolean))];
      let userMap = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', userIds);
        for (const u of (users || [])) {
          userMap[u.id] = u.full_name || 'Unknown';
        }
      }

      const result = paymentsResult.map(p => ({
        date: p.created_at,
        client: userMap[p.user_id] || 'Unknown',
        amount: p.amount || 0,
        status: p.status,
        method: p.payment_method || 'unknown',
      }));
      return res.json(result);
    }

    // --- Fallback: cases table ---
    const { data: cases, error: casesErr } = await supabase
      .from('cases')
      .select('id, customer_name, fee_amount, fee_status, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (casesErr) throw casesErr;

    const result = (cases || []).map(c => ({
      date: c.created_at,
      client: c.customer_name || 'Unknown',
      amount: c.fee_amount || 0,
      status: c.fee_status || 'pending',
      method: 'case_fee',
    }));
    return res.json(result);
  } catch (error) {
    logger.error('getRecentTransactions error:', error);
    res.status(500).json({
      error: { code: 'RECENT_TRANSACTIONS_ERROR', message: 'Failed to retrieve recent transactions' },
    });
  }
};

/**
 * GET /api/revenue/growth/monthly
 * Monthly growth metrics comparing current month vs previous month.
 */
const getMonthlyGrowth = async (req, res) => {
  try {
    const now = new Date();
    const curMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

    // --- Try payments table ---
    const curPayments = await queryPayments(
      supabase
        .from('payments')
        .select('amount, status, created_at')
        .gte('created_at', curMonthStart)
        .eq('status', 'succeeded')
    );
    const prevPayments = await queryPayments(
      supabase
        .from('payments')
        .select('amount, status, created_at')
        .gte('created_at', prevMonthStart)
        .lte('created_at', prevMonthEnd)
        .eq('status', 'succeeded')
    );

    if (curPayments !== null && prevPayments !== null) {
      const curRevenue = curPayments.reduce((s, p) => s + (p.amount || 0), 0);
      const prevRevenue = prevPayments.reduce((s, p) => s + (p.amount || 0), 0);
      const growthRate = prevRevenue > 0
        ? Math.round(((curRevenue - prevRevenue) / prevRevenue) * 10000) / 100
        : curRevenue > 0 ? 100 : 0;

      return res.json({
        current_month_revenue: curRevenue,
        previous_month_revenue: prevRevenue,
        growth_rate: growthRate,
        current_month_transactions: curPayments.length,
        previous_month_transactions: prevPayments.length,
      });
    }

    // --- Fallback: cases table ---
    const { data: curCases } = await supabase
      .from('cases')
      .select('fee_amount, fee_status, created_at')
      .gte('created_at', curMonthStart)
      .eq('fee_status', 'paid');

    const { data: prevCases } = await supabase
      .from('cases')
      .select('fee_amount, fee_status, created_at')
      .gte('created_at', prevMonthStart)
      .lte('created_at', prevMonthEnd)
      .eq('fee_status', 'paid');

    const curRevenue = (curCases || []).reduce((s, c) => s + (c.fee_amount || 0), 0);
    const prevRevenue = (prevCases || []).reduce((s, c) => s + (c.fee_amount || 0), 0);
    const growthRate = prevRevenue > 0
      ? Math.round(((curRevenue - prevRevenue) / prevRevenue) * 10000) / 100
      : curRevenue > 0 ? 100 : 0;

    return res.json({
      current_month_revenue: curRevenue,
      previous_month_revenue: prevRevenue,
      growth_rate: growthRate,
      current_month_transactions: (curCases || []).length,
      previous_month_transactions: (prevCases || []).length,
    });
  } catch (error) {
    logger.error('getMonthlyGrowth error:', error);
    res.status(500).json({
      error: { code: 'MONTHLY_GROWTH_ERROR', message: 'Failed to retrieve monthly growth data' },
    });
  }
};

/**
 * GET /api/revenue/export
 * Export revenue data as CSV.
 */
const exportToCsv = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let rows = [];

    // --- Try payments table ---
    let paymentsQuery = supabase
      .from('payments')
      .select('id, user_id, case_id, amount, status, payment_method, created_at')
      .order('created_at', { ascending: false });
    paymentsQuery = applyDateRange(paymentsQuery, start_date, end_date);
    const payments = await queryPayments(paymentsQuery);

    if (payments && payments.length > 0) {
      // Resolve user names
      const userIds = [...new Set(payments.map(p => p.user_id).filter(Boolean))];
      let userMap = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', userIds);
        for (const u of (users || [])) {
          userMap[u.id] = u.full_name || '';
        }
      }

      rows = payments.map(p => ({
        date: p.created_at ? p.created_at.slice(0, 10) : '',
        transaction_id: p.id,
        client: userMap[p.user_id] || '',
        case_id: p.case_id || '',
        amount_cents: p.amount || 0,
        status: p.status || '',
        payment_method: p.payment_method || '',
      }));
    } else {
      // Fallback: cases table
      let casesQuery = supabase
        .from('cases')
        .select('id, customer_name, fee_amount, fee_status, created_at')
        .order('created_at', { ascending: false });
      casesQuery = applyDateRange(casesQuery, start_date, end_date);
      const { data: cases, error: casesErr } = await casesQuery;
      if (casesErr) throw casesErr;

      rows = (cases || []).map(c => ({
        date: c.created_at ? c.created_at.slice(0, 10) : '',
        transaction_id: c.id,
        client: c.customer_name || '',
        case_id: c.id,
        amount_cents: c.fee_amount || 0,
        status: c.fee_status || 'pending',
        payment_method: 'case_fee',
      }));
    }

    // Build CSV
    const headers = ['date', 'transaction_id', 'client', 'case_id', 'amount_cents', 'status', 'payment_method'];
    const csvLines = [headers.join(',')];
    for (const row of rows) {
      const line = headers.map(h => {
        const val = String(row[h] ?? '');
        // Escape values containing commas or quotes
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvLines.push(line.join(','));
    }

    const csv = csvLines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="revenue-export.csv"');
    return res.send(csv);
  } catch (error) {
    logger.error('exportToCsv error:', error);
    res.status(500).json({
      error: { code: 'EXPORT_CSV_ERROR', message: 'Failed to export revenue data' },
    });
  }
};

module.exports = {
  getRevenueMetrics,
  getDailyRevenue,
  getRevenueByMethod,
  getRevenueByAttorney,
  getRecentTransactions,
  getMonthlyGrowth,
  exportToCsv,
};
