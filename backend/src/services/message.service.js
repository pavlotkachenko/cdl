// ============================================
// MESSAGE SERVICE
// Database operations for messages
// ============================================

const { supabase } = require('../config/supabase');
const { AppError } = require('../utils/errors');
const storageService = require('./storage.service');

/**
 * Resolve public.users.id to auth_user_id (used by conversations/messages FKs).
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
 */
function isParticipant(conversation, authId) {
  return (
    conversation.driver_id === authId ||
    conversation.attorney_id === authId ||
    conversation.operator_id === authId
  );
}

/**
 * Determine the recipient auth ID from a conversation.
 * For two-party conversations, the recipient is the other participant.
 */
function getRecipientAuthId(conversation, senderAuthId) {
  if (conversation.driver_id === senderAuthId) {
    // Driver is sending — recipient is attorney or operator
    return conversation.attorney_id || conversation.operator_id;
  }
  // Attorney or operator is sending — recipient is driver
  return conversation.driver_id;
}

/**
 * Update conversation preview fields after a message is sent.
 */
async function updateConversationPreview(conversationId, content) {
  const preview = content && content.length > 100 ? content.substring(0, 100) + '...' : content;
  await supabase
    .from('conversations')
    .update({
      last_message: preview,
      last_message_at: new Date().toISOString()
    })
    .eq('id', conversationId);
}

/**
 * Create new message
 */
const createMessage = async ({ conversationId, senderId, recipientId, content, messageType, priority }) => {
  try {
    const senderAuthId = await resolveAuthUserId(senderId);

    // Verify conversation exists and user has access
    const { data: conversation } = await supabase
      .from('conversations')
      .select('driver_id, attorney_id, operator_id, closed_at')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (conversation.closed_at) {
      throw new AppError('Cannot send messages to closed conversation', 400);
    }

    if (!isParticipant(conversation, senderAuthId)) {
      throw new AppError('Unauthorized to send message in this conversation', 403);
    }

    // Validate content length
    if (content.length > 10000) {
      throw new AppError('Message content exceeds 10,000 character limit', 400);
    }

    // Determine recipient auth ID from conversation
    const recipientAuthId = getRecipientAuthId(conversation, senderAuthId);

    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: senderAuthId,
        recipient_id: recipientAuthId,
        content,
        message_type: messageType,
        priority: priority || 'normal',
        encrypted: true
      }])
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Failed to create message: ${error.message}`, 500);
    }

    // Update conversation preview and timestamp
    await updateConversationPreview(conversationId, content);

    return message;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create message', 500);
  }
};

/**
 * Create message with file attachment
 */
const createMessageWithFile = async ({ conversationId, senderId, recipientId, content, file }) => {
  try {
    const senderAuthId = await resolveAuthUserId(senderId);

    // Verify conversation access
    const { data: conversation } = await supabase
      .from('conversations')
      .select('driver_id, attorney_id, operator_id, closed_at')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (conversation.closed_at) {
      throw new AppError('Cannot send messages to closed conversation', 400);
    }

    if (!isParticipant(conversation, senderAuthId)) {
      throw new AppError('Unauthorized to send message in this conversation', 403);
    }

    // Upload file to storage
    const fileUrl = await storageService.uploadFile(file, 'message-attachments');

    // Determine recipient auth ID from conversation
    const recipientAuthId = getRecipientAuthId(conversation, senderAuthId);

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: senderAuthId,
        recipient_id: recipientAuthId,
        content: content || 'Sent a file',
        message_type: 'file',
        priority: 'normal',
        encrypted: true
      }])
      .select('*')
      .single();

    if (messageError) {
      // Cleanup uploaded file
      await storageService.deleteFile(fileUrl);
      throw new AppError(`Failed to create message: ${messageError.message}`, 500);
    }

    // Create attachment record
    const { data: attachment, error: attachmentError } = await supabase
      .from('message_attachments')
      .insert([{
        message_id: message.id,
        file_name: file.originalname,
        file_size: file.size,
        file_type: file.mimetype,
        file_url: fileUrl,
        virus_scanned: false
      }])
      .select()
      .single();

    if (attachmentError) {
      throw new AppError(`Failed to create attachment: ${attachmentError.message}`, 500);
    }

    // Update conversation preview and timestamp
    await updateConversationPreview(conversationId, content || `Sent a file: ${file.originalname}`);

    // Add attachment to message object
    message.attachments = [attachment];

    return message;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create message with file', 500);
  }
};

/**
 * Mark message as read
 */
const markAsRead = async (messageId, userId) => {
  try {
    const authId = await resolveAuthUserId(userId);

    // Verify message exists and user is recipient
    const { data: message } = await supabase
      .from('messages')
      .select('id, recipient_id, sender_id, conversation_id, is_read')
      .eq('id', messageId)
      .single();

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.recipient_id !== authId) {
      throw new AppError('Only the recipient can mark message as read', 403);
    }

    if (message.is_read) {
      return message; // Already read
    }

    // Update message
    const { data: updatedMessage, error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to mark message as read: ${error.message}`, 500);
    }

    return updatedMessage;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to mark message as read', 500);
  }
};

/**
 * Delete message
 */
const deleteMessage = async (messageId, userId) => {
  try {
    const authId = await resolveAuthUserId(userId);

    // Verify message exists and user is sender
    const { data: message } = await supabase
      .from('messages')
      .select('id, sender_id')
      .eq('id', messageId)
      .single();

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.sender_id !== authId) {
      throw new AppError('Only the sender can delete this message', 403);
    }

    // Get attachments for cleanup
    const { data: attachments } = await supabase
      .from('message_attachments')
      .select('file_url')
      .eq('message_id', messageId);

    // Delete message (attachments will cascade)
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      throw new AppError(`Failed to delete message: ${error.message}`, 500);
    }

    // Delete files from storage
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          await storageService.deleteFile(attachment.file_url);
        } catch (err) {
          console.error('Failed to delete file:', err);
        }
      }
    }

    return true;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete message', 500);
  }
};

/**
 * Get message by ID
 */
const getMessageById = async (messageId, userId) => {
  try {
    const authId = await resolveAuthUserId(userId);

    // Plain select, no FK joins
    const { data: message, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError('Message not found', 404);
      }
      throw new AppError(`Database error: ${error.message}`, 500);
    }

    // Get conversation to verify access
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, driver_id, attorney_id, operator_id')
      .eq('id', message.conversation_id)
      .single();

    if (!conversation || !isParticipant(conversation, authId)) {
      throw new AppError('Unauthorized to view this message', 403);
    }

    // Hydrate sender/recipient
    const userIds = [message.sender_id, message.recipient_id].filter(Boolean);
    const { data: users } = await supabase
      .from('users')
      .select('id, auth_user_id, full_name, email')
      .in('auth_user_id', userIds);

    const usersMap = {};
    (users || []).forEach(u => {
      usersMap[u.auth_user_id] = { id: u.id, name: u.full_name, email: u.email };
    });

    message.sender = usersMap[message.sender_id] || null;
    message.recipient = usersMap[message.recipient_id] || null;
    message.conversation = conversation;

    return message;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch message', 500);
  }
};

module.exports = {
  createMessage,
  createMessageWithFile,
  markAsRead,
  deleteMessage,
  getMessageById
};
