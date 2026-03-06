/**
 * Notification Utilities — shared helpers used by SMS and push services.
 */

const { supabase } = require('../config/supabase');

const DEFAULT_QUIET_START = '21:00'; // 9 PM
const DEFAULT_QUIET_END = '08:00';   // 8 AM

/**
 * Parse "HH:MM" into total minutes since midnight.
 */
const toMinutes = (timeStr) => {
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  return h * 60 + (m || 0);
};

/**
 * Determine if the current UTC time falls within a user's quiet hours.
 * Handles overnight ranges (e.g. 21:00 – 08:00).
 *
 * @param {string} userId
 * @returns {Promise<boolean>} true if currently quiet hours
 */
const isQuietHours = async (userId) => {
  try {
    let startStr = DEFAULT_QUIET_START;
    let endStr = DEFAULT_QUIET_END;

    if (userId) {
      const { data: pref } = await supabase
        .from('notification_preferences')
        .select('quiet_hours_start, quiet_hours_end')
        .eq('user_id', userId)
        .single();

      if (pref?.quiet_hours_start) startStr = pref.quiet_hours_start;
      if (pref?.quiet_hours_end) endStr = pref.quiet_hours_end;
    }

    const now = new Date();
    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const startMinutes = toMinutes(startStr);
    const endMinutes = toMinutes(endStr);

    // Overnight range: start > end (e.g. 21:00 → 08:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
    // Same-day range (e.g. 22:00 → 23:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } catch {
    return false; // Fail open: do not suppress notifications on error
  }
};

module.exports = { isQuietHours };
