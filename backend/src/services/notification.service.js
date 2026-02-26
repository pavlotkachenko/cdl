// ============================================
// NOTIFICATION SERVICE
// Multi-channel notification system (Email, SMS, In-App, WebSocket)
// ============================================

const { supabase } = require('../config/supabase');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio
let twilioClient;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

/**
 * Send notification through multiple channels
 * @param {String} userId - User ID
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} data - Additional data
 * @param {Array} channels - Channels to send through ['email', 'sms', 'in_app', 'push']
 */
const sendNotification = async (userId, type, title, message, data = {}, channels = ['in_app']) => {
  try {
    // Get user details and preferences
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, phone, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found for notification:', userId);
      return;
    }

    // Get user notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId);

    const userPrefs = preferences || [];

    // Create in-app notification
    if (channels.includes('in_app')) {
      await createInAppNotification(userId, type, title, message, data);
    }

    // Send email notification
    if (channels.includes('email') && isChannelEnabled(userPrefs, 'email')) {
      await sendEmailNotification(user.email, user.full_name, type, title, message, data);
    }

    // Send SMS notification
    if (channels.includes('sms') && isChannelEnabled(userPrefs, 'sms') && user.phone) {
      await sendSMSNotification(user.phone, message);
    }

    // Send WebSocket notification (real-time)
    if (channels.includes('websocket')) {
      await sendWebSocketNotification(userId, type, title, message, data);
    }

    console.log(`Notification sent to user ${userId} via channels: ${channels.join(', ')}`);

  } catch (error) {
    console.error('Send notification error:', error);
    throw error;
  }
};

/**
 * Create in-app notification
 */
const createInAppNotification = async (userId, type, title, message, data) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        is_read: false
      });

    if (error) {
      console.error('Create in-app notification error:', error);
    }
  } catch (error) {
    console.error('In-app notification error:', error);
  }
};

/**
 * Send email notification via SendGrid
 */
const sendEmailNotification = async (email, fullName, type, title, message, data) => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid not configured, skipping email notification');
      return;
    }

    const emailData = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@cdlplatform.com',
      subject: title,
      html: generateEmailHTML(fullName, title, message, data, type)
    };

    await sgMail.send(emailData);
    console.log(`Email sent to ${email}`);

  } catch (error) {
    console.error('SendGrid email error:', error);
  }
};

/**
 * Send SMS notification via Twilio
 */
const sendSMSNotification = async (phone, message) => {
  try {
    if (!twilioClient) {
      console.warn('Twilio not configured, skipping SMS notification');
      return;
    }

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    console.log(`SMS sent to ${phone}`);

  } catch (error) {
    console.error('Twilio SMS error:', error);
  }
};

/**
 * Send WebSocket notification (real-time)
 */
const sendWebSocketNotification = async (userId, type, title, message, data) => {
  try {
    // This will be handled by Socket.io integration
    // The socket.io server will emit to the specific user
    const io = global.io;
    
    if (io) {
      io.to(`user:${userId}`).emit('notification', {
        type,
        title,
        message,
        data,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('WebSocket notification error:', error);
  }
};

/**
 * Check if notification channel is enabled for user
 */
const isChannelEnabled = (preferences, channel) => {
  const pref = preferences.find(p => p.channel === channel);
  return pref ? pref.enabled : true; // Default to enabled
};

/**
 * Generate HTML email template
 */
const generateEmailHTML = (fullName, title, message, data, type) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>CDL Platform</h1>
      </div>
      <div class="content">
        <h2>Hello ${fullName},</h2>
        <p>${message}</p>
        ${data.actionUrl ? `<a href="${data.actionUrl}" class="button">View Details</a>` : ''}
      </div>
      <div class="footer">
        <p>© 2024 CDL Platform. All rights reserved.</p>
        <p>This is an automated notification. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Get user notifications with pagination
 */
const getUserNotifications = async (userId, page = 1, limit = 20, unreadOnly = false) => {
  try {
    const offset = (page - 1) * limit;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      notifications: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };

  } catch (error) {
    console.error('Get notifications error:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;

  } catch (error) {
    console.error('Mark as read error:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

  } catch (error) {
    console.error('Mark all as read error:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    return count || 0;

  } catch (error) {
    console.error('Get unread count error:', error);
    throw error;
  }
};

/**
 * Update user notification preferences
 */
const updatePreferences = async (userId, channel, enabled, quietHoursStart = null, quietHoursEnd = null) => {
  try {
    // Check if preference exists
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('channel', channel)
      .single();

    if (existing) {
      // Update existing preference
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          enabled,
          quiet_hours_start: quietHoursStart,
          quiet_hours_end: quietHoursEnd
        })
        .eq('user_id', userId)
        .eq('channel', channel);

      if (error) throw error;
    } else {
      // Insert new preference
      const { error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          channel,
          enabled,
          quiet_hours_start: quietHoursStart,
          quiet_hours_end: quietHoursEnd
        });

      if (error) throw error;
    }

  } catch (error) {
    console.error('Update preferences error:', error);
    throw error;
  }
};

/**
 * Get user notification preferences
 */
const getPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('Get preferences error:', error);
    throw error;
  }
};

/**
 * Send notification when case status changes
 */
const notifyCaseStatusChange = async (caseId, newStatus, userId) => {
  try {
    await sendNotification(
      userId,
      'case_status_change',
      'Case Status Updated',
      `Your case #${caseId} status has been updated to: ${newStatus}`,
      { caseId, newStatus },
      ['in_app', 'email', 'websocket']
    );
  } catch (error) {
    console.error('Case status notification error:', error);
  }
};

/**
 * Send notification when case is assigned
 */
const notifyCaseAssignment = async (caseId, assignedToUserId, assignedByUserId) => {
  try {
    await sendNotification(
      assignedToUserId,
      'case_assignment',
      'New Case Assigned',
      `A new case #${caseId} has been assigned to you`,
      { caseId, assignedByUserId },
      ['in_app', 'email', 'websocket']
    );
  } catch (error) {
    console.error('Case assignment notification error:', error);
  }
};

/**
 * Send notification for new message
 */
const notifyNewMessage = async (messageId, recipientUserId, senderName) => {
  try {
    await sendNotification(
      recipientUserId,
      'new_message',
      'New Message Received',
      `You have a new message from ${senderName}`,
      { messageId },
      ['in_app', 'websocket']
    );
  } catch (error) {
    console.error('New message notification error:', error);
  }
};

module.exports = {
  sendNotification,
  createInAppNotification,
  sendEmailNotification,
  sendSMSNotification,
  sendWebSocketNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  updatePreferences,
  getPreferences,
  notifyCaseStatusChange,
  notifyCaseAssignment,
  notifyNewMessage
};
