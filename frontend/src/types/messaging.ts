/**
 * CDL Messaging System - TypeScript Type Definitions
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'driver' | 'attorney' | 'admin';
  auth_user_id: string;
}

export interface Case {
  id: string;
  case_number: string;
  driver_id: string;
  assigned_attorney_id: string;
  status: 'open' | 'pending' | 'closed' | 'archived';
  citation_date: string;
  court_date?: string;
  violation_type: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  case_id: string;
  driver_id: string;
  attorney_id: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  accessed_by: string[];
  closed_at?: string;
  retention_until?: string;
  
  // Relations
  case?: Case;
  driver?: User;
  attorney?: User;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: 'text' | 'file' | 'video_link' | 'quick_question';
  is_read: boolean;
  read_at?: string;
  priority: 'normal' | 'urgent' | 'critical';
  created_at: string;
  updated_at: string;
  encrypted: boolean;
  audit_accessed_at?: string;
  audit_accessed_by?: string;
  
  // Relations
  sender?: User;
  recipient?: User;
  attachments?: MessageAttachment[];
  conversation?: Conversation;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  uploaded_at: string;
  virus_scanned: boolean;
  scan_result?: string;
}

export interface MessageAuditLog {
  id: string;
  message_id?: string;
  conversation_id?: string;
  accessed_by?: string;
  access_type: 'view' | 'send' | 'read' | 'download_attachment';
  ip_address?: string;
  user_agent?: string;
  accessed_at: string;
}

// Request/Response Types

export interface CreateConversationRequest {
  caseId: string;
  driverId: string;
  attorneyId: string;
}

export interface SendMessageRequest {
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  messageType?: 'text' | 'file' | 'video_link' | 'quick_question';
  priority?: 'normal' | 'urgent' | 'critical';
}

export interface UploadAttachmentRequest {
  messageId: string;
  file: File;
}

export interface ConversationListItem extends Conversation {
  unreadCount: number;
  lastMessage?: Message;
}

export interface UserUnreadMessages {
  user_id: string;
  email: string;
  role: string;
  unread_count: number;
  latest_unread_at?: string;
}

export interface ConversationActivity {
  conversation_id: string;
  case_id: string;
  case_number: string;
  driver_email: string;
  attorney_email: string;
  message_count: number;
  last_message_at?: string;
  closed_at?: string;
  retention_until?: string;
  access_count: number;
}

export interface AuditTrailSummary {
  conversation_id: string;
  accessed_by: string;
  accessed_by_email: string;
  accessed_by_role: string;
  access_type: string;
  access_count: number;
  first_access: string;
  last_access: string;
}

export interface RetentionComplianceMessages {
  conversation_id: string;
  case_id: string;
  case_number: string;
  closed_at?: string;
  retention_until?: string;
  message_count: number;
  attachment_count: number;
  total_attachment_size: number;
}

// Hook Types for React Components

export interface UseMessagingReturn {
  conversations: Conversation[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseConversationReturn {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: Error | null;
  sendMessage: (content: string, priority?: Message['priority']) => Promise<void>;
  uploadAttachment: (file: File) => Promise<void>;
  markAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

export interface MessageNotification {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  message_type: string;
  priority: string;
  created_at: string;
}

// Validation Types

export interface MessageValidation {
  isValid: boolean;
  errors: string[];
}

export interface AttachmentValidation {
  isValid: boolean;
  errors: string[];
  totalSize: number;
  maxSize: number;
}

// Constants

export const MESSAGE_CONSTRAINTS = {
  MAX_CONTENT_LENGTH: 10000,
  MAX_ATTACHMENT_SIZE: 10485760, // 10MB
  MAX_TOTAL_ATTACHMENTS_SIZE: 26214400, // 25MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ],
  ATTACHMENT_DELETE_WINDOW_MINUTES: 5
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  FILE: 'file',
  VIDEO_LINK: 'video_link',
  QUICK_QUESTION: 'quick_question'
} as const;

export const MESSAGE_PRIORITIES = {
  NORMAL: 'normal',
  URGENT: 'urgent',
  CRITICAL: 'critical'
} as const;

export const USER_ROLES = {
  DRIVER: 'driver',
  ATTORNEY: 'attorney',
  ADMIN: 'admin'
} as const;

export const CASE_STATUSES = {
  OPEN: 'open',
  PENDING: 'pending',
  CLOSED: 'closed',
  ARCHIVED: 'archived'
} as const;
