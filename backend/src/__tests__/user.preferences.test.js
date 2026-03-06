/**
 * Tests for PATCH /api/users/me/preferences — SM-2
 * Tests the inline route handler in user.routes.js.
 */

jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('../middleware/auth', () => ({
  authenticate: (req, res, next) => { req.user = { id: 'user-1', role: 'driver' }; next(); },
  authorize: () => (req, res, next) => next(),
}));

const { supabase } = require('../config/supabase');

// Require the router and extract the PATCH handler by simulating a request
const express = require('express');
const router = require('../routes/user.routes');
const request = require('supertest');

// Build a minimal Express app with the router
const app = express();
app.use(express.json());

// req.user is attached by the mocked authenticate middleware
app.use('/api/users', router);

// ─── Chain factory ───────────────────────────────────────────────────────────
function makeChain(result = { data: null, error: null }) {
  const c = {};
  ['select', 'update', 'eq'].forEach(m => {
    c[m] = jest.fn().mockReturnValue(c);
  });
  c.single = jest.fn().mockResolvedValue(result);
  supabase.from.mockReturnValue(c);
  return c;
}

beforeEach(() => jest.resetAllMocks());

describe('PATCH /api/users/me/preferences', () => {
  it('returns 400 when sms_opt_in is missing', async () => {
    const res = await request(app)
      .patch('/api/users/me/preferences')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when sms_opt_in is not a boolean', async () => {
    const res = await request(app)
      .patch('/api/users/me/preferences')
      .send({ sms_opt_in: 'yes' });
    expect(res.status).toBe(400);
  });

  it('updates sms_opt_in and returns preferences on success', async () => {
    makeChain({ data: { id: 'user-1', sms_opt_in: true }, error: null });
    const res = await request(app)
      .patch('/api/users/me/preferences')
      .send({ sms_opt_in: true });
    expect(res.status).toBe(200);
    expect(res.body.preferences.sms_opt_in).toBe(true);
  });

  it('returns 500 when DB update fails', async () => {
    makeChain({ data: null, error: { message: 'column not found' } });
    const res = await request(app)
      .patch('/api/users/me/preferences')
      .send({ sms_opt_in: false });
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('SERVER_ERROR');
  });
});
