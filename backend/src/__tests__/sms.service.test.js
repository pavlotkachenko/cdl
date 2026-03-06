/**
 * Tests for sms.service.js — SM-1
 *
 * Twilio is mocked so no real HTTP calls are made.
 */

const mockCreate = jest.fn();

jest.mock('twilio', () =>
  jest.fn(() => ({
    messages: { create: mockCreate },
  })),
);

// Ensure env vars are set BEFORE the service module is required
// so the module-level `twilio` instance is initialised.
process.env.TWILIO_ACCOUNT_SID = 'ACtest';
process.env.TWILIO_AUTH_TOKEN   = 'authtest';
process.env.TWILIO_FROM_NUMBER  = '+10000000000';

jest.mock('../services/notification.utils', () => ({
  isQuietHours: jest.fn().mockResolvedValue(false),
}));

const {
  sendSms,
  sendCaseSubmissionSms,
  sendAttorneyAssignedSms,
  sendStatusChangeSms,
  sendPaymentReminderSms,
} = require('../services/sms.service');
const { isQuietHours } = require('../services/notification.utils');

beforeEach(() => {
  jest.resetAllMocks();
  mockCreate.mockResolvedValue({ sid: 'SM123' });
});

describe('sendSms()', () => {
  it('calls twilio.messages.create with correct params', async () => {
    await sendSms({ to: '+15555551234', body: 'Hello!' });
    expect(mockCreate).toHaveBeenCalledWith({
      from: '+10000000000',
      to: '+15555551234',
      body: 'Hello!',
    });
  });

  it('skips send when no phone number is provided', async () => {
    await sendSms({ to: '', body: 'Hello' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('does not throw when twilio.messages.create rejects', async () => {
    mockCreate.mockRejectedValue(new Error('Twilio error'));
    await expect(sendSms({ to: '+15555551234', body: 'Hi' })).resolves.not.toThrow();
  });
});

describe('sendCaseSubmissionSms()', () => {
  it('sends submission confirmation with correct body', async () => {
    await sendCaseSubmissionSms({ phone: '+15555551234', caseNumber: 'CASE-001' });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+15555551234',
        body: expect.stringContaining('CASE-001'),
      }),
    );
  });
});

describe('sendAttorneyAssignedSms()', () => {
  it('sends attorney assignment SMS including attorney name', async () => {
    await sendAttorneyAssignedSms({
      phone: '+15555551234',
      attorneyName: 'Jane Smith',
      caseNumber: 'CASE-001',
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('Jane Smith'),
      }),
    );
  });

  it('includes case number in attorney assigned SMS', async () => {
    await sendAttorneyAssignedSms({
      phone: '+15555551234',
      attorneyName: 'John Doe',
      caseNumber: 'CASE-099',
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('CASE-099'),
      }),
    );
  });
});

describe('sendStatusChangeSms()', () => {
  it('sends status change SMS with humanized status label', async () => {
    await sendStatusChangeSms({
      phone: '+15555551234',
      newStatus: 'assigned_to_attorney',
      caseNumber: 'CASE-002',
    });
    const body = mockCreate.mock.calls[0][0].body;
    expect(body).toContain('Assigned To Attorney');
  });

  it('includes case number in status change SMS', async () => {
    await sendStatusChangeSms({
      phone: '+15555551234',
      newStatus: 'closed',
      caseNumber: 'CASE-003',
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('CASE-003'),
      }),
    );
  });
});

// ── Quiet hours (NH-1) ────────────────────────────────────────────────────────

describe('sendSms() quiet hours', () => {
  it('skips send and returns { skipped } when quiet hours active', async () => {
    isQuietHours.mockResolvedValueOnce(true);
    const result = await sendSms({ to: '+15555551234', body: 'Hello', userId: 'u-1' });
    expect(result).toEqual({ skipped: 'quiet_hours' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('sends normally when userId provided but not quiet hours', async () => {
    isQuietHours.mockResolvedValueOnce(false);
    await sendSms({ to: '+15555551234', body: 'Hello', userId: 'u-1' });
    expect(mockCreate).toHaveBeenCalled();
  });

  it('sends normally when no userId provided (no quiet hours check)', async () => {
    await sendSms({ to: '+15555551234', body: 'Hello' });
    expect(isQuietHours).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalled();
  });
});

// ── sendPaymentReminderSms (PP-3) ─────────────────────────────────────────────

describe('sendPaymentReminderSms()', () => {
  it('sends reminder SMS including amount and due date', async () => {
    await sendPaymentReminderSms({
      phone: '+15555551234',
      amount: 125.00,
      dueDate: '2025-02-15',
      installmentNum: 2,
      totalInstallments: 4,
    });
    const body = mockCreate.mock.calls[0][0].body;
    expect(body).toContain('125');
    expect(body).toContain('2025-02-15');
  });

  it('includes installment progress in reminder SMS', async () => {
    await sendPaymentReminderSms({
      phone: '+15555551234',
      amount: 50.00,
      dueDate: '2025-03-01',
      installmentNum: 1,
      totalInstallments: 2,
    });
    const body = mockCreate.mock.calls[0][0].body;
    expect(body).toMatch(/1.*(of|\/|out of).*2/i);
  });
});
