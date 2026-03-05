/**
 * Email Service — SendGrid transactional emails
 * Location: backend/src/services/email.service.js
 */

const sgMail = require('@sendgrid/mail');

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@cdlticketmanagement.com';
const APP_URL = process.env.APP_URL || 'https://cdlticketmanagement.com';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Send registration confirmation email.
 * Non-blocking: resolves even if SendGrid is unavailable.
 *
 * @param {{ name: string, email: string, role: 'driver' | 'carrier' }} user
 * @returns {Promise<void>}
 */
const sendRegistrationEmail = async ({ name, email, role }) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[EmailService] SENDGRID_API_KEY not set — skipping registration email');
    return;
  }

  const isCarrier = role === 'carrier';
  const ctaUrl = isCarrier
    ? `${APP_URL}/carrier/dashboard`
    : `${APP_URL}/driver/submit-ticket`;
  const ctaLabel = isCarrier ? 'Add Your First Driver' : 'Submit Your First Ticket';
  const roleLabel = isCarrier ? 'Carrier' : 'Driver';

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: `Welcome to CDL Ticket Management, ${name}!`,
    text: [
      `Hi ${name},`,
      '',
      `Welcome to CDL Ticket Management! Your ${roleLabel} account has been created.`,
      '',
      `Get started: ${ctaUrl}`,
      '',
      'If you have any questions, reply to this email.',
      '',
      '— The CDL Ticket Management Team',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Welcome to CDL Ticket Management!</h2>
        <p>Hi ${name},</p>
        <p>Your <strong>${roleLabel}</strong> account has been successfully created.</p>
        <p style="margin: 32px 0;">
          <a href="${ctaUrl}"
             style="background-color: #1976d2; color: #ffffff; padding: 12px 24px;
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            ${ctaLabel}
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          If you have any questions, reply to this email or contact our support team.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        <p style="color: #999; font-size: 12px;">CDL Ticket Management — Protecting CDL Drivers Nationwide</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error('[EmailService] Failed to send registration email:', err?.response?.body || err.message);
    // Non-blocking: do not rethrow
  }
};

/**
 * Send payment confirmation email.
 *
 * @param {{ name: string, email: string, amount: number, caseId: string, last4?: string, transactionId?: string }} params
 * @returns {Promise<void>}
 */
const sendPaymentConfirmationEmail = async ({ name, email, amount, caseId, last4, transactionId }) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[EmailService] SENDGRID_API_KEY not set — skipping payment email');
    return;
  }

  const caseUrl = `${APP_URL}/driver/tickets/${caseId}`;
  const formattedAmount = (amount / 100).toFixed(2);
  const cardLine = last4 ? `<p>Card: ending in <strong>${last4}</strong></p>` : '';
  const txLine = transactionId ? `<p style="color:#666; font-size:12px;">Transaction ID: ${transactionId}</p>` : '';

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: 'Payment Confirmed — CDL Ticket Management',
    text: [
      `Hi ${name},`,
      '',
      `Your payment of $${formattedAmount} has been confirmed.`,
      last4 ? `Card ending in: ${last4}` : '',
      transactionId ? `Transaction ID: ${transactionId}` : '',
      '',
      `View your case: ${caseUrl}`,
      '',
      '— The CDL Ticket Management Team',
    ].filter(Boolean).join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Payment Confirmed</h2>
        <p>Hi ${name},</p>
        <p>Your payment of <strong>$${formattedAmount}</strong> has been successfully processed.</p>
        ${cardLine}
        ${txLine}
        <p style="margin: 32px 0;">
          <a href="${caseUrl}"
             style="background-color: #1976d2; color: #ffffff; padding: 12px 24px;
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            View Your Case
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        <p style="color: #999; font-size: 12px;">CDL Ticket Management — Protecting CDL Drivers Nationwide</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error('[EmailService] Failed to send payment email:', err?.response?.body || err.message);
  }
};

/**
 * Send case status change email.
 *
 * @param {{ name: string, email: string, caseId: string, newStatus: string }} params
 * @returns {Promise<void>}
 */
const sendCaseStatusEmail = async ({ name, email, caseId, newStatus }) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[EmailService] SENDGRID_API_KEY not set — skipping status email');
    return;
  }

  const caseUrl = `${APP_URL}/driver/tickets/${caseId}`;
  const statusLabel = newStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: `Case Update: ${statusLabel} — CDL Ticket Management`,
    text: [
      `Hi ${name},`,
      '',
      `Your case status has been updated to: ${statusLabel}`,
      '',
      `View your case: ${caseUrl}`,
      '',
      '— The CDL Ticket Management Team',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Case Status Update</h2>
        <p>Hi ${name},</p>
        <p>Your case status has been updated to: <strong>${statusLabel}</strong></p>
        <p style="margin: 32px 0;">
          <a href="${caseUrl}"
             style="background-color: #1976d2; color: #ffffff; padding: 12px 24px;
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            View Your Case
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        <p style="color: #999; font-size: 12px;">CDL Ticket Management — Protecting CDL Drivers Nationwide</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error('[EmailService] Failed to send status email:', err?.response?.body || err.message);
  }
};

module.exports = {
  sendRegistrationEmail,
  sendPaymentConfirmationEmail,
  sendCaseStatusEmail,
};
