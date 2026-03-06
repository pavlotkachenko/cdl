/**
 * Tests for EmailService — registration email
 */

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

const sgMail = require('@sendgrid/mail');

describe('email.service', () => {
  let sendRegistrationEmail;
  let sendCaseSubmissionEmail;
  let sendAttorneyAssignmentEmail;

  beforeAll(() => {
    process.env.SENDGRID_API_KEY = 'SG.test-key';
    process.env.APP_URL = 'https://app.test';
    // Re-require after env vars are set so sgMail.setApiKey is called
    ({ sendRegistrationEmail, sendCaseSubmissionEmail, sendAttorneyAssignmentEmail } =
      require('../services/email.service'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Guarantee API key is set before each test (skip tests use try/finally to restore)
    process.env.SENDGRID_API_KEY = 'SG.test-key';
    // Restore default send implementation (clearAllMocks keeps implementation, but be explicit)
    sgMail.send.mockResolvedValue([{ statusCode: 202 }]);
  });

  it('sends driver welcome email with submit-ticket CTA', async () => {
    await sendRegistrationEmail({ name: 'John Doe', email: 'john@test.com', role: 'driver' });

    expect(sgMail.send).toHaveBeenCalledTimes(1);
    const [msg] = sgMail.send.mock.calls[0];
    expect(msg.to).toBe('john@test.com');
    expect(msg.subject).toContain('John Doe');
    expect(msg.html).toContain('Submit Your First Ticket');
    expect(msg.html).toContain('/driver/submit-ticket');
  });

  it('sends carrier welcome email with add-driver CTA', async () => {
    await sendRegistrationEmail({ name: 'Acme Trucking', email: 'fleet@acme.com', role: 'carrier' });

    expect(sgMail.send).toHaveBeenCalledTimes(1);
    const [msg] = sgMail.send.mock.calls[0];
    expect(msg.to).toBe('fleet@acme.com');
    expect(msg.html).toContain('Add Your First Driver');
    expect(msg.html).toContain('/carrier/dashboard');
  });

  it('does not throw when SendGrid fails', async () => {
    sgMail.send.mockRejectedValueOnce(new Error('network error'));
    await expect(
      sendRegistrationEmail({ name: 'Jane', email: 'jane@test.com', role: 'driver' })
    ).resolves.toBeUndefined();
  });

  it('skips sending when SENDGRID_API_KEY is not set', async () => {
    const saved = process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_API_KEY;
    try {
      await sendRegistrationEmail({ name: 'No Key', email: 'no@key.com', role: 'driver' });
      expect(sgMail.send).not.toHaveBeenCalled();
    } finally {
      process.env.SENDGRID_API_KEY = saved;
    }
  });

  // ------------------------------------------------------------------
  // sendCaseSubmissionEmail
  // ------------------------------------------------------------------
  it('sends case submission email with case reference', async () => {
    await sendCaseSubmissionEmail({
      name: 'Mike Driver',
      email: 'mike@test.com',
      caseId: 'case-123',
      caseNumber: 'CDL-001',
    });
    expect(sgMail.send).toHaveBeenCalledTimes(1);
    const [msg] = sgMail.send.mock.calls[0];
    expect(msg.to).toBe('mike@test.com');
    expect(msg.subject).toContain('Case Received');
    expect(msg.html).toContain('CDL-001');
    expect(msg.html).toContain('/driver/tickets/case-123');
  });

  it('uses caseId as ref when caseNumber is absent', async () => {
    await sendCaseSubmissionEmail({ name: 'Jane', email: 'jane@test.com', caseId: 'uuid-abc' });
    const [msg] = sgMail.send.mock.calls[0];
    expect(msg.html).toContain('uuid-abc');
  });

  it('sendCaseSubmissionEmail does not throw when SendGrid fails', async () => {
    sgMail.send.mockRejectedValueOnce(new Error('network'));
    await expect(
      sendCaseSubmissionEmail({ name: 'X', email: 'x@test.com', caseId: 'c1' })
    ).resolves.toBeUndefined();
  });

  it('sendCaseSubmissionEmail skips when API key not set', async () => {
    const saved = process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_API_KEY;
    try {
      await sendCaseSubmissionEmail({ name: 'X', email: 'x@test.com', caseId: 'c1' });
      expect(sgMail.send).not.toHaveBeenCalled();
    } finally {
      process.env.SENDGRID_API_KEY = saved;
    }
  });

  // ------------------------------------------------------------------
  // sendAttorneyAssignmentEmail
  // ------------------------------------------------------------------
  it('sends attorney assignment email with case reference and driver name', async () => {
    await sendAttorneyAssignmentEmail({
      name: 'Sarah Attorney',
      email: 'sarah@law.com',
      caseId: 'case-456',
      caseNumber: 'CDL-002',
      driverName: 'Miguel Rosario',
    });
    expect(sgMail.send).toHaveBeenCalledTimes(1);
    const [msg] = sgMail.send.mock.calls[0];
    expect(msg.to).toBe('sarah@law.com');
    expect(msg.subject).toContain('New Case Assignment');
    expect(msg.html).toContain('CDL-002');
    expect(msg.html).toContain('Miguel Rosario');
    expect(msg.html).toContain('/attorney/cases/case-456');
  });

  it('sends attorney assignment email without driverName gracefully', async () => {
    await sendAttorneyAssignmentEmail({ name: 'Jim', email: 'jim@law.com', caseId: 'c2' });
    expect(sgMail.send).toHaveBeenCalledTimes(1);
  });

  it('sendAttorneyAssignmentEmail does not throw when SendGrid fails', async () => {
    sgMail.send.mockRejectedValueOnce(new Error('timeout'));
    await expect(
      sendAttorneyAssignmentEmail({ name: 'A', email: 'a@law.com', caseId: 'c3' })
    ).resolves.toBeUndefined();
  });

  it('sendAttorneyAssignmentEmail skips when API key not set', async () => {
    const saved = process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_API_KEY;
    try {
      await sendAttorneyAssignmentEmail({ name: 'A', email: 'a@law.com', caseId: 'c3' });
      expect(sgMail.send).not.toHaveBeenCalled();
    } finally {
      process.env.SENDGRID_API_KEY = saved;
    }
  });
});
