/**
 * Rating Service — Driver ratings for attorneys after case resolution.
 */

const { supabase } = require('../config/supabase');

/**
 * Submit a rating from a driver for an attorney on a specific case.
 * Validates: score 1–5, case must be resolved/closed, driver must own the case.
 * One rating per case (upsert on driver_id + case_id).
 */
const createRating = async ({ driverId, caseId, attorneyId, score, comment }) => {
  if (!score || score < 1 || score > 5) {
    throw new Error('Score must be between 1 and 5');
  }

  // Verify case belongs to driver and is resolved/closed
  const { data: caseRow, error: caseErr } = await supabase
    .from('cases')
    .select('id, driver_id, assigned_attorney_id, status')
    .eq('id', caseId)
    .single();

  if (caseErr || !caseRow) throw new Error('Case not found');
  if (caseRow.driver_id !== driverId) throw new Error('Unauthorized');
  if (!['closed', 'resolved', 'attorney_paid', 'pay_attorney'].includes(caseRow.status)) {
    throw new Error('Case must be resolved before rating');
  }

  const resolvedAttorneyId = attorneyId || caseRow.assigned_attorney_id;
  if (!resolvedAttorneyId) throw new Error('No attorney assigned to this case');

  const { data, error } = await supabase
    .from('ratings')
    .upsert({
      driver_id: driverId,
      case_id: caseId,
      attorney_id: resolvedAttorneyId,
      score,
      comment: comment || null,
    }, { onConflict: 'driver_id,case_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get aggregate rating stats for an attorney.
 * Returns { attorney_id, average_score, total_ratings, ratings[] }.
 */
const getAttorneyRating = async (attorneyId) => {
  const { data, error } = await supabase
    .from('ratings')
    .select('id, score, comment, created_at, driver_id')
    .eq('attorney_id', attorneyId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const ratings = data || [];
  const total = ratings.length;
  const average = total > 0
    ? Math.round((ratings.reduce((sum, r) => sum + r.score, 0) / total) * 10) / 10
    : null;

  return { attorney_id: attorneyId, average_score: average, total_ratings: total, ratings };
};

module.exports = { createRating, getAttorneyRating };
