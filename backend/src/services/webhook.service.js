/**
 * Webhook Service — dispatches outbound HTTP POST events to carrier-registered URLs.
 * Sprint 036 WH-2
 *
 * Supported events:
 *   case.created | case.status_changed | attorney.assigned | payment.received
 */

const crypto = require('crypto');
const { supabase } = require('../config/supabase');

const TIMEOUT_MS = 5000;

/**
 * Sign a payload string with HMAC-SHA256.
 * @param {string} secret
 * @param {string} payloadStr
 * @returns {string}  e.g. "sha256=abc123..."
 */
const signPayload = (secret, payloadStr) => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadStr);
  return `sha256=${hmac.digest('hex')}`;
};

/**
 * Send a single webhook POST with retry.
 * @param {string} url
 * @param {string} secret
 * @param {string} event
 * @param {object} payload
 */
const sendWebhook = async (url, secret, event, payload) => {
  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  const signature = signPayload(secret, body);
  const headers = {
    'Content-Type': 'application/json',
    'X-CDL-Event': event,
    'X-CDL-Signature': signature,
  };

  const attempt = () => fetch(url, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  try {
    const res = await attempt();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    // Retry once after 1 s
    await new Promise(r => setTimeout(r, 1000));
    try {
      await attempt();
    } catch (retryErr) {
      console.error(`[WebhookService] Failed to deliver to ${url} (event=${event}):`, retryErr.message);
    }
  }
};

/**
 * Dispatch an event to all active webhooks registered for this carrier.
 * Non-blocking: errors are caught and logged.
 *
 * @param {string} carrierId
 * @param {string} event
 * @param {object} payload
 */
const dispatch = (carrierId, event, payload) => {
  if (!carrierId) return;

  supabase
    .from('carrier_webhooks')
    .select('url, secret')
    .eq('carrier_id', carrierId)
    .eq('active', true)
    .contains('events', [event])
    .then(({ data: webhooks, error }) => {
      if (error || !webhooks?.length) return;
      webhooks.forEach(wh => sendWebhook(wh.url, wh.secret, event, payload).catch(() => {}));
    })
    .catch(err => console.error('[WebhookService] DB error:', err.message));
};

module.exports = { dispatch, signPayload };
