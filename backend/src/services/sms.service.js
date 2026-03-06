/**
 * SMS Service — Twilio transactional messages
 * All functions are non-blocking: they catch errors, log, and never rethrow.
 * Guard every send with the TWILIO_ACCOUNT_SID env-var check.
 */

const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '';

let twilio = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Send a raw SMS message.
 * @param {{ to: string, body: string }} params
 */
const sendSms = async ({ to, body }) => {
  if (!twilio) {
    console.warn('[SmsService] Twilio not configured — skipping SMS');
    return;
  }
  if (!to) {
    console.warn('[SmsService] No phone number provided — skipping SMS');
    return;
  }
  try {
    await twilio.messages.create({ from: FROM_NUMBER, to, body });
  } catch (err) {
    console.error('[SmsService] Failed to send SMS:', err.message);
    // Non-blocking: do not rethrow
  }
};

/**
 * Send case submission confirmation SMS to driver.
 * @param {{ phone: string, caseNumber: string }} params
 */
const sendCaseSubmissionSms = async ({ phone, caseNumber }) => {
  await sendSms({
    to: phone,
    body: `CDL Ticket Management: Your case (Ref: ${caseNumber}) has been received. We'll assign a specialist shortly.`,
  });
};

/**
 * Send attorney-assigned notification SMS to driver.
 * @param {{ phone: string, attorneyName: string, caseNumber: string }} params
 */
const sendAttorneyAssignedSms = async ({ phone, attorneyName, caseNumber }) => {
  await sendSms({
    to: phone,
    body: `CDL Ticket Management: ${attorneyName} has been assigned to your case (Ref: ${caseNumber}). Check your case for details.`,
  });
};

/**
 * Send status change notification SMS to driver.
 * @param {{ phone: string, newStatus: string, caseNumber: string }} params
 */
const sendStatusChangeSms = async ({ phone, newStatus, caseNumber }) => {
  const label = newStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  await sendSms({
    to: phone,
    body: `CDL Ticket Management: Your case (Ref: ${caseNumber}) status updated to "${label}".`,
  });
};

module.exports = {
  sendSms,
  sendCaseSubmissionSms,
  sendAttorneyAssignedSms,
  sendStatusChangeSms,
};
