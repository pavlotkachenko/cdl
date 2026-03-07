/**
 * Webhook Controller — CRUD for carrier-registered outbound webhook endpoints.
 * Sprint 036 WH-1
 */

const crypto = require('crypto');
const { supabase } = require('../config/supabase');

const VALID_EVENTS = ['case.created', 'case.status_changed', 'attorney.assigned', 'payment.received'];

// ── List webhooks ─────────────────────────────────────────────────────────────
const listWebhooks = async (req, res) => {
  const carrierId = req.user?.carrierId;
  if (!carrierId) return res.status(403).json({ error: 'Carrier ID missing from token' });

  const { data, error } = await supabase
    .from('carrier_webhooks')
    .select('id, url, events, active, created_at')
    .eq('carrier_id', carrierId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch webhooks' });
  res.json({ webhooks: data });
};

// ── Create webhook ────────────────────────────────────────────────────────────
const createWebhook = async (req, res) => {
  const carrierId = req.user?.carrierId;
  if (!carrierId) return res.status(403).json({ error: 'Carrier ID missing from token' });

  const { url, events } = req.body;
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return res.status(400).json({ error: 'A valid HTTPS/HTTP URL is required' });
  }
  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'At least one event must be selected' });
  }
  const invalid = events.filter(e => !VALID_EVENTS.includes(e));
  if (invalid.length) {
    return res.status(400).json({ error: `Invalid events: ${invalid.join(', ')}` });
  }

  const secret = crypto.randomBytes(32).toString('hex');

  const { data, error } = await supabase
    .from('carrier_webhooks')
    .insert({ carrier_id: carrierId, url, events, secret, active: true })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to create webhook' });
  res.status(201).json({ webhook: data }); // secret visible once on creation
};

// ── Update webhook ────────────────────────────────────────────────────────────
const updateWebhook = async (req, res) => {
  const carrierId = req.user?.carrierId;
  if (!carrierId) return res.status(403).json({ error: 'Carrier ID missing from token' });

  const { id } = req.params;
  const updates = {};
  if (typeof req.body.active === 'boolean') updates.active = req.body.active;
  if (req.body.url) updates.url = req.body.url;
  if (Array.isArray(req.body.events)) updates.events = req.body.events;

  const { data, error } = await supabase
    .from('carrier_webhooks')
    .update(updates)
    .eq('id', id)
    .eq('carrier_id', carrierId)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Webhook not found' });
  res.json({ webhook: data });
};

// ── Delete webhook ────────────────────────────────────────────────────────────
const deleteWebhook = async (req, res) => {
  const carrierId = req.user?.carrierId;
  if (!carrierId) return res.status(403).json({ error: 'Carrier ID missing from token' });

  const { id } = req.params;
  const { error } = await supabase
    .from('carrier_webhooks')
    .delete()
    .eq('id', id)
    .eq('carrier_id', carrierId);

  if (error) return res.status(500).json({ error: 'Failed to delete webhook' });
  res.json({ message: 'Webhook deleted' });
};

module.exports = { listWebhooks, createWebhook, updateWebhook, deleteWebhook };
