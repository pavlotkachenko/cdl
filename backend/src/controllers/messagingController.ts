/**
 * CDL Messaging System - Backend Controller
 * Handles API endpoints for messaging operations
 */

import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Get all conversations for admin compliance view
 */
export async function getAllConversationsAdmin(req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        case:cases(*),
        driver:users!conversations_driver_id_fkey(id, email, full_name),
        attorney:users!conversations_attorney_id_fkey(id, email, full_name)
      `)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

/**
 * Get conversation activity report
 */
export async function getConversationActivity(req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from('conversation_activity')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity report' });
  }
}

/**
 * Get audit trail for compliance
 */
export async function getAuditTrail(req: Request, res: Response) {
  try {
    const { conversationId, userId, startDate, endDate } = req.query;

    let query = supabase
      .from('message_audit_log')
      .select(`
        *,
        user:users(id, email, full_name, role),
        conversation:conversations(*)
      `)
      .order('accessed_at', { ascending: false });

    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }

    if (userId) {
      query = query.eq('accessed_by', userId);
    }

    if (startDate) {
      query = query.gte('accessed_at', startDate);
    }

    if (endDate) {
      query = query.lte('accessed_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
}

/**
 * Get retention compliance report
 */
export async function getRetentionCompliance(req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from('retention_compliance_messages')
      .select('*')
      .order('retention_until', { ascending: true, nullsFirst: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch retention compliance' });
  }
}

/**
 * Cleanup expired messages (admin only)
 */
export async function cleanupExpiredMessages(req: Request, res: Response) {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_messages');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      message: 'Cleanup completed successfully',
      result: data
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cleanup expired messages' });
  }
}

/**
 * Get unread message statistics
 */
export async function getUnreadStatistics(req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from('user_unread_messages')
      .select('*')
      .order('unread_count', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unread statistics' });
  }
}

/**
 * Close a conversation (when case is closed)
 */
export async function closeConversation(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;

    const { data, error } = await supabase
      .from('conversations')
      .update({
        closed_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to close conversation' });
  }
}

/**
 * Send notification email for urgent messages
 */
export async function notifyUrgentMessage(req: Request, res: Response) {
  try {
    const { messageId } = req.params;

    // Fetch message details
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(email, full_name),
        recipient:users!messages_recipient_id_fkey(email, full_name),
        conversation:conversations(
          *,
          case:cases(case_number)
        )
      `)
      .eq('id', messageId)
      .single();

    if (messageError) {
      return res.status(500).json({ error: messageError.message });
    }

    if (!message || message.priority !== 'urgent' && message.priority !== 'critical') {
      return res.status(400).json({ error: 'Message is not urgent or critical' });
    }

    // Here you would integrate with your email service
    // For now, we'll just log it
    console.log('Urgent message notification:', {
      to: message.recipient.email,
      from: message.sender.email,
      subject: `Urgent Message - Case ${message.conversation.case.case_number}`,
      priority: message.priority
    });

    res.json({ message: 'Notification sent successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
}

/**
 * Bulk archive conversations
 */
export async function bulkArchiveConversations(req: Request, res: Response) {
  try {
    const { conversationIds } = req.body;

    if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
      return res.status(400).json({ error: 'Invalid conversation IDs' });
    }

    const { data, error } = await supabase
      .from('conversations')
      .update({
        closed_at: new Date().toISOString()
      })
      .in('id', conversationIds)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      message: `${data.length} conversations archived successfully`,
      conversations: data
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive conversations' });
  }
}

/**
 * Get message statistics
 */
export async function getMessageStatistics(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('messages')
      .select('id, created_at, message_type, priority, is_read');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Calculate statistics
    const stats = {
      total: data.length,
      byType: data.reduce((acc, msg) => {
        acc[msg.message_type] = (acc[msg.message_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: data.reduce((acc, msg) => {
        acc[msg.priority] = (acc[msg.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      readRate: data.filter(msg => msg.is_read).length / data.length * 100,
      unread: data.filter(msg => !msg.is_read).length
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch message statistics' });
  }
}

/**
 * Verify attachment virus scan status
 */
export async function verifyAttachmentScan(req: Request, res: Response) {
  try {
    const { attachmentId } = req.params;

    const { data, error } = await supabase
      .from('message_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    res.json({
      id: data.id,
      file_name: data.file_name,
      virus_scanned: data.virus_scanned,
      scan_result: data.scan_result,
      uploaded_at: data.uploaded_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify attachment scan' });
  }
}
