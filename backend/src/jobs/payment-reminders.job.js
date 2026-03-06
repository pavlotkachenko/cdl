/**
 * Payment Reminders Cron Job
 * Runs daily at 9:00 AM UTC.
 * Sends SMS reminders for installments due in 2 days.
 */

const cron = require('node-cron');
const { supabase } = require('../config/supabase');
const smsService = require('../services/sms.service');

const sendPaymentReminders = async () => {
  try {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const targetDate = twoDaysFromNow.toISOString().slice(0, 10);

    // Find pending installments due in exactly 2 days with no reminder sent
    const { data: installments, error } = await supabase
      .from('case_installment_schedule')
      .select(`
        id, installment_num, amount, due_date,
        plan:case_installment_plans(id, weeks, user_id)
      `)
      .eq('due_date', targetDate)
      .eq('status', 'pending')
      .eq('reminder_sent', false);

    if (error) {
      console.error('[PaymentRemindersJob] Query error:', error.message);
      return;
    }

    if (!installments || installments.length === 0) {
      console.info('[PaymentRemindersJob] No reminders to send today.');
      return;
    }

    for (const installment of installments) {
      try {
        const userId = installment.plan?.user_id;
        if (!userId) continue;

        // Fetch user's phone number
        const { data: user } = await supabase
          .from('users')
          .select('phone')
          .eq('id', userId)
          .single();

        if (!user?.phone) continue;

        await smsService.sendPaymentReminderSms({
          phone: user.phone,
          amount: parseFloat(installment.amount),
          dueDate: installment.due_date,
          installmentNum: installment.installment_num,
          totalInstallments: installment.plan?.weeks ?? 0,
        });

        // Mark reminder sent
        await supabase
          .from('case_installment_schedule')
          .update({ reminder_sent: true })
          .eq('id', installment.id);

        console.info(`[PaymentRemindersJob] Reminder sent for installment ${installment.id}`);
      } catch (err) {
        console.error(`[PaymentRemindersJob] Failed for installment ${installment.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[PaymentRemindersJob] Unexpected error:', err.message);
  }
};

const startPaymentRemindersJob = () => {
  // Run daily at 9:00 AM UTC
  cron.schedule('0 9 * * *', sendPaymentReminders, { timezone: 'UTC' });
  console.info('[PaymentRemindersJob] Scheduled: daily at 09:00 UTC');
};

module.exports = { startPaymentRemindersJob, sendPaymentReminders };
