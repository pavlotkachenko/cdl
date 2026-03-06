/**
 * Invoice Service — generate and retrieve case invoices.
 * Invoices are derived from case payment data (no separate table required).
 */

const { supabase } = require('../config/supabase');

/**
 * Build an invoice object for a case.
 * Returns null if case not found or has no payment information.
 */
const getInvoiceByCase = async (caseId, requesterId, requesterRole) => {
  const { data: caseRow, error } = await supabase
    .from('cases')
    .select(`
      id, case_number, customer_name, violation_type, violation_date,
      state, attorney_price, attorney_price_set_at, status,
      driver_id, assigned_attorney_id,
      attorney:assigned_attorney_id(full_name, email),
      driver:driver_id(full_name, email)
    `)
    .eq('id', caseId)
    .single();

  if (error || !caseRow) throw new Error('Case not found');

  // Authorization: driver sees own cases, attorney sees assigned cases, operator/admin see all
  const allowedRoles = ['operator', 'admin', 'paralegal'];
  if (!allowedRoles.includes(requesterRole)) {
    if (requesterRole === 'driver' && caseRow.driver_id !== requesterId) {
      throw new Error('Unauthorized');
    }
    if (requesterRole === 'attorney' && caseRow.assigned_attorney_id !== requesterId) {
      throw new Error('Unauthorized');
    }
  }

  if (!caseRow.attorney_price) return null;

  return {
    invoice_number: `INV-${caseRow.case_number || caseRow.id.slice(0, 8).toUpperCase()}`,
    case_id: caseRow.id,
    case_number: caseRow.case_number,
    customer_name: caseRow.customer_name,
    violation_type: caseRow.violation_type,
    violation_date: caseRow.violation_date,
    state: caseRow.state,
    attorney_name: caseRow.attorney?.full_name || null,
    amount: parseFloat(caseRow.attorney_price),
    currency: 'USD',
    issued_at: caseRow.attorney_price_set_at,
    status: caseRow.status,
  };
};

module.exports = { getInvoiceByCase };
