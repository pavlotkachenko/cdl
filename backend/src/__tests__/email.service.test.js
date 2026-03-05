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

  beforeAll(() => {
    process.env.SENDGRID_API_KEY = 'SG.test-key';
    process.env.APP_URL = 'https://app.test';
    // Re-require after env vars are set so sgMail.setApiKey is called
    ({ sendRegistrationEmail } = require('../services/email.service'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
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
    delete process.env.SENDGRID_API_KEY;
    const { sendRegistrationEmail: fn } = jest.isolateModules(() =>
      require('../services/email.service')
    );
    await fn({ name: 'No Key', email: 'no@key.com', role: 'driver' });
    expect(sgMail.send).not.toHaveBeenCalled();
    process.env.SENDGRID_API_KEY = 'SG.test-key';
  });
});
