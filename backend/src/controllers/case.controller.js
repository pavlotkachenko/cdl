// ============================================
// Case Controller
// ============================================
// This is the brain of case management
// It handles all the business logic

const { supabase, supabaseAdmin, executeQuery } = require('../config/supabase');
const { validationResult } = require('express-validator');
const emailService = require('../services/email.service');
const smsService = require('../services/sms.service');
const oneSignalService = require('../services/onesignal.service');

/**
 * PUBLIC SUBMIT
 * Landing page submission - no authentication required
 */
exports.publicSubmit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer_name, email, driver_phone, violation_details } = req.body;

    // Use the default supabase client (service role if available)
    const db = supabaseAdmin || supabase;

    const { data: newCase, error } = await db
      .from('cases')
      .insert([{
        customer_name,
        driver_phone,
        customer_type: 'one_time_driver',
        violation_details: `${violation_details}\n\nContact email: ${email}`,
        who_sent: 'website',
        status: 'new'
      }])
      .select()
      .single();

    if (error) throw error;

    // Non-blocking confirmation email
    emailService.sendCaseSubmissionEmail({
      name: customer_name,
      email,
      caseId: newCase.id,
      caseNumber: newCase.case_number,
    }).catch(err => console.error('[publicSubmit] Email failed:', err));

    res.status(201).json({
      message: 'Request submitted successfully',
      case: { id: newCase.id }
    });
  } catch (error) {
    console.error('Public submit error:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
};

/**
 * CREATE NEW CASE
 * When a driver submits a ticket
 */
exports.createCase = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      customer_name,
      driver_phone,
      customer_type,
      state,
      town,
      county,
      violation_date,
      violation_type,
      violation_details,
      carrier
    } = req.body;
    
    const driver_id = req.user.id;
    const who_sent = req.user.role === 'driver' ? 'driver' : 'carrier';
    
    // Create the case
    const { data: newCase, error } = await supabase
      .from('cases')
      .insert([{
        driver_id,
        customer_name,
        driver_phone,
        customer_type,
        state,
        town,
        county,
        violation_date,
        violation_type,
        violation_details,
        carrier,
        who_sent,
        status: 'new'
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // AUTO-ASSIGN to operator based on state (AI assignment)
    await autoAssignToOperator(newCase.id, state);

    // Log activity
    await logActivity(newCase.id, driver_id, 'Case created');

    // Non-blocking confirmation email — fetch driver profile separately
    supabase.from('users').select('full_name, email').eq('id', driver_id).single()
      .then(({ data: driver }) => {
        if (driver) {
          emailService.sendCaseSubmissionEmail({
            name: driver.full_name || customer_name,
            email: driver.email,
            caseId: newCase.id,
            caseNumber: newCase.case_number,
          }).catch(err => console.error('[createCase] Email failed:', err));
        }
      })
      .catch(() => {});

    // Non-blocking SMS confirmation
    if (driver_phone) {
      smsService.sendCaseSubmissionSms({
        phone: driver_phone,
        caseNumber: newCase.case_number || newCase.id,
      }).catch(err => console.error('[createCase] SMS failed:', err));
    }

    // Non-blocking push notification to driver
    oneSignalService.notifyUser(
      driver_id,
      'Case Submitted',
      `Your ticket case ${newCase.case_number || newCase.id} has been received.`,
      { caseId: newCase.id },
    ).catch(err => console.error('[createCase] Push failed:', err));

    res.status(201).json({
      message: 'Case submitted successfully',
      case: newCase
    });
    
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
};

/**
 * GET CASES WITH FILTERS
 * List all cases (with role-based filtering)
 */
exports.getCases = async (req, res) => {
  try {
    const {
      status,
      state,
      customer_type,
      search,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;
    
    let query = supabase
      .from('cases')
      .select(`
        *,
        driver:driver_id(full_name, email),
        operator:assigned_operator_id(full_name, email),
        attorney:assigned_attorney_id(full_name, email)
      `, { count: 'exact' });
    
    // Role-based filtering
    if (req.user.role === 'driver') {
      query = query.eq('driver_id', req.user.id);
    } else if (req.user.role === 'operator') {
      query = query.eq('assigned_operator_id', req.user.id);
    } else if (req.user.role === 'attorney') {
      query = query.eq('assigned_attorney_id', req.user.id);
    }
    // Admins see everything
    
    // Apply filters
    if (status) query = query.eq('status', status);
    if (state) query = query.eq('state', state);
    if (customer_type) query = query.eq('customer_type', customer_type);
    
    // Search across multiple fields
    if (search) {
      query = query.or(`
        customer_name.ilike.%${search}%,
        case_number.ilike.%${search}%,
        driver_phone.ilike.%${search}%
      `);
    }
    
    // Sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });
    
    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      cases: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
};

/**
 * GET MY CASES
 * Get cases for current user based on role
 */
exports.getMyCases = async (req, res) => {
  try {
    let query = supabase
      .from('cases')
      .select(`
        *,
        driver:driver_id(full_name, email),
        operator:assigned_operator_id(full_name, email),
        attorney:assigned_attorney_id(full_name, email),
        files:case_files(id, file_name, file_type, uploaded_at)
      `)
      .order('created_at', { ascending: false });
    
    // Filter based on role
    switch (req.user.role) {
      case 'driver':
        query = query.eq('driver_id', req.user.id);
        break;
      case 'operator':
        query = query.eq('assigned_operator_id', req.user.id);
        break;
      case 'attorney':
        query = query.eq('assigned_attorney_id', req.user.id);
        break;
      case 'admin':
        // Admins see everything - no filter
        break;
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json({ cases: data });
    
  } catch (error) {
    console.error('Get my cases error:', error);
    res.status(500).json({ error: 'Failed to fetch your cases' });
  }
};

/**
 * GET NEW CASES POOL
 * Cases waiting for operator review
 */
exports.getNewCases = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        driver:driver_id(full_name, email, phone)
      `)
      .eq('status', 'new')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    res.json({ 
      cases: data,
      count: data.length
    });
    
  } catch (error) {
    console.error('Get new cases error:', error);
    res.status(500).json({ error: 'Failed to fetch new cases' });
  }
};

/**
 * GET CASE BY ID
 * Full details of a single case
 */
exports.getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        driver:driver_id(id, full_name, email, phone),
        operator:assigned_operator_id(id, full_name, email),
        attorney:assigned_attorney_id(id, full_name, email, phone),
        files:case_files(id, file_name, file_url, file_type, uploaded_at),
        subscription:driver_id(subscriptions(*))
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Mask driver phone for attorneys (last 4 digits only)
    if (req.user.role === 'attorney' && data.driver?.phone) {
      data.driver = { ...data.driver, phone: '***-***-' + String(data.driver.phone).slice(-4) };
    }

    res.json({ case: data });
    
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
};

/**
 * UPDATE CASE
 * Modify case details
 */
exports.updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow changing certain fields
    delete updates.id;
    delete updates.case_number;
    delete updates.driver_id;
    delete updates.created_at;
    
    const { data, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Log activity
    await logActivity(
      id, 
      req.user.id, 
      'Case updated', 
      { fields_updated: Object.keys(updates) }
    );
    
    res.json({
      message: 'Case updated successfully',
      case: data
    });
    
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({ error: 'Failed to update case' });
  }
};

// Continued in part 2...
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
      .select('id, full_name, email, role')
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

    // Non-blocking email to attorney
    if (attorney.email) {
      emailService.sendAttorneyAssignmentEmail({
        name: attorney.full_name,
        email: attorney.email,
        caseId: id,
        caseNumber: data.case_number,
        driverName: data.customer_name,
      }).catch(err => console.error('[assignToAttorney] Email failed:', err));
    }

    // Non-blocking SMS to driver
    if (data.driver_phone) {
      smsService.sendAttorneyAssignedSms({
        phone: data.driver_phone,
        attorneyName: attorney.full_name,
        caseNumber: data.case_number || id,
      }).catch(err => console.error('[assignToAttorney] SMS failed:', err));
    }

    // Non-blocking push: notify attorney + driver
    oneSignalService.notifyUser(
      attorney_id,
      'New Case Assigned',
      `Case ${data.case_number} has been assigned to you.`,
      { caseId: id },
    ).catch(err => console.error('[assignToAttorney] Push (attorney) failed:', err));

    if (data.driver_id) {
      oneSignalService.notifyUser(
        data.driver_id,
        'Attorney Matched',
        `An attorney has been matched to your case ${data.case_number}.`,
        { caseId: id },
      ).catch(err => console.error('[assignToAttorney] Push (driver) failed:', err));
    }

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
    
    // Non-blocking SMS to driver on status change
    if (data.driver_phone) {
      smsService.sendStatusChangeSms({
        phone: data.driver_phone,
        newStatus: status,
        caseNumber: data.case_number || id,
      }).catch(err => console.error('[changeStatus] SMS failed:', err));
    }

    // Non-blocking push notification to driver on status change
    if (data.driver_id) {
      oneSignalService.notifyUser(
        data.driver_id,
        'Case Status Updated',
        `Your case ${data.case_number} status changed to: ${status.replace(/_/g, ' ')}.`,
        { caseId: id, status },
      ).catch(err => console.error('[changeStatus] Push failed:', err));
    }

    // Log activity
    const activityMessage = comment
      ? `Status changed to ${status}: ${comment}`
      : `Status changed to ${status}`;

    await logActivity(id, req.user.id, activityMessage);

    // Emit real-time update to case room
    const io = req.app.get('io');
    if (io) {
      io.to(`case:${id}`).emit('case:status_updated', {
        caseId: id,
        status: data.status,
        updatedAt: data.updated_at
      });
    }

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
 * LIST DOCUMENTS
 * List uploaded files for a case with signed URLs
 */
exports.listDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const storageService = require('../services/storage.service');

    const { data, error } = await supabase
      .from('case_files')
      .select('id, file_name, file_url, file_type, uploaded_at')
      .eq('case_id', id)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    const documents = await Promise.all((data || []).map(async (file) => {
      let signedUrl = null;
      try {
        signedUrl = await storageService.generateSignedUrl(file.file_url, 3600);
      } catch { /* use null */ }
      return {
        id: file.id,
        fileName: file.file_name,
        fileUrl: file.file_url,
        fileType: file.file_type,
        uploadedAt: file.uploaded_at,
        signedUrl
      };
    }));

    res.json({ documents });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

/**
 * UPLOAD DOCUMENT
 * Driver uploads a file to their case (max 10MB, validated MIME)
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify driver owns the case
    const { data: caseData, error: fetchError } = await supabase
      .from('cases')
      .select('id, driver_id')
      .eq('id', id)
      .single();

    if (fetchError || !caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }
    if (caseData.driver_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Enforce max 10 documents
    const { count } = await supabase
      .from('case_files')
      .select('id', { count: 'exact', head: true })
      .eq('case_id', id);

    if (count >= 10) {
      return res.status(400).json({ error: 'Maximum 10 documents per case reached' });
    }

    const storageService = require('../services/storage.service');
    const uploadResult = await storageService.uploadToSupabase(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      `cases/${id}`
    );

    const { data: fileRecord, error: insertError } = await supabase
      .from('case_files')
      .insert([{
        case_id: id,
        file_name: req.file.originalname,
        file_url: uploadResult.path,
        file_type: 'driver_upload'
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    let signedUrl = null;
    try {
      signedUrl = await storageService.generateSignedUrl(uploadResult.path, 3600);
    } catch { /* non-critical */ }

    res.status(201).json({
      id: fileRecord.id,
      fileName: fileRecord.file_name,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: fileRecord.uploaded_at,
      signedUrl
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

/**
 * DELETE DOCUMENT
 * Driver deletes their uploaded file
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { id, documentId } = req.params;

    // Verify driver owns the case
    const { data: caseData } = await supabase
      .from('cases')
      .select('driver_id')
      .eq('id', id)
      .single();

    if (!caseData || caseData.driver_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get file record
    const { data: fileRecord, error: fetchError } = await supabase
      .from('case_files')
      .select('file_url')
      .eq('id', documentId)
      .eq('case_id', id)
      .single();

    if (fetchError || !fileRecord) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from storage
    const storageService = require('../services/storage.service');
    await storageService.deleteFromSupabase(fileRecord.file_url);

    // Delete from DB
    await supabase.from('case_files').delete().eq('id', documentId);

    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

/**
 * GET RECOMMENDED ATTORNEYS
 * Returns top 3 ranked attorneys for a case (driver-accessible)
 */
exports.getRecommendedAttorneys = async (req, res) => {
  try {
    const { id } = req.params;
    const assignmentService = require('../services/assignment.service');
    const rankedAttorneys = await assignmentService.rankAttorneys(id);
    const top3 = rankedAttorneys.slice(0, 3);
    const attorneys = top3.map((a, index) => ({
      id: a.userId,
      fullName: `${a.firstName} ${a.lastName}`.trim(),
      rating: Math.min(5, Math.max(1, Math.round((a.successRate || 0.5) * 5))),
      successRate: a.successRate || 0,
      specializations: a.specializations || [],
      casesWon: a.casesWon || 0,
      totalCases: a.currentCases || 0,
      isRecommended: index === 0
    }));
    res.json({ attorneys });
  } catch (error) {
    console.error('Get recommended attorneys error:', error);
    // Graceful fallback — empty list so driver can still proceed
    res.json({ attorneys: [] });
  }
};

/**
 * SELECT ATTORNEY
 * Driver selects an attorney from recommendations
 */
exports.selectAttorney = async (req, res) => {
  try {
    const { id } = req.params;
    const { attorney_id } = req.body;

    if (!attorney_id) {
      return res.status(400).json({ error: 'attorney_id is required' });
    }

    const { data: caseData, error: fetchError } = await supabase
      .from('cases')
      .select('id, status, driver_id')
      .eq('id', id)
      .single();

    if (fetchError || !caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (caseData.driver_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this case' });
    }

    if (!['new', 'reviewed'].includes(caseData.status)) {
      return res.status(400).json({ error: 'An attorney has already been selected for this case' });
    }

    const { data, error } = await supabase
      .from('cases')
      .update({ assigned_attorney_id: attorney_id, status: 'assigned_to_attorney' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity(id, req.user.id, 'Driver selected attorney');

    res.json({ message: 'Attorney selected successfully', case: data });
  } catch (error) {
    console.error('Select attorney error:', error);
    res.status(500).json({ error: 'Failed to select attorney' });
  }
};

/**
 * CREATE CASE PAYMENT
 * Driver initiates payment for attorney fee
 */
exports.createCasePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: caseData, error: fetchError } = await supabase
      .from('cases')
      .select('id, case_number, attorney_price, driver_id, status, assigned_attorney_id')
      .eq('id', id)
      .single();

    if (fetchError || !caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (caseData.driver_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this case' });
    }

    if (!caseData.attorney_price || caseData.attorney_price <= 0) {
      return res.status(400).json({ error: 'Attorney fee has not been set for this case yet' });
    }

    const paymentService = require('../services/payment.service');
    const result = await paymentService.createPaymentIntent({
      ticketId: id,
      userId: req.user.id,
      amount: caseData.attorney_price,
      currency: 'USD',
      metadata: { caseNumber: caseData.case_number || id }
    });

    res.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      amount: caseData.attorney_price
    });
  } catch (error) {
    console.error('Create case payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

/**
 * ACCEPT CASE
 * Attorney accepts assigned case - moves status to send_info_to_attorney
 */
exports.acceptCase = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: caseData, error: fetchError } = await supabase
      .from('cases')
      .select('id, case_number, status, assigned_attorney_id, driver_id')
      .eq('id', id)
      .single();

    if (fetchError || !caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (caseData.assigned_attorney_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to accept this case' });
    }

    if (caseData.status !== 'assigned_to_attorney') {
      return res.status(400).json({ error: 'Case is not awaiting attorney acceptance' });
    }

    const { data, error } = await supabase
      .from('cases')
      .update({ status: 'send_info_to_attorney' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity(id, req.user.id, 'Attorney accepted case');

    if (caseData.driver_id) {
      await createNotification(
        caseData.driver_id,
        id,
        'Attorney Accepted Your Case',
        `Your attorney has accepted case ${caseData.case_number} and is now working on your defense`,
        'status_change'
      );
    }

    res.json({ message: 'Case accepted successfully', case: data });
  } catch (error) {
    console.error('Accept case error:', error);
    res.status(500).json({ error: 'Failed to accept case' });
  }
};

/**
 * DECLINE CASE
 * Attorney declines assigned case - returns to new for re-assignment
 */
exports.declineCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: caseData, error: fetchError } = await supabase
      .from('cases')
      .select('id, case_number, status, assigned_attorney_id, driver_id')
      .eq('id', id)
      .single();

    if (fetchError || !caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (caseData.assigned_attorney_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to decline this case' });
    }

    if (caseData.status !== 'assigned_to_attorney') {
      return res.status(400).json({ error: 'Case is not awaiting attorney acceptance' });
    }

    const { data, error } = await supabase
      .from('cases')
      .update({ status: 'new', assigned_attorney_id: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity(id, req.user.id, 'Attorney declined case', reason ? { reason } : null);

    res.json({ message: 'Case declined successfully', case: data });
  } catch (error) {
    console.error('Decline case error:', error);
    res.status(500).json({ error: 'Failed to decline case' });
  }
};

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
