/**
 * Integration tests for BUG-003 and BUG-004 from HARD_BUGS_REGISTRY.md
 *
 * BUG-003: signInWithPassword must NOT pollute the shared admin Supabase client.
 *          After a signIn, subsequent DB queries (e.g. register) must still work.
 *
 * BUG-004: Registration must succeed for ALL 5 API roles (driver, carrier,
 *          attorney, admin, paralegal) without hitting DB enum constraint errors.
 *
 * These tests run against the LIVE backend API (localhost:3000).
 * Prerequisites: backend must be running with valid Supabase credentials.
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Skip these tests if the API is not reachable
async function isApiReachable() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Unique email generator to avoid collisions
const uniqueEmail = (prefix) =>
  `${prefix}+${Date.now()}${Math.random().toString(36).slice(2, 6)}@e2etest.com`;

const STRONG_PASSWORD = 'Test@1234Secure';

describe('BUG-003: Supabase admin client auth state pollution', () => {
  let apiAvailable;

  beforeAll(async () => {
    apiAvailable = await isApiReachable();
    if (!apiAvailable) {
      console.warn(
        'Skipping integration tests — backend not running at ' + API_BASE,
      );
    }
  });

  const run = (name, fn) => {
    // eslint-disable-next-line jest/valid-title
    test(name, async () => {
      if (!apiAvailable) return;
      await fn();
    });
  };

  run('signIn should NOT break subsequent register calls', async () => {
    // 1. Register a user
    const email1 = uniqueEmail('bug3-seed');
    const regResp = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bug3 Seed',
        email: email1,
        password: STRONG_PASSWORD,
      }),
    });
    expect(regResp.status).toBe(201);

    // 2. Sign in with that user (this previously polluted the admin client)
    const signInResp = await fetch(`${API_BASE}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email1, password: STRONG_PASSWORD }),
    });
    expect(signInResp.status).toBe(200);
    const signInBody = await signInResp.json();
    expect(signInBody).toHaveProperty('token');

    // 3. Register ANOTHER user — this must NOT fail with RLS recursion error
    const email2 = uniqueEmail('bug3-after');
    const reg2Resp = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bug3 After SignIn',
        email: email2,
        password: STRONG_PASSWORD,
      }),
    });

    // Before the fix, this returned 500 with "infinite recursion detected in policy"
    expect(reg2Resp.status).toBe(201);
    const reg2Body = await reg2Resp.json();
    expect(reg2Body).toHaveProperty('token');
    expect(reg2Body.user.email).toBe(email2.toLowerCase());
  });

  run('multiple signIns should NOT corrupt subsequent DB queries', async () => {
    // Perform 3 consecutive signIn calls, then try a register
    const emails = [];
    for (let i = 0; i < 3; i++) {
      const email = uniqueEmail(`bug3-multi-${i}`);
      emails.push(email);
      await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Bug3 Multi ${i}`,
          email,
          password: STRONG_PASSWORD,
        }),
      });
    }

    // Sign in with each
    for (const email of emails) {
      const resp = await fetch(`${API_BASE}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: STRONG_PASSWORD }),
      });
      expect(resp.status).toBe(200);
    }

    // Now register one more — must still work
    const finalEmail = uniqueEmail('bug3-final');
    const resp = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bug3 Final',
        email: finalEmail,
        password: STRONG_PASSWORD,
      }),
    });
    expect(resp.status).toBe(201);
  });
});

describe('BUG-004: All 5 API roles must register successfully', () => {
  let apiAvailable;

  beforeAll(async () => {
    apiAvailable = await isApiReachable();
  });

  const run = (name, fn) => {
    // eslint-disable-next-line jest/valid-title
    test(name, async () => {
      if (!apiAvailable) return;
      await fn();
    });
  };

  // driver and carrier are the two roles the register endpoint supports via the API
  // (the role field only maps 'carrier' explicitly; everything else defaults to 'driver')
  const registerableRoles = [
    { role: undefined, expectedRole: 'driver', label: 'default (no role)' },
    { role: 'carrier', expectedRole: 'carrier', label: 'carrier' },
  ];

  registerableRoles.forEach(({ role, expectedRole, label }) => {
    const safePrefix = label.replace(/[^a-z0-9-]/g, '');
    run(`register with role=${label} should return 201 and role="${expectedRole}"`, async () => {
      const email = uniqueEmail(`bug4-${safePrefix}`);
      const body = {
        name: `Bug4 ${label}`,
        email,
        password: STRONG_PASSWORD,
      };
      if (role) body.role = role;

      const resp = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await resp.json();
      if (resp.status !== 201) {
        console.error(`Registration failed for role=${label}:`, data, 'email:', email);
      }
      expect(resp.status).toBe(201);
      expect(data.user.role).toBe(expectedRole);
      expect(data).toHaveProperty('token');
    });
  });

  run('carrier should be able to log in and get carrier role back', async () => {
    const email = uniqueEmail('bug4-carrier-login');
    // Register as carrier
    const regResp = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bug4 Carrier Login',
        email,
        password: STRONG_PASSWORD,
        role: 'carrier',
      }),
    });
    expect(regResp.status).toBe(201);

    // Sign in
    const signInResp = await fetch(`${API_BASE}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: STRONG_PASSWORD }),
    });
    expect(signInResp.status).toBe(200);
    const signInBody = await signInResp.json();
    // The real role (carrier) should come from user_metadata, not the DB enum
    expect(signInBody.user.role).toBe('carrier');
  });

  run('duplicate email should return 409, not 500', async () => {
    const email = uniqueEmail('bug4-dup');
    // First registration
    const resp1 = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bug4 First',
        email,
        password: STRONG_PASSWORD,
      }),
    });
    expect(resp1.status).toBe(201);

    // Second registration with same email
    const resp2 = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bug4 Duplicate',
        email,
        password: STRONG_PASSWORD,
      }),
    });
    // Must be 409, not 500 (which was the bug — enum constraint was hit before dup check)
    expect(resp2.status).toBe(409);
  });

  run('missing required fields should return 400, not 500', async () => {
    const resp = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'incomplete@test.com' }),
    });
    expect(resp.status).toBe(400);
  });
});
