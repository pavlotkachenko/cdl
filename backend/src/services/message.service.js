// ============================================
// MESSAGE SERVICE
// Database operations for messages
// ============================================

const { supabase } = require('../config/supabase');
const { AppError } = require('../utils/errors');
const storageService = require('./storage.service');

/**
 * Create new message
 */
const createMessage = async ({ conversationId, senderId, recipientId, content, messageType, priority }) => {
  try {
    // Verify conversation exists and user has access
    const { data: conversation } = await supabase
      .from('conversations')
      .select('driver_id, attorney_id, closed_at')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (conversation.closed_at) {
      throw new AppError('Cannot send messages to closed conversation', 400);
    }

    if (conversation.driver_id !== senderId && conversation.attorney_id !== senderId) {
      throw new AppError('Unauthorized to send message in this conversation', 403);
    }

    // Validate content length
    if (content.length > 10000) {
      throw new AppError('Message content exceeds 10,000 character limit', 400);
    }

    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: senderId,
        recipient_id: recipientId,
        content,
        message_type: messageType,
        priority: priority || 'normal',
        encrypted: true
      }])
      .select(`
        *,
        sender:users!sender_id(id, name, email, avatar_url),
        recipient:users!recipient_id(id, name, email)
      `)
      .single();

    if (error) {
      throw new AppError(`Failed to create message: ${error.message}`, 500);
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

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
    // Verify conversation access
    const { data: conversation } = await supabase
      .from('conversations')
      .select('driver_id, attorney_id, closed_at')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (conversation.closed_at) {
      throw new AppError('Cannot send messages to closed conversation', 400);
    }

    if (conversation.driver_id !== senderId && conversation.attorney_id !== senderId) {
      throw new AppError('Unauthorized to send message in this conversation', 403);
    }

    // Upload file to storage
    const fileUrl = await storageService.uploadFile(file, 'message-attachments');

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: senderId,
        recipient_id: recipientId,
        content: content || 'Sent a file',
        message_type: 'file',
        priority: 'normal',
        encrypted: true
      }])
      .select(`
        *,
        sender:users!sender_id(id, name, email, avatar_url),
        recipient:users!recipient_id(id, name, email)
      `)
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

    // Update conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

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
    // Verify message exists and user is recipient
    const { data: message } = await supabase
      .from('messages')
      .select('id, recipient_id, sender_id, conversation_id, is_read')
      .eq('id', messageId)
      .single();

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.recipient_id !== userId) {
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
    // Verify message exists and user is sender
    const { data: message } = await supabase
      .from('messages')
      .select('id, sender_id')
      .eq('id', messageId)
      .single();

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.sender_id !== userId) {
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
    const { data: message, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(id, name, email, avatar_url),
        recipient:users!recipient_id(id, name, email),
        attachments:message_attachments(*),
        conversation:conversations(id, driver_id, attorney_id)
      `)
      .eq('id', messageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError('Message not found', 404);
      }
      throw new AppError(`Database error: ${error.message}`, 500);
    }

    // Verify user has access
    if (
      message.conversation.driver_id !== userId &&
      message.conversation.attorney_id !== userId
    ) {
      throw new AppError('Unauthorized to view this message', 403);
    }

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
