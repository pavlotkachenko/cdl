/**
 * CDL Messaging System - Messaging Service
 * Handles all messaging operations with Supabase RLS
 */

import { supabase } from '../lib/supabaseClient';
import type { 
  Conversation, 
  Message, 
  MessageAttachment,
  CreateConversationRequest,
  SendMessageRequest,
  UploadAttachmentRequest 
} from '../types/messaging';

export class MessagingService {
  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<Conversation[]> {
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
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    return data as Conversation[];
  }

  /**
   * Get a specific conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        case:cases(*),
        driver:users!conversations_driver_id_fkey(id, email, full_name),
        attorney:users!conversations_attorney_id_fkey(id, email, full_name)
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch conversation: ${error.message}`);
    }

    return data as Conversation;
  }

  /**
   * Get conversation by case ID
   */
  async getConversationByCaseId(caseId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        case:cases(*),
        driver:users!conversations_driver_id_fkey(id, email, full_name),
        attorney:users!conversations_attorney_id_fkey(id, email, full_name)
      `)
      .eq('case_id', caseId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch conversation by case ID: ${error.message}`);
    }

    return data as Conversation | null;
  }

  /**
   * Create a new conversation
   */
  async createConversation(request: CreateConversationRequest): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        case_id: request.caseId,
        driver_id: request.driverId,
        attorney_id: request.attorneyId
      })
      .select(`
        *,
        case:cases(*),
        driver:users!conversations_driver_id_fkey(id, email, full_name),
        attorney:users!conversations_attorney_id_fkey(id, email, full_name)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return data as Conversation;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, email, full_name),
        recipient:users!messages_recipient_id_fkey(id, email, full_name),
        attachments:message_attachments(*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return (data as Message[]).reverse(); // Reverse to show oldest first
  }

  /**
   * Send a new message
   */
  async sendMessage(request: SendMessageRequest): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: request.conversationId,
        sender_id: request.senderId,
        recipient_id: request.recipientId,
        content: request.content,
        message_type: request.messageType || 'text',
        priority: request.priority || 'normal'
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, email, full_name),
        recipient:users!messages_recipient_id_fkey(id, email, full_name),
        attachments:message_attachments(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }

    return data as Message;
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) {
      throw new Error(`Failed to mark message as read: ${error.message}`);
    }
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId)
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Failed to mark conversation as read: ${error.message}`);
    }
  }

  /**
   * Get unread message count for current user
   */
  async getUnreadCount(): Promise<number> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return 0;
    }

    // Get user's internal ID
    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userData.user.id)
      .single();

    if (!userRecord) {
      return 0;
    }

    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userRecord.id)
      .eq('is_read', false);

    if (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Upload attachment to a message
   */
  async uploadAttachment(request: UploadAttachmentRequest): Promise<MessageAttachment> {
    // First upload file to Supabase Storage
    const fileExt = request.file.name.split('.').pop();
    const fileName = `${request.messageId}/${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('message-attachments')
      .upload(fileName, request.file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('message-attachments')
      .getPublicUrl(fileName);

    // Create attachment record
    const { data, error } = await supabase
      .from('message_attachments')
      .insert({
        message_id: request.messageId,
        file_name: request.file.name,
        file_size: request.file.size,
        file_type: request.file.type,
        file_url: urlData.publicUrl
      })
      .select()
      .single();

    if (error) {
      // Cleanup uploaded file if database insert fails
      await supabase.storage
        .from('message-attachments')
        .remove([fileName]);
      
      throw new Error(`Failed to create attachment record: ${error.message}`);
    }

    return data as MessageAttachment;
  }

  /**
   * Delete an attachment (within 5 minute window)
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    // Get attachment info
    const { data: attachment, error: fetchError } = await supabase
      .from('message_attachments')
      .select('file_url')
      .eq('id', attachmentId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch attachment: ${fetchError.message}`);
    }

    // Delete from database (RLS will check 5-minute window)
    const { error: deleteError } = await supabase
      .from('message_attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) {
      throw new Error(`Failed to delete attachment: ${deleteError.message}`);
    }

    // Delete from storage
    const fileName = attachment.file_url.split('/').pop();
    if (fileName) {
      await supabase.storage
        .from('message-attachments')
        .remove([fileName]);
    }
  }

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToConversation(
    conversationId: string, 
    callback: (message: Message) => void
  ): () => void {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch full message with relations
          const { data, error } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!messages_sender_id_fkey(id, email, full_name),
              recipient:users!messages_recipient_id_fkey(id, email, full_name),
              attachments:message_attachments(*)
            `)
           .eq('id', (payload.new as any).id)
            .single();

          if (!error && data) {
            callback(data as Message);
          }
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Subscribe to all conversations for current user
   */
  subscribeToConversations(callback: (conversation: Conversation) => void): () => void {
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        async (payload) => {
          // Fetch full conversation with relations
          const { data, error } = await supabase
            .from('conversations')
            .select(`
              *,
              case:cases(*),
              driver:users!conversations_driver_id_fkey(id, email, full_name),
              attorney:users!conversations_attorney_id_fkey(id, email, full_name)
            `)
           .eq('id', (payload.new as any).id)
            .single();

          if (!error && data) {
            callback(data as Conversation);
          }
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Search messages in conversations
   */
  async searchMessages(query: string, conversationId?: string): Promise<Message[]> {
    let queryBuilder = supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, email, full_name),
        recipient:users!messages_recipient_id_fkey(id, email, full_name),
        attachments:message_attachments(*),
        conversation:conversations(*)
      `)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (conversationId) {
      queryBuilder = queryBuilder.eq('conversation_id', conversationId);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to search messages: ${error.message}`);
    }

    return data as Message[];
  }

  /**
   * Get urgent/critical messages
   */
  async getUrgentMessages(): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, email, full_name),
        recipient:users!messages_recipient_id_fkey(id, email, full_name),
        conversation:conversations(*),
        attachments:message_attachments(*)
      `)
      .in('priority', ['urgent', 'critical'])
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Failed to fetch urgent messages: ${error.message}`);
    }

    return data as Message[];
  }
}

// Export singleton instance
export const messagingService = new MessagingService();
