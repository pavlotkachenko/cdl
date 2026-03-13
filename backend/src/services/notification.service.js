/**
 * Notification Service — manages notification CRUD and preferences.
 */
const { supabase } = require('../config/supabase');

/**
 * Get notifications for a user with pagination.
 */
exports.getUserNotifications = async (userId, page = 1, limit = 20, unreadOnly = false) => {
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    notifications: data || [],
    total: count || 0,
    page,
    limit,
  };
};

/**
 * Get unread notification count.
 */
exports.getUnreadCount = async (userId) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
  return count || 0;
};

/**
 * Mark a single notification as read.
 */
exports.markAsRead = async (notificationId, userId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) throw error;
};

/**
 * Mark all notifications as read for a user.
 */
exports.markAllAsRead = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
};

/**
 * Get notification preferences for a user.
 */
exports.getPreferences = async (userId) => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
};

/**
 * Update a notification preference channel.
 */
exports.updatePreferences = async (userId, channel, enabled, quietStart, quietEnd) => {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userId,
      channel,
      enabled,
      quiet_hours_start: quietStart || null,
      quiet_hours_end: quietEnd || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,channel' });

  if (error) throw error;
};

/**
 * Create a notification for a user.
 */
exports.createNotification = async ({ userId, caseId, title, message, type }) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      case_id: caseId || null,
      title,
      message,
      type: type || 'system',
      read: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
