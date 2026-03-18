// ============================================
// CONVERSATION SERVICE
// Database operations for conversations
// ============================================

const { supabase } = require('../config/supabase');
const { AppError } = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');

/**
 * Resolve public.users.id to auth_user_id (used by conversations FK).
 * Conversations store auth.users UUIDs; the app uses public.users UUIDs.
 */
async function resolveAuthUserId(publicUserId) {
  const { data } = await supabase
    .from('users')
    .select('auth_user_id')
    .eq('id', publicUserId)
    .single();
  return data?.auth_user_id || publicUserId;
}

/**
 * Check if a user is a participant in a conversation.
 * Works for all conversation types (attorney_case, operator, support).
 */
function isParticipant(conversation, authId) {
  return (
    conversation.driver_id === authId ||
    conversation.attorney_id === authId ||
    conversation.operator_id === authId
  );
}

/**
 * Hydrate conversations with user and case data via separate queries.
 * conversation.driver_id / attorney_id / operator_id are auth.users UUIDs,
 * so we look up public.users by auth_user_id to get profile info.
 */
async function hydrateConversations(conversations) {
  if (!conversations || conversations.length === 0) return [];

  const authUserIds = [...new Set(
    conversations.flatMap(c => [c.driver_id, c.attorney_id, c.operator_id].filter(Boolean))
  )];
  const caseIds = [...new Set(
    conversations.map(c => c.case_id).filter(Boolean)
  )];

  const [usersResult, casesResult] = await Promise.all([
    authUserIds.length > 0
      ? supabase.from('users').select('id, auth_user_id, full_name, email, role').in('auth_user_id', authUserIds)
      : { data: [] },
    caseIds.length > 0
      ? supabase.from('cases').select('id, case_number, status, violation_type').in('id', caseIds)
      : { data: [] },
  ]);

  // Map by auth_user_id since that's what conversations store
  const usersMap = {};
  const authToPublicId = {};
  (usersResult.data || []).forEach(u => {
    usersMap[u.auth_user_id] = { id: u.id, name: u.full_name, email: u.email, role: u.role };
    authToPublicId[u.auth_user_id] = u.id;
  });

  const casesMap = {};
  (casesResult.data || []).forEach(c => { casesMap[c.id] = c; });

  // Translate auth IDs back to public.users IDs so frontend can match against currentUserId
  return conversations.map(conv => ({
    ...conv,
    driver_id: authToPublicId[conv.driver_id] || conv.driver_id,
    attorney_id: conv.attorney_id ? (authToPublicId[conv.attorney_id] || conv.attorney_id) : null,
    operator_id: conv.operator_id ? (authToPublicId[conv.operator_id] || conv.operator_id) : null,
    driver: usersMap[conv.driver_id] || null,
    attorney: conv.attorney_id ? (usersMap[conv.attorney_id] || null) : null,
    operator: conv.operator_id ? (usersMap[conv.operator_id] || null) : null,
    case: casesMap[conv.case_id] || null,
  }));
}

/**
 * Hydrate messages with sender/recipient user data via separate queries.
 * sender_id / recipient_id are auth.users UUIDs.
 */
async function hydrateMessages(messages) {
  if (!messages || messages.length === 0) return [];

  const authUserIds = [...new Set(
    messages.flatMap(m => [m.sender_id, m.recipient_id].filter(Boolean))
  )];

  const usersResult = authUserIds.length > 0
    ? await supabase.from('users').select('id, auth_user_id, full_name, email, role').in('auth_user_id', authUserIds)
    : { data: [] };

  const usersMap = {};
  const authToPublicId = {};
  (usersResult.data || []).forEach(u => {
    usersMap[u.auth_user_id] = { id: u.id, name: u.full_name, email: u.email, role: u.role };
    authToPublicId[u.auth_user_id] = u.id;
  });

  // Translate auth IDs to public.users IDs so frontend can match against currentUserId
  return messages.map(msg => ({
    ...msg,
    sender_id: authToPublicId[msg.sender_id] || msg.sender_id,
    recipient_id: authToPublicId[msg.recipient_id] || msg.recipient_id,
    sender: usersMap[msg.sender_id] || null,
    recipient: usersMap[msg.recipient_id] || null,
  }));
}

/**
 * Get all conversations for a user.
 * Supports filtering by conversation type, unread-only, and name search.
 */
