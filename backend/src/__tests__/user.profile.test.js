'use strict';

jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = require('../config/supabase');

let chain;
function buildChain(result = { data: null, error: null }) {
  chain = {};
  ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit'].forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.single = jest.fn().mockResolvedValue(result);
  chain.maybeSingle = jest.fn().mockResolvedValue(result);
  chain.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  supabase.from.mockReturnValue(chain);
}

function makeReq(overrides = {}) {
  return { user: { id: 'u1', role: 'driver' }, body: {}, params: {}, query: {}, ...overrides };
}

function makeRes() {
  const res = { json: jest.fn(), status: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

// Import the route handler by requiring the router and extracting the PUT /profile handler
// Since it's an Express router, we test the logic inline
const express = require('express');

// We need to test the route handler directly. Let's extract it.
// The simplest approach: require the module and call it as middleware
let putProfileHandler;

beforeAll(() => {
  // Mock middleware
  jest.mock('../middleware/auth', () => ({
    authenticate: (req, res, next) => next(),
    authorize: () => (req, res, next) => next(),
  }));
  jest.mock('../middleware/upload.middleware', () => ({
    uploadSingle: jest.fn(),
    handleUploadError: jest.fn(),
  }));
  jest.mock('../services/storage.service', () => ({
    uploadToSupabase: jest.fn(),
    deleteFromSupabase: jest.fn(),
    getPublicUrl: jest.fn(),
  }));

  // Load routes and find the PUT /profile handler
  const router = require('../routes/user.routes');
  const layer = router.stack.find(l => l.route && l.route.path === '/profile' && l.route.methods.put);
  // The last handler in the stack is the actual route handler (after authenticate middleware)
  putProfileHandler = layer.route.stack[layer.route.stack.length - 1].handle;
});

beforeEach(() => {
  jest.clearAllMocks();
  buildChain();
});

describe('PUT /api/users/profile', () => {
  test('updates name and phone', async () => {
    const updatedUser = {
      id: 'u1', full_name: 'Jane Doe', email: 'jane@test.com',
      phone: '555-9999', avatar_url: null, role: 'driver',
      bio: null, cdl_number: null, cdl_state: null,
    };
    chain.single.mockResolvedValueOnce({ data: updatedUser, error: null });

    const req = makeReq({ body: { name: 'Jane Doe', phone: '555-9999' } });
    const res = makeRes();
    await putProfileHandler(req, res);

    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
      full_name: 'Jane Doe', phone: '555-9999',
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      user: expect.objectContaining({ name: 'Jane Doe', phone: '555-9999' }),
    }));
  });

  test('updates bio field', async () => {
    const updatedUser = {
      id: 'u1', full_name: 'Jane', email: 'jane@test.com',
      phone: null, avatar_url: null, role: 'driver',
      bio: 'Hello world', cdl_number: null, cdl_state: null,
    };
    chain.single.mockResolvedValueOnce({ data: updatedUser, error: null });

    const req = makeReq({ body: { bio: 'Hello world' } });
    const res = makeRes();
    await putProfileHandler(req, res);

    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ bio: 'Hello world' }));
    expect(res.json.mock.calls[0][0].user.bio).toBe('Hello world');
  });

  test('updates cdl_number and cdl_state', async () => {
    const updatedUser = {
      id: 'u1', full_name: 'Jane', email: 'jane@test.com',
      phone: null, avatar_url: null, role: 'driver',
      bio: null, cdl_number: 'CDL123', cdl_state: 'TX',
    };
    chain.single.mockResolvedValueOnce({ data: updatedUser, error: null });

    const req = makeReq({ body: { cdl_number: 'CDL123', cdl_state: 'tx' } });
    const res = makeRes();
    await putProfileHandler(req, res);

    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
      cdl_number: 'CDL123', cdl_state: 'TX',
    }));
  });

  test('bio over 500 chars returns 400', async () => {
    const req = makeReq({ body: { bio: 'x'.repeat(501) } });
    const res = makeRes();
    await putProfileHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error.code).toBe('VALIDATION_ERROR');
  });

  test('invalid cdl_state returns 400', async () => {
    const req = makeReq({ body: { cdl_state: 'TEXAS' } });
    const res = makeRes();
    await putProfileHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error.message).toContain('2-letter');
  });

  test('empty body returns 400', async () => {
    const req = makeReq({ body: {} });
    const res = makeRes();
    await putProfileHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error.code).toBe('VALIDATION_ERROR');
  });

  test('bio strips HTML tags', async () => {
    const updatedUser = {
      id: 'u1', full_name: 'Jane', email: 'jane@test.com',
      phone: null, avatar_url: null, role: 'driver',
      bio: 'Hello world', cdl_number: null, cdl_state: null,
    };
    chain.single.mockResolvedValueOnce({ data: updatedUser, error: null });

    const req = makeReq({ body: { bio: '<script>alert("xss")</script>Hello world' } });
    const res = makeRes();
    await putProfileHandler(req, res);

    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
      bio: 'alert("xss")Hello world',
    }));
  });

  test('name and phone strip HTML tags', async () => {
    const updatedUser = {
      id: 'u1', full_name: 'Jane Doe', email: 'jane@test.com',
      phone: '555-1234', avatar_url: null, role: 'driver',
      bio: null, cdl_number: null, cdl_state: null,
    };
    chain.single.mockResolvedValueOnce({ data: updatedUser, error: null });

    const req = makeReq({ body: { name: '<b>Jane</b> Doe', phone: '<em>555</em>-1234' } });
    const res = makeRes();
    await putProfileHandler(req, res);

    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
      full_name: 'Jane Doe',
      phone: '555-1234',
    }));
  });
});
