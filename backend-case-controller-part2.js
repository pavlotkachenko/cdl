// ============================================
// Case Controller - Part 2
// ============================================
// Assignment, status changes, and helper functions

/**
 * ASSIGN TO OPERATOR
 * Manual assignment by admin
 */
exports.assignToOperator = async (req, res) => {
  try {
    const { id } = req.params;
    const { operator_id } = req.body;
    
    // Verify operator exists
    const { data: operator, error: opError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('id', operator_id)
      .eq('role', 'operator')
      .single();
    
    if (opError || !operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }
    
    // Update case
    const { data, error } = await supabase
      .from('cases')
      .update({ 
        assigned_operator_id: operator_id,
        status: 'reviewed'
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Create notification for operator
    await createNotification(
      operator_id,
      id,
      'New Case Assignment',
      `You have been assigned case ${data.case_number}`,
      'assignment'
    );
    
    // Log activity
    await logActivity(
      id,
      req.user.id,
      `Assigned to operator ${operator.full_name}`
    );
    
    res.json({
      message: 'Case assigned to operator successfully',
      case: data
    });
    
  } catch (error) {
    console.error('Assign operator error:', error);
    res.status(500).json({ error: 'Failed to assign operator' });
  }
};

/**
 * ASSIGN TO ATTORNEY
 * Operator assigns case to attorney with price
 */
exports.assignToAttorney = async (req, res) => {
  try {
    const { id } = req.params;
    const { attorney_id, attorney_price } = req.body;
    
    // Verify attorney exists
    const { data: attorney, error: attError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('id', attorney_id)
      .eq('role', 'attorney')
      .single();
    
    if (attError || !attorney) {
      return res.status(404).json({ error: 'Attorney not found' });
    }
    
    // Update case
    const { data, error } = await supabase
      .from('cases')
      .update({
        assigned_attorney_id: attorney_id,
        attorney_price: attorney_price,
        attorney_price_set_at: new Date().toISOString(),
        status: 'assigned_to_attorney'
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Notify attorney
    await createNotification(
      attorney_id,
      id,
      'New Case Assignment',
      `You have been assigned case ${data.case_number}`,
      'assignment'
    );
    
    // Notify driver about attorney assignment
    if (data.driver_id) {
      await createNotification(
        data.driver_id,
        id,
        'Attorney Assigned',
        `An attorney has been assigned to your case ${data.case_number}`,
        'status_change'
      );
    }
    
    // Log activity
    await logActivity(
      id,
      req.user.id,
      `Assigned to attorney ${attorney.full_name} with price $${attorney_price}`
    );
    
    res.json({
      message: 'Case assigned to attorney successfully',
      case: data
    });
    
  } catch (error) {
    console.error('Assign attorney error:', error);
    res.status(500).json({ error: 'Failed to assign attorney' });
  }
};

/**
 * CHANGE CASE STATUS
 * Update the workflow status
 */
exports.changeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    
    // Valid status transitions
    const validStatuses = [
      'new', 'reviewed', 'assigned_to_attorney', 'waiting_for_driver',
      'send_info_to_attorney', 'attorney_paid', 'call_court',
      'check_with_manager', 'pay_attorney', 'closed'
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        valid_statuses: validStatuses
      });
    }
    
    // Get current case
    const { data: currentCase } = await supabase
      .from('cases')
      .select('*')
      .eq('id', id)
      .single();
    
    // Update status
    const updates = { status };
    
    // If closing the case
    if (status === 'closed') {
      updates.closed_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Notify relevant parties
    const statusMessages = {
      'reviewed': 'Your case has been reviewed',
      'assigned_to_attorney': 'An attorney has been assigned',
      'waiting_for_driver': 'We need additional information from you',
      'closed': 'Your case has been closed'
    };
    
    if (statusMessages[status] && data.driver_id) {
      await createNotification(
        data.driver_id,
        id,
        'Case Status Update',
        statusMessages[status],
        'status_change'
      );
    }
    
    // Log activity
    const activityMessage = comment 
      ? `Status changed to ${status}: ${comment}`
      : `Status changed to ${status}`;
    
    await logActivity(id, req.user.id, activityMessage);
    
    res.json({
      message: 'Status updated successfully',
      case: data
    });
    
  } catch (error) {
    console.error('Change status error:', error);
    res.status(500).json({ error: 'Failed to change status' });
  }
};

/**
 * GET CASE ACTIVITY LOG
 * History of all actions on case
 */
exports.getCaseActivity = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('activity_log')
      .select(`
        *,
        user:user_id(full_name, role)
      `)
      .eq('case_id', id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ activities: data });
    
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
};

/**
 * GET STATISTICS
 * Dashboard metrics
 */
exports.getCaseStats = async (req, res) => {
  try {
    let baseQuery = supabase.from('cases');
    
    // Filter by operator if not admin
    if (req.user.role === 'operator') {
      baseQuery = baseQuery.eq('assigned_operator_id', req.user.id);
    }
    
    // Count by status
    const { data: statusCounts } = await baseQuery
      .select('status', { count: 'exact' });
    
    // Group statuses
    const stats = {
      total: 0,
      by_status: {},
      by_state: {},
      by_customer_type: {}
    };
    
    // Process status counts (simplified - you can enhance this)
    const { count: totalCount } = await baseQuery.select('*', { count: 'exact', head: true });
    stats.total = totalCount;
    
    // Additional metrics
    const { data: stateCounts } = await baseQuery.select('state');
    const { data: typeCounts } = await baseQuery.select('customer_type');
    
    // Count occurrences
    stateCounts?.forEach(item => {
      stats.by_state[item.state] = (stats.by_state[item.state] || 0) + 1;
    });
    
    typeCounts?.forEach(item => {
      stats.by_customer_type[item.customer_type] = 
        (stats.by_customer_type[item.customer_type] || 0) + 1;
    });
    
    res.json(stats);
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

/**
 * DELETE CASE
 * Admin only - soft delete
 */
exports.deleteCase = async (req, res) => {
  try {
    const { id } = req.params;
    
    // For now, hard delete. You can implement soft delete later
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({ message: 'Case deleted successfully' });
    
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({ error: 'Failed to delete case' });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * AUTO-ASSIGN CASE TO OPERATOR
 * Based on state and assignment rules
 */
async function autoAssignToOperator(caseId, state) {
  try {
    // Check if auto-assignment is enabled
    if (process.env.ENABLE_AUTO_ASSIGNMENT !== 'true') {
      return;
    }
    
    // Find assignment rule for this state
    const { data: rule, error } = await supabase
      .from('assignment_rules')
      .select('operator_id')
      .eq('state', state)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !rule) {
      console.log(`No assignment rule found for state: ${state}`);
      return;
    }
    
    // Assign to operator
    await supabase
      .from('cases')
      .update({ 
        assigned_operator_id: rule.operator_id,
        status: 'reviewed'
      })
      .eq('id', caseId);
    
    // Notify operator
    await createNotification(
      rule.operator_id,
      caseId,
      'New Case Auto-Assigned',
      `A new case in ${state} has been automatically assigned to you`,
      'assignment'
    );
    
    console.log(`Case ${caseId} auto-assigned to operator ${rule.operator_id}`);
    
  } catch (error) {
    console.error('Auto-assignment error:', error);
  }
}

/**
 * LOG ACTIVITY
 * Record action in activity log
 */
async function logActivity(caseId, userId, action, details = null) {
  try {
    await supabase
      .from('activity_log')
      .insert([{
        case_id: caseId,
        user_id: userId,
        action,
        details
      }]);
  } catch (error) {
    console.error('Log activity error:', error);
  }
}

/**
 * CREATE NOTIFICATION
 * Send notification to user
 */
async function createNotification(userId, caseId, title, message, type) {
  try {
    await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        case_id: caseId,
        title,
        message,
        type
      }]);
  } catch (error) {
    console.error('Create notification error:', error);
  }
}

module.exports = exports;
