// ============================================
// Case Controller
// ============================================
// This is the brain of case management
// It handles all the business logic

const { supabase, supabaseAdmin, executeQuery } = require('../config/supabase');
const { validationResult } = require('express-validator');

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
