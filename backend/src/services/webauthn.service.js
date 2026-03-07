/**
 * WebAuthn Service — FIDO2 registration and authentication via @simplewebauthn/server.
 * Sprint 037 BIO-1
 *
 * Challenge storage: in-memory Map with 5-minute TTL (stateless, no session table).
 */

const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const RP_NAME = 'CDL Ticket Management';
const RP_ID   = process.env.WEBAUTHN_RP_ID   || 'localhost';
const ORIGIN  = process.env.WEBAUTHN_ORIGIN  || 'http://localhost:4200';
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory challenge store: userId → { challenge, expiresAt }
const challengeStore = new Map();

const storeChallenge = (userId, challenge) => {
  challengeStore.set(userId, { challenge, expiresAt: Date.now() + CHALLENGE_TTL_MS });
};

const consumeChallenge = (userId) => {
  const entry = challengeStore.get(userId);
  if (!entry) return null;
  challengeStore.delete(userId);
  if (Date.now() > entry.expiresAt) return null;
  return entry.challenge;
};

// ── Registration ──────────────────────────────────────────────────────────────

const getRegistrationOptions = async (user) => {
  const { data: existing } = await supabase
    .from('webauthn_credentials')
    .select('credential_id')
    .eq('user_id', user.id);

  const excludeCredentials = (existing || []).map(c => ({
    id: Buffer.from(c.credential_id, 'base64url'),
    type: 'public-key',
  }));

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: Buffer.from(user.id),
    userName: user.email,
    userDisplayName: user.full_name || user.email,
    attestationType: 'none',
    excludeCredentials,
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
  });

  storeChallenge(user.id, options.challenge);
  return options;
};

const verifyRegistration = async (userId, response) => {
  const expectedChallenge = consumeChallenge(userId);
  if (!expectedChallenge) throw new Error('Challenge expired or not found');

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('Registration verification failed');
  }

  const { credential } = verification.registrationInfo;
  await supabase.from('webauthn_credentials').insert({
    user_id: userId,
    credential_id: Buffer.from(credential.id).toString('base64url'),
    public_key: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    device_type: verification.registrationInfo.credentialDeviceType,
  });

  return { verified: true };
};

// ── Authentication ────────────────────────────────────────────────────────────

const getAuthenticationOptions = async (email) => {
  const { data: user } = await supabase
    .from('users').select('id').eq('email', email).single();
  if (!user) throw new Error('User not found');

  const { data: creds } = await supabase
    .from('webauthn_credentials').select('credential_id').eq('user_id', user.id);
  if (!creds?.length) throw new Error('No credentials registered for this user');

  const allowCredentials = creds.map(c => ({
    id: Buffer.from(c.credential_id, 'base64url'),
    type: 'public-key',
  }));

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials,
    userVerification: 'preferred',
  });

  storeChallenge(user.id, options.challenge);
  return { options, userId: user.id };
};

const verifyAuthentication = async (email, response) => {
  const { data: user } = await supabase
    .from('users').select('id, role, full_name, carrier_id').eq('email', email).single();
  if (!user) throw new Error('User not found');

  const expectedChallenge = consumeChallenge(user.id);
  if (!expectedChallenge) throw new Error('Challenge expired or not found');

  const credId = response.id;
  const { data: storedCred } = await supabase
    .from('webauthn_credentials')
    .select('credential_id, public_key, counter')
    .eq('user_id', user.id)
    .eq('credential_id', credId)
    .single();

  if (!storedCred) throw new Error('Credential not found');

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    credential: {
      id: Buffer.from(storedCred.credential_id, 'base64url'),
      publicKey: Buffer.from(storedCred.public_key, 'base64url'),
      counter: storedCred.counter,
    },
  });

  if (!verification.verified) throw new Error('Authentication verification failed');

  // Update counter
  await supabase
    .from('webauthn_credentials')
    .update({ counter: verification.authenticationInfo.newCounter })
    .eq('user_id', user.id)
    .eq('credential_id', credId);

  const token = jwt.sign(
    { userId: user.id, role: user.role, carrierId: user.carrier_id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, user: { id: user.id, role: user.role, full_name: user.full_name } };
};

module.exports = {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
  // Exposed for testing
  _storeChallenge: storeChallenge,
  _consumeChallenge: consumeChallenge,
};
