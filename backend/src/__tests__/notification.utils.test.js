/**
 * Tests for notification.utils.js — NH-1
 */

jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

const { supabase } = require('../config/supabase');
const { isQuietHours } = require('../services/notification.utils');

const setUTCTime = (hour, minute = 0) => {
  jest.useFakeTimers();
  const d = new Date();
  d.setUTCHours(hour, minute, 0, 0);
  jest.setSystemTime(d);
};

// Restore chain stubs after each reset so downstream describe blocks aren't broken
const restoreChain = () => {
  supabase.from.mockReturnThis();
  supabase.select.mockReturnThis();
  supabase.eq.mockReturnThis();
};

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
  restoreChain();
});

describe('isQuietHours() — default 21:00–08:00', () => {
  beforeEach(() => {
    supabase.single.mockResolvedValue({ data: null }); // no preferences
  });

  it('returns true at 22:00 UTC (inside overnight window)', async () => {
    setUTCTime(22);
    expect(await isQuietHours(null)).toBe(true);
  });

  it('returns true at 00:00 UTC (midnight, inside overnight window)', async () => {
    setUTCTime(0);
    expect(await isQuietHours(null)).toBe(true);
  });

  it('returns true at 07:59 UTC (still inside window before end)', async () => {
    setUTCTime(7, 59);
    expect(await isQuietHours(null)).toBe(true);
  });

  it('returns false at 12:00 UTC (noon, outside window)', async () => {
    setUTCTime(12);
    expect(await isQuietHours(null)).toBe(false);
  });

  it('returns false at 09:00 UTC (just after window ends)', async () => {
    setUTCTime(9);
    expect(await isQuietHours(null)).toBe(false);
  });
});

describe('isQuietHours() — custom preferences', () => {
  it('respects custom quiet_hours_start and quiet_hours_end', async () => {
    supabase.single.mockResolvedValue({
      data: { quiet_hours_start: '22:00', quiet_hours_end: '07:00' },
    });
    setUTCTime(23); // inside 22:00–07:00
    expect(await isQuietHours('user-123')).toBe(true);
  });

  it('returns false when time is outside custom window', async () => {
    supabase.single.mockResolvedValue({
      data: { quiet_hours_start: '22:00', quiet_hours_end: '07:00' },
    });
    setUTCTime(10); // outside 22:00–07:00
    expect(await isQuietHours('user-123')).toBe(false);
  });
});

describe('isQuietHours() — failure resilience', () => {
  it('returns false (fail open) when Supabase throws', async () => {
    supabase.single.mockRejectedValue(new Error('DB error'));
    setUTCTime(22);
    expect(await isQuietHours('user-bad')).toBe(false);
  });
});
