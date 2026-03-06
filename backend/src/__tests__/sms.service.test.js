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

const {
  sendSms,
  sendCaseSubmissionSms,
  sendAttorneyAssignedSms,
  sendStatusChangeSms,
} = require('../services/sms.service');

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
