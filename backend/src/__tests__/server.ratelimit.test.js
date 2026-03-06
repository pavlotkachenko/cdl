'use strict';

/**
 * LH-1: Rate Limiting + CORS tests
 *
 * Tests a minimal Express app with the same rate-limit and CORS
 * configuration used in server.js, avoiding live DB dependencies.
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const request = require('supertest');

// ── helpers ────────────────────────────────────────────────────────────────

function buildApp({ prodUrl = '', frontendUrl = 'http://localhost:4200', authMax = 100, publicMax = 10 } = {}) {
  const app = express();

  const allowedOrigins = [
    frontendUrl || 'http://localhost:4200',
    'http://host.docker.internal:4200',
  ];
  if (prodUrl) allowedOrigins.push(prodUrl);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: authMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
  });

  const publicSubmitLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: publicMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many submissions, please try again later.' } },
  });

  app.use('/api/auth', authLimiter, (req, res) => res.json({ ok: true }));
  app.use('/api/cases/public-submit', publicSubmitLimiter, (req, res) => res.json({ ok: true }));
  app.use('/api/cases', (req, res) => res.json({ ok: true }));

  return app;
}

// ── CORS ───────────────────────────────────────────────────────────────────

describe('CORS origin whitelist', () => {
  it('allows requests from FRONTEND_URL', async () => {
    const app = buildApp({ frontendUrl: 'http://localhost:4200' });
    const res = await request(app)
      .get('/api/auth')
      .set('Origin', 'http://localhost:4200');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4200');
  });

  it('allows requests from host.docker.internal dev URL', async () => {
    const app = buildApp();
    const res = await request(app)
      .get('/api/auth')
      .set('Origin', 'http://host.docker.internal:4200');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://host.docker.internal:4200');
  });

  it('allows requests when PRODUCTION_URL is configured', async () => {
    const app = buildApp({ prodUrl: 'https://app.cdltickets.com' });
    const res = await request(app)
      .get('/api/auth')
      .set('Origin', 'https://app.cdltickets.com');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://app.cdltickets.com');
  });

  it('blocks requests from unknown origins', async () => {
    const app = buildApp();
    const res = await request(app)
      .get('/api/auth')
      .set('Origin', 'https://evil.example.com');
    expect(res.status).toBe(500); // Express CORS error path
  });

  it('allows requests with no Origin header (server-to-server / curl)', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/auth');
    expect(res.status).toBe(200);
  });
});

// ── Auth rate limiter ───────────────────────────────────────────────────────

describe('Auth route rate limiter', () => {
  it('allows requests under the limit', async () => {
    const app = buildApp({ authMax: 5 });
    const res = await request(app).get('/api/auth');
    expect(res.status).toBe(200);
    expect(res.headers['ratelimit-limit']).toBeDefined();
  });

  it('returns 429 when auth limit is exceeded', async () => {
    const app = buildApp({ authMax: 2 });
    await request(app).post('/api/auth');
    await request(app).post('/api/auth');
    const res = await request(app).post('/api/auth');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });

  it('includes RateLimit-Limit header', async () => {
    const app = buildApp({ authMax: 3 });
    const res = await request(app).get('/api/auth');
    expect(res.headers['ratelimit-limit']).toBe('3');
  });
});

// ── Public submit rate limiter ──────────────────────────────────────────────

describe('Public-submit route rate limiter', () => {
  it('allows requests under the limit', async () => {
    const app = buildApp({ publicMax: 5 });
    const res = await request(app).post('/api/cases/public-submit');
    expect(res.status).toBe(200);
  });

  it('returns 429 when public-submit limit is exceeded', async () => {
    const app = buildApp({ publicMax: 2 });
    await request(app).post('/api/cases/public-submit');
    await request(app).post('/api/cases/public-submit');
    const res = await request(app).post('/api/cases/public-submit');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });

  it('does NOT apply public-submit limiter to other case routes', async () => {
    const app = buildApp({ publicMax: 1 });
    // exhaust the public-submit limiter
    await request(app).post('/api/cases/public-submit');
    await request(app).post('/api/cases/public-submit');
    // /api/cases itself must still work
    const res = await request(app).get('/api/cases');
    expect(res.status).toBe(200);
  });
});
