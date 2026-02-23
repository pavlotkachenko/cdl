/**
 * CDL Messaging System - React Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { messagingService } from '../services/messagingService';
import type {
  Conversation,
  Message,
  UseMessagingReturn,
  UseConversationReturn,
  ConversationListItem
} from '../types/messaging';

/**
 * Hook to manage conversations list
 */
export function useMessaging(): UseMessagingReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await messagingService.getConversations();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch conversations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    // Subscribe to conversation updates
    const unsubscribe = messagingService.subscribeToConversations((conversation) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === conversation.id);
        if (index >= 0) {
          // Update existing conversation
          const updated = [...prev];
          updated[index] = conversation;
          return updated;
        } else {
          // Add new conversation
          return [conversation, ...prev];
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations
  };
}

/**
 * Hook to manage a single conversation and its messages
 */
export function useConversation(conversationId: string): UseConversationReturn {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [conversationData, messagesData] = await Promise.all([
        messagingService.getConversation(conversationId),
        messagingService.getMessages(conversationId)
      ]);
      
      setConversation(conversationData);
      setMessages(messagesData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch conversation'));
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchData();

    // Subscribe to new messages
    const unsubscribe = messagingService.subscribeToConversation(conversationId, (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId, fetchData]);

  const sendMessage = useCallback(
    async (content: string, priority: Message['priority'] = 'normal') => {
      if (!conversation) {
        throw new Error('Conversation not loaded');
      }

      // Get current user ID from conversation
      const { data: userData } = await messagingService['supabase'].auth.getUser();
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const { data: userRecord } = await messagingService['supabase']
        .from('users')
        .select('id')
        .eq('auth_user_id', userData.user.id)
        .single();

      if (!userRecord) {
        throw new Error('User record not found');
      }

      // Determine recipient based on current user role
      const senderId = userRecord.id;
      const recipientId = senderId === conversation.driver_id 
        ? conversation.attorney_id 
        : conversation.driver_id;

      const message = await messagingService.sendMessage({
        conversationId: conversation.id,
        senderId,
        recipientId,
        content,
        messageType: 'text',
        priority
      });

      // Message will be added via subscription, but we add it optimistically
      setMessages((prev) => [...prev, message]);
    },
    [conversation]
  );

  const uploadAttachment = useCallback(
    async (file: File) => {
      if (messages.length === 0) {
        throw new Error('Cannot upload attachment without sending a message first');
      }

      const lastMessage = messages[messages.length - 1];
      await messagingService.uploadAttachment({
        messageId: lastMessage.id,
        file
      });

      // Refetch messages to get updated attachment info
      await fetchData();
    },
    [messages, fetchData]
  );

  const markAsRead = useCallback(async () => {
    if (!conversation) return;

    const { data: userData } = await messagingService['supabase'].auth.getUser();
    if (!userData?.user) return;

    const { data: userRecord } = await messagingService['supabase']
      .from('users')
      .select('id')
      .eq('auth_user_id', userData.user.id)
      .single();

    if (!userRecord) return;

    await messagingService.markConversationAsRead(conversation.id, userRecord.id);
    
    // Update local state
    setMessages((prev) =>
      prev.map((msg) =>
        msg.recipient_id === userRecord.id && !msg.is_read
          ? { ...msg, is_read: true, read_at: new Date().toISOString() }
          : msg
      )
    );
  }, [conversation]);

  return {
    conversation,
    messages,
    loading,
    error,
    sendMessage,
    uploadAttachment,
    markAsRead,
    refetch: fetchData
  };
}

/**
 * Hook to get conversations with unread count
 */
export function useConversationsWithUnread() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversationsWithUnread = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: userData } = await messagingService['supabase'].auth.getUser();
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const { data: userRecord } = await messagingService['supabase']
        .from('users')
        .select('id')
        .eq('auth_user_id', userData.user.id)
        .single();

      if (!userRecord) {
        throw new Error('User record not found');
      }

      // Fetch conversations
      const conversationsData = await messagingService.getConversations();

      // For each conversation, get unread count and last message
      const conversationsWithUnread = await Promise.all(
        conversationsData.map(async (conv) => {
          // Get unread count
          const { count } = await messagingService['supabase']
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('recipient_id', userRecord.id)
            .eq('is_read', false);

          // Get last message
          const { data: lastMessages } = await messagingService['supabase']
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            ...conv,
            unreadCount: count || 0,
            lastMessage: lastMessages?.[0] || undefined
          };
        })
      );

      // Sort by last message timestamp
      conversationsWithUnread.sort((a, b) => {
        const aTime = a.last_message_at || a.created_at;
        const bTime = b.last_message_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(conversationsWithUnread);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch conversations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversationsWithUnread();

    // Subscribe to updates
    const unsubscribe = messagingService.subscribeToConversations(() => {
      fetchConversationsWithUnread();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchConversationsWithUnread]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversationsWithUnread
  };
}

/**
 * Hook to get total unread message count
 */
export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await messagingService.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return unreadCount;
}

/**
 * Hook to get urgent messages
 */
export function useUrgentMessages() {
  const [urgentMessages, setUrgentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUrgentMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const messages = await messagingService.getUrgentMessages();
      setUrgentMessages(messages);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch urgent messages'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUrgentMessages();

    // Refetch every 2 minutes
    const interval = setInterval(fetchUrgentMessages, 120000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchUrgentMessages]);

  return {
    urgentMessages,
    loading,
    error,
    refetch: fetchUrgentMessages
  };
}

/**
 * Hook to search messages
 */
export function useMessageSearch(query: string, conversationId?: string) {
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    const searchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const messages = await messagingService.searchMessages(query, conversationId);
        setResults(messages);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Search failed'));
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeout = setTimeout(searchMessages, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [query, conversationId]);

  return {
    results,
    loading,
    error
  };
}
