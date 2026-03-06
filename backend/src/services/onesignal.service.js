/**
 * OneSignal Push Notification Service
 * Non-blocking — all failures are caught and logged, never rethrown.
 * Guard: returns immediately when ONESIGNAL_APP_ID / ONESIGNAL_API_KEY are absent.
 */

const { supabase } = require('../config/supabase');

const ONESIGNAL_URL = 'https://onesignal.com/api/v1/notifications';

/**
 * Send a push notification to specific OneSignal player IDs.
 * Silently no-ops when OneSignal is not configured or playerIds is empty.
 */
const sendPushNotification = async (playerIds, heading, content, data = {}) => {
  if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_API_KEY) return;

  const filtered = (playerIds || []).filter(Boolean);
  if (filtered.length === 0) return;

  const body = JSON.stringify({
    app_id: process.env.ONESIGNAL_APP_ID,
    include_player_ids: filtered,
    headings: { en: heading },
    contents: { en: content },
    data,
  });

  try {
    const res = await fetch(ONESIGNAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
      },
      body,
    });
    const json = await res.json();
    if (!res.ok) {
      console.error('[OneSignalService] API error:', json);
    }
    return json;
  } catch (err) {
    console.error('[OneSignalService] Fetch failed:', err.message);
  }
};

/**
 * Lookup a user's stored push_token and send them a push notification.
 * Silently skips if the user has no push_token registered.
 */
const notifyUser = async (userId, heading, content, extraData = {}) => {
  try {
    const { data: user } = await supabase
      .from('users').select('push_token').eq('id', userId).single();
    if (!user?.push_token) return;
    await sendPushNotification([user.push_token], heading, content, extraData);
  } catch (err) {
    console.error('[OneSignalService] notifyUser failed:', err.message);
  }
};

module.exports = { sendPushNotification, notifyUser };
