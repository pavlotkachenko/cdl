/**
 * Tests for notification.service.js — Sprint 051 / OC-6
 */
jest.mock('../config/supabase', () => ({ supabase: { from: jest.fn() } }));
const { supabase } = require('../config/supabase');
const notificationService = require('../services/notification.service');

let chain;

function buildChain(result = { data: [], error: null }) {
  chain = {};
  ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'order', 'range', 'limit', 'single', 'maybeSingle'].forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  chain.catch = (onRejected) => Promise.resolve(result).catch(onRejected);
  supabase.from.mockReturnValue(chain);
}

beforeEach(() => {
  jest.resetAllMocks();
  buildChain();
});

describe('notification.service', () => {
  describe('getUserNotifications', () => {
    test('returns notifications with pagination', async () => {
      buildChain({ data: [{ id: 'n1', title: 'Test' }], error: null, count: 1 });
      const result = await notificationService.getUserNotifications('u1', 1, 20, false);
      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(chain.range).toHaveBeenCalledWith(0, 19);
    });

    test('filters unread only when requested', async () => {
      buildChain({ data: [], error: null, count: 0 });
      await notificationService.getUserNotifications('u1', 1, 10, true);
      // eq is called for user_id AND read=false
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(chain.eq).toHaveBeenCalledWith('read', false);
    });

    test('throws on supabase error', async () => {
      buildChain({ data: null, error: { message: 'DB error' }, count: null });
      await expect(notificationService.getUserNotifications('u1')).rejects.toEqual({ message: 'DB error' });
    });
  });

  describe('getUnreadCount', () => {
    test('returns count of unread notifications', async () => {
      buildChain({ count: 5, error: null });
      // Override select to return count format
      chain.select = jest.fn().mockReturnValue(chain);
      chain.then = (onFulfilled) => Promise.resolve({ count: 5, error: null }).then(onFulfilled);
      const count = await notificationService.getUnreadCount('u1');
      expect(count).toBe(5);
    });
  });

  describe('markAsRead', () => {
    test('updates notification read status', async () => {
      buildChain({ error: null });
      await notificationService.markAsRead('n1', 'u1');
      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(chain.update).toHaveBeenCalledWith({ read: true });
      expect(chain.eq).toHaveBeenCalledWith('id', 'n1');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
    });
  });

  describe('markAllAsRead', () => {
    test('marks all unread as read for user', async () => {
      buildChain({ error: null });
      await notificationService.markAllAsRead('u1');
      expect(chain.update).toHaveBeenCalledWith({ read: true });
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(chain.eq).toHaveBeenCalledWith('read', false);
    });
  });

  describe('createNotification', () => {
    test('inserts notification and returns data', async () => {
      const notifData = { id: 'n-new', title: 'Test', user_id: 'u1' };
      chain.single = jest.fn().mockResolvedValue({ data: notifData, error: null });
      const result = await notificationService.createNotification({
        userId: 'u1',
        caseId: 'c1',
        title: 'Test',
        message: 'Hello',
        type: 'case_update',
      });
      expect(result).toEqual(notifData);
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'u1', case_id: 'c1', title: 'Test', type: 'case_update' }),
      );
    });
  });
});
