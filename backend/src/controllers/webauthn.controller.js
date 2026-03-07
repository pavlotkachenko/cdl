/**
 * WebAuthn Controller — registration & authentication endpoints.
 * Sprint 037 BIO-1
 */

const webauthnService = require('../services/webauthn.service');
const { supabase } = require('../config/supabase');

// ── Registration ──────────────────────────────────────────────────────────────

const registerOptions = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: user } = await supabase.from('users').select('id, email, full_name').eq('id', userId).single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const options = await webauthnService.getRegistrationOptions(user);
    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const registerVerify = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await webauthnService.verifyRegistration(userId, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── Authentication ────────────────────────────────────────────────────────────

const authOptions = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });

    const { options } = await webauthnService.getAuthenticationOptions(email);
    res.json(options);
  } catch (err) {
    const status = err.message.includes('not found') || err.message.includes('No credentials') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
};

const authVerify = async (req, res) => {
  try {
    const { email, response } = req.body;
    if (!email || !response) return res.status(400).json({ error: 'email and response required' });

    const result = await webauthnService.verifyAuthentication(email, response);
    res.json(result);
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : 401;
    res.status(status).json({ error: err.message });
  }
};

module.exports = { registerOptions, registerVerify, authOptions, authVerify };
