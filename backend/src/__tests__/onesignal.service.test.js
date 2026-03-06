/**
 * Sprint 029 PN-1 — OneSignal Service Tests
 * Sprint 033 NH-1 — Quiet hours enforcement
 */

jest.mock('../config/supabase', () => ({ supabase: { from: jest.fn() } }));
jest.mock('../services/notification.utils', () => ({ isQuietHours: jest.fn().mockResolvedValue(false) }));

function buildChain(supabase, result = { data: null, error: null }) {
  const chain = {};
  ['select', 'eq'].forEach(m => { chain[m] = jest.fn().mockReturnValue(chain); });
  chain.single = jest.fn().mockResolvedValue(result);
  supabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  jest.resetAllMocks();
  delete process.env.ONESIGNAL_APP_ID;
  delete process.env.ONESIGNAL_API_KEY;
  jest.resetModules();
  jest.mock('../config/supabase', () => ({ supabase: { from: jest.fn() } }));
  global.fetch = jest.fn();
});

// ─── sendPushNotification ──────────────────────────────────────────────────────

describe('sendPushNotification', () => {
  it('no-ops when ONESIGNAL_APP_ID is not set', async () => {
    const { sendPushNotification } = require('../services/onesignal.service');
    await sendPushNotification(['player_abc'], 'Hello', 'World');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('no-ops when playerIds is empty', async () => {
    process.env.ONESIGNAL_APP_ID = 'app_123';
    process.env.ONESIGNAL_API_KEY = 'key_abc';
    const { sendPushNotification } = require('../services/onesignal.service');
    await sendPushNotification([], 'Hello', 'World');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('POSTs to OneSignal API with correct payload', async () => {
    process.env.ONESIGNAL_APP_ID = 'app_123';
    process.env.ONESIGNAL_API_KEY = 'key_abc';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'notif_xyz' }),
    });

    const { sendPushNotification } = require('../services/onesignal.service');
    await sendPushNotification(['player_1', 'player_2'], 'Title', 'Body', { caseId: 'c1' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://onesignal.com/api/v1/notifications',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Basic key_abc' }),
      }),
    );
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toMatchObject({
      app_id: 'app_123',
      include_player_ids: ['player_1', 'player_2'],
      headings: { en: 'Title' },
      contents: { en: 'Body' },
      data: { caseId: 'c1' },
    });
  });

  it('logs error but does not throw when fetch fails', async () => {
    process.env.ONESIGNAL_APP_ID = 'app_123';
    process.env.ONESIGNAL_API_KEY = 'key_abc';
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { sendPushNotification } = require('../services/onesignal.service');
    await expect(sendPushNotification(['player_1'], 'Title', 'Body')).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ─── notifyUser ───────────────────────────────────────────────────────────────

describe('notifyUser', () => {
  it('skips notification when user has no push_token', async () => {
    const { supabase } = require('../config/supabase');
    buildChain(supabase, { data: { push_token: null }, error: null });

    const { notifyUser } = require('../services/onesignal.service');
    await notifyUser('u1', 'Title', 'Body');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends notification when user has a push_token', async () => {
    process.env.ONESIGNAL_APP_ID = 'app_123';
    process.env.ONESIGNAL_API_KEY = 'key_abc';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'n1' }),
    });

    const { supabase } = require('../config/supabase');
    buildChain(supabase, { data: { push_token: 'player_tok_abc' }, error: null });

    const { notifyUser } = require('../services/onesignal.service');
    await notifyUser('u1', 'Status Update', 'Your case was updated');
    expect(global.fetch).toHaveBeenCalled();
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.include_player_ids).toContain('player_tok_abc');
  });
});

// ─── notifyUser quiet hours (NH-1) ────────────────────────────────────────────

describe('notifyUser() quiet hours', () => {
  it('skips notification and returns { skipped } during quiet hours', async () => {
    const { isQuietHours } = require('../services/notification.utils');
    isQuietHours.mockResolvedValueOnce(true);

    const { supabase } = require('../config/supabase');
    buildChain(supabase, { data: { push_token: 'player_tok_abc' }, error: null });

    const { notifyUser } = require('../services/onesignal.service');
    const result = await notifyUser('u1', 'Title', 'Body');
    expect(result).toEqual({ skipped: 'quiet_hours' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends notification when quiet hours are not active', async () => {
    process.env.ONESIGNAL_APP_ID = 'app_123';
    process.env.ONESIGNAL_API_KEY = 'key_abc';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'n2' }),
    });

    const { isQuietHours } = require('../services/notification.utils');
    isQuietHours.mockResolvedValueOnce(false);

    const { supabase } = require('../config/supabase');
    buildChain(supabase, { data: { push_token: 'player_tok_xyz' }, error: null });

    const { notifyUser } = require('../services/onesignal.service');
    await notifyUser('u1', 'Alert', 'Everything is fine');
    expect(global.fetch).toHaveBeenCalled();
  });
});
