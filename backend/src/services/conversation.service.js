// ============================================
// CONVERSATION SERVICE
// Database operations for conversations
// ============================================

const { supabase } = require('../config/supabase');
const { AppError } = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all conversations for a user
 */
const getUserConversations = async (userId, limit = 20, offset = 0) => {
  try {
    // Get conversations where user is either driver or attorney
    const { data: conversations, error, count } = await supabase
      .from('conversations')
      .select(`
        *,
        driver:users!driver_id(id, name, email, avatar_url),
        attorney:users!attorney_id(id, name, email, avatar_url),
        case:cases(id, case_number, status)
      `, { count: 'exact' })
      .or(`driver_id.eq.${userId},attorney_id.eq.${userId}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(`Database error: ${error.message}`, 500);
    }

    return {
      conversations: conversations || [],
      total: count || 0
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch conversations', 500);
  }
};

/**
 * Get conversation by ID
 */
const getConversationById = async (conversationId, userId) => {
  try {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        *,
        driver:users!driver_id(id, name, email, avatar_url),
        attorney:users!attorney_id(id, name, email, avatar_url),
        case:cases(id, case_number, status, ticket_number)
      `)
      .eq('id', conversationId)
      .or(`driver_id.eq.${userId},attorney_id.eq.${userId}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError('Conversation not found', 404);
      }
      throw new AppError(`Database error: ${error.message}`, 500);
    }

    // Update accessed_by array
    if (conversation) {
      await supabase
        .from('conversations')
        .update({ 
          accessed_by: supabase.raw(`array_append(accessed_by, '${userId}')`)
        })
        .eq('id', conversationId);
    }

    return conversation;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch conversation', 500);
  }
};

/**
 * Create new conversation
 */
const createConversation = async ({ caseId, driverId, attorneyId }) => {
  try {
    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('case_id', caseId)
      .eq('driver_id', driverId)
      .eq('attorney_id', attorneyId)
      .single();

    if (existing) {
      throw new AppError('Conversation already exists for this case', 400);
    }

    // Verify case exists and driver is authorized
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id, driver_id, assigned_attorney_id, status')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      throw new AppError('Case not found', 404);
    }

    if (caseData.driver_id !== driverId) {
      throw new AppError('Unauthorized to create conversation for this case', 403);
    }

    if (caseData.assigned_attorney_id !== attorneyId) {
      throw new AppError('Attorney not assigned to this case', 400);
    }

    if (caseData.status === 'closed') {
      throw new AppError('Cannot create conversation for closed case', 400);
    }

    // Calculate retention date (7 years from now)
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() + 7);

    // Create conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert([{
        case_id: caseId,
        driver_id: driverId,
        attorney_id: attorneyId,
        retention_until: retentionDate.toISOString(),
        accessed_by: [driverId]
      }])
      .select(`
        *,
        driver:users!driver_id(id, name, email),
        attorney:users!attorney_id(id, name, email),
        case:cases(id, case_number)
      `)
      .single();

    if (error) {
      throw new AppError(`Failed to create conversation: ${error.message}`, 500);
    }

    return conversation;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create conversation', 500);
  }
};

/**
 * Delete conversation
 */
const deleteConversation = async (conversationId, userId) => {
  try {
    // Verify user has permission to delete
    const { data: conversation } = await supabase
      .from('conversations')
      .select('driver_id, attorney_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (conversation.driver_id !== userId && conversation.attorney_id !== userId) {
      throw new AppError('Unauthorized to delete this conversation', 403);
    }

    // Delete conversation (messages will cascade delete)
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      throw new AppError(`Failed to delete conversation: ${error.message}`, 500);
    }

    return true;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete conversation', 500);
  }
};

/**
 * Generate video call link
 */
const generateVideoLink = async (conversationId, attorneyId) => {
  try {
    // Verify conversation exists and attorney is participant
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, attorney_id')
      .eq('id', conversationId)
      .eq('attorney_id', attorneyId)
      .single();

    if (!conversation) {
      throw new AppError('Conversation not found or unauthorized', 404);
    }

    // Generate unique video link (expires in 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const videoUrl = `${process.env.VIDEO_CALL_BASE_URL || 'https://meet.example.com'}/${uuidv4()}`;

    const { data: videoLink, error } = await supabase
      .from('video_call_links')
      .insert([{
        conversation_id: conversationId,
        generated_by: attorneyId,
        video_url: videoUrl,
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to generate video link: ${error.message}`, 500);
    }

    return videoLink;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to generate video link', 500);
  }
};

/**
 * Get all messages for a conversation
 */
const getConversationMessages = async (conversationId, userId, limit = 50, offset = 0) => {
  try {
    // Verify user has access to conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('driver_id, attorney_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (conversation.driver_id !== userId && conversation.attorney_id !== userId) {
      throw new AppError('Unauthorized to view this conversation', 403);
    }

    // Get messages
    const { data: messages, error, count } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(id, name, email, avatar_url),
        recipient:users!recipient_id(id, name, email),
        attachments:message_attachments(*)
      `, { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(`Database error: ${error.message}`, 500);
    }

    return {
      messages: messages || [],
      total: count || 0
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch messages', 500);
  }
};

module.exports = {
  getUserConversations,
  getConversationById,
  createConversation,
  deleteConversation,
  generateVideoLink,
  getConversationMessages
};
