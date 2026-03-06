/**
 * Sprint 029 PN-3 — PATCH /api/users/me/push-token Tests
 */

jest.mock('../config/supabase', () => ({ supabase: { from: jest.fn() } }));
jest.mock('../middleware/auth', () => ({
  authenticate: (req, _res, next) => { req.user = { id: 'u1', role: 'driver' }; next(); },
  authorize: () => (_req, _res, next) => next(),
}));

const request = require('supertest');
const express = require('express');

function buildApp() {
  jest.resetModules();
  jest.mock('../config/supabase', () => ({ supabase: { from: jest.fn() } }));
  jest.mock('../middleware/auth', () => ({
    authenticate: (req, _res, next) => { req.user = { id: 'u1', role: 'driver' }; next(); },
    authorize: () => (_req, _res, next) => next(),
  }));
  const app = express();
  app.use(express.json());
  app.use('/api/users', require('../routes/user.routes'));
  return app;
}

function setupSupabaseUpdate(error = null) {
  const { supabase } = require('../config/supabase');
  const chain = { update: jest.fn(), eq: jest.fn() };
  chain.update.mockReturnValue(chain);
  chain.eq.mockResolvedValue({ data: null, error });
  supabase.from.mockReturnValue(chain);
  return chain;
}

describe('PATCH /api/users/me/push-token (PN-3)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
    jest.mock('../config/supabase', () => ({ supabase: { from: jest.fn() } }));
    jest.mock('../middleware/auth', () => ({
      authenticate: (req, _res, next) => { req.user = { id: 'u1', role: 'driver' }; next(); },
      authorize: () => (_req, _res, next) => next(),
    }));
  });

  it('returns 400 when push_token is missing', async () => {
    const app = buildApp();
    const res = await request(app).patch('/api/users/me/push-token').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when push_token is not a string', async () => {
    const app = buildApp();
    const res = await request(app).patch('/api/users/me/push-token').send({ push_token: 123 });
    expect(res.status).toBe(400);
  });

  it('returns 200 success when push_token is valid', async () => {
    const app = buildApp();
    setupSupabaseUpdate(null);
    const res = await request(app)
      .patch('/api/users/me/push-token')
      .send({ push_token: 'player_abc_123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 500 when DB update fails', async () => {
    const app = buildApp();
    setupSupabaseUpdate({ message: 'column not found' });
    const res = await request(app)
      .patch('/api/users/me/push-token')
      .send({ push_token: 'player_abc_123' });
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('SERVER_ERROR');
  });
});