const getUserConversations = async (userId, options = {}) => {
  const { limit = 20, offset = 0, type, unreadOnly, search } = options;

  try {
    // Translate public.users.id to auth_user_id for the filter
    const authId = await resolveAuthUserId(userId);

    let query = supabase
      .from('conversations')
      .select('*', { count: 'exact' })
      .or(`driver_id.eq.${authId},attorney_id.eq.${authId},operator_id.eq.${authId}`);

    // Filter by conversation_type
    if (type && type !== 'all') {
      if (type === 'support') {
        // "support" tab includes both operator and support types
        query = query.in('conversation_type', ['operator', 'support']);
      } else {
        query = query.eq('conversation_type', type);
      }
    }

    // Filter to unread only
    if (unreadOnly) {
      query = query.gt('unread_count', 0);
    }

    query = query
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: conversations, error, count } = await query;

    if (error) {
      throw new AppError(`Database error: ${error.message}`, 500);
    }

    const hydrated = await hydrateConversations(conversations || []);

    // Apply search filter (post-query, since it requires hydrated user names)
    let filtered = hydrated;
    if (search) {
      const q = search.toLowerCase();
      filtered = hydrated.filter(conv => {
        const attorney = conv.attorney;
        const operator = conv.operator;
        return (
          (attorney?.name && attorney.name.toLowerCase().includes(q)) ||
          (operator?.name && operator.name.toLowerCase().includes(q))
        );
      });
    }

    return {
      conversations: filtered,
      total: search ? filtered.length : (count || 0)
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
    const authId = await resolveAuthUserId(userId);

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .or(`driver_id.eq.${authId},attorney_id.eq.${authId},operator_id.eq.${authId}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError('Conversation not found', 404);
      }
      throw new AppError(`Database error: ${error.message}`, 500);
    }

    // Hydrate with user/case data
    const hydrated = await hydrateConversations([conversation]);

    // Update accessed_by array (best-effort, don't fail on error)
    try {
      await supabase
        .from('conversations')
        .update({
          accessed_by: supabase.raw(`array_append(accessed_by, '${authId}')`)
        })
        .eq('id', conversationId);
    } catch (_) {
      // Non-critical — don't fail the request
    }

    return hydrated[0] || conversation;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch conversation', 500);
  }
};

/**
 * Create new conversation.
 * Supports attorney_case (linked to a case), operator, and support types.
 */
const createConversation = async ({ caseId, driverId, attorneyId, operatorId, conversationType = 'attorney_case' }) => {
  try {
    const driverAuthId = await resolveAuthUserId(driverId);

    // Validate based on conversation type
    if (conversationType === 'attorney_case') {
      return await createAttorneyCaseConversation({ caseId, driverId, driverAuthId, attorneyId });
    }

    // Operator or support conversation
    if (!operatorId && conversationType !== 'support') {
      throw new AppError('operatorId is required for operator conversations', 400);
    }

    const otherAuthId = operatorId ? await resolveAuthUserId(operatorId) : null;

    // Check for existing conversation between this driver and operator
    if (otherAuthId) {
      let dupQuery = supabase
        .from('conversations')
        .select('id')
        .eq('driver_id', driverAuthId)
        .eq('operator_id', otherAuthId)
        .eq('conversation_type', conversationType);

      if (caseId) {
        dupQuery = dupQuery.eq('case_id', caseId);
      }

      const { data: existing } = await dupQuery.maybeSingle();
      if (existing) {
        throw new AppError('Conversation already exists', 400);
      }
    }

    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() + 7);

    const insertData = {
      driver_id: driverAuthId,
      conversation_type: conversationType,
      retention_until: retentionDate.toISOString(),
      accessed_by: [driverAuthId]
    };
    if (caseId) insertData.case_id = caseId;
    if (otherAuthId) insertData.operator_id = otherAuthId;

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert([insertData])
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Failed to create conversation: ${error.message}`, 500);
    }

    const hydrated = await hydrateConversations([conversation]);
    return hydrated[0] || conversation;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create conversation', 500);
  }
};

/**
 * Create an attorney_case conversation (existing logic, extracted for clarity).
 */
async function createAttorneyCaseConversation({ caseId, driverId, driverAuthId, attorneyId }) {
  if (!attorneyId) {
    throw new AppError('attorneyId is required for attorney_case conversations', 400);
  }
  if (!caseId) {
    throw new AppError('caseId is required for attorney_case conversations', 400);
  }

  const attorneyAuthId = await resolveAuthUserId(attorneyId);

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('case_id', caseId)
    .eq('driver_id', driverAuthId)
    .eq('attorney_id', attorneyAuthId)
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

  const retentionDate = new Date();
  retentionDate.setFullYear(retentionDate.getFullYear() + 7);

  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert([{
      case_id: caseId,
      driver_id: driverAuthId,
      attorney_id: attorneyAuthId,
      conversation_type: 'attorney_case',
      retention_until: retentionDate.toISOString(),
      accessed_by: [driverAuthId]
    }])
    .select('*')
    .single();

  if (error) {
    throw new AppError(`Failed to create conversation: ${error.message}`, 500);
  }

  const hydrated = await hydrateConversations([conversation]);
  return hydrated[0] || conversation;
}

/**
 * Delete conversation
 */
const deleteConversation = async (conversationId, userId) => {
  try {
    const authId = await resolveAuthUserId(userId);

    // Verify user has permission to delete
    const { data: conversation } = await supabase
      .from('conversations')
      .select('driver_id, attorney_id, operator_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (!isParticipant(conversation, authId)) {
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
    const authId = await resolveAuthUserId(attorneyId);

    // Verify conversation exists and attorney is participant
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, attorney_id')
      .eq('id', conversationId)
      .eq('attorney_id', authId)
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
        generated_by: authId,
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
    const authId = await resolveAuthUserId(userId);

    // Verify user has access to conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('driver_id, attorney_id, operator_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (!isParticipant(conversation, authId)) {
      throw new AppError('Unauthorized to view this conversation', 403);
    }

    // Get messages — plain select, no FK joins
    const { data: messages, error, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(`Database error: ${error.message}`, 500);
    }

    const hydrated = await hydrateMessages(messages || []);

    return {
      messages: hydrated,
      total: count || 0
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch messages', 500);
  }
};

/**
 * Get total unread message count across all conversations for a user.
 */
const getUnreadCountForUser = async (userId) => {
  try {
    const authId = await resolveAuthUserId(userId);

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', authId)
      .eq('is_read', false);

    if (error) {
      throw new AppError(`Database error: ${error.message}`, 500);
    }

    return count || 0;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch unread count', 500);
  }
};

module.exports = {
  getUserConversations,
  getConversationById,
  createConversation,
  deleteConversation,
  generateVideoLink,
  getConversationMessages,
  getUnreadCountForUser
};
