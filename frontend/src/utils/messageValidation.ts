/**
 * CDL Messaging System - Validation Utilities
 */

import type { MessageValidation, AttachmentValidation } from '../types/messaging';
import { MESSAGE_CONSTRAINTS } from '../types/messaging';

/**
 * Validate message content
 */
export function validateMessageContent(content: string): MessageValidation {
  const errors: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push('Message content cannot be empty');
  }

  if (content.length > MESSAGE_CONSTRAINTS.MAX_CONTENT_LENGTH) {
    errors.push(
      `Message content exceeds maximum length of ${MESSAGE_CONSTRAINTS.MAX_CONTENT_LENGTH} characters`
    );
  }

  // Check for potentially malicious content
  const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  if (scriptRegex.test(content)) {
    errors.push('Message content contains potentially malicious content');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate file attachment
 */
export function validateAttachment(
  file: File,
  existingAttachments: { file_size: number }[] = []
): AttachmentValidation {
  const errors: string[] = [];

  // Check file size
  if (file.size > MESSAGE_CONSTRAINTS.MAX_ATTACHMENT_SIZE) {
    errors.push(
      `File size exceeds maximum of ${formatFileSize(MESSAGE_CONSTRAINTS.MAX_ATTACHMENT_SIZE)}`
    );
  }

  // Check file type
  if (!MESSAGE_CONSTRAINTS.ALLOWED_FILE_TYPES.includes(file.type as any)) {
    errors.push(
      `File type "${file.type}" is not allowed. Allowed types: ${MESSAGE_CONSTRAINTS.ALLOWED_FILE_TYPES.join(', ')}`
    );
  }

  // Check total attachment size
  const totalSize = existingAttachments.reduce((sum, att) => sum + att.file_size, 0) + file.size;
  if (totalSize > MESSAGE_CONSTRAINTS.MAX_TOTAL_ATTACHMENTS_SIZE) {
    errors.push(
      `Total attachment size exceeds maximum of ${formatFileSize(MESSAGE_CONSTRAINTS.MAX_TOTAL_ATTACHMENTS_SIZE)}`
    );
  }

  // Check file name
  if (file.name.length > 255) {
    errors.push('File name is too long (max 255 characters)');
  }

  // Check for potentially malicious file names
  const dangerousChars = /[<>:"|?*\x00-\x1f]/g;
  if (dangerousChars.test(file.name)) {
    errors.push('File name contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    totalSize,
    maxSize: MESSAGE_CONSTRAINTS.MAX_TOTAL_ATTACHMENTS_SIZE
  };
}

/**
 * Validate conversation creation
 */
export function validateConversationCreation(
  caseId: string,
  driverId: string,
  attorneyId: string
): MessageValidation {
  const errors: string[] = [];

  if (!caseId || !isValidUUID(caseId)) {
    errors.push('Invalid case ID');
  }

  if (!driverId || !isValidUUID(driverId)) {
    errors.push('Invalid driver ID');
  }

  if (!attorneyId || !isValidUUID(attorneyId)) {
    errors.push('Invalid attorney ID');
  }

  if (driverId === attorneyId) {
    errors.push('Driver and attorney must be different users');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if attachment can be deleted (within 5 minute window)
 */
export function canDeleteAttachment(uploadedAt: string): boolean {
  const uploadTime = new Date(uploadedAt).getTime();
  const currentTime = new Date().getTime();
  const minutesElapsed = (currentTime - uploadTime) / 1000 / 60;
  
  return minutesElapsed <= MESSAGE_CONSTRAINTS.ATTACHMENT_DELETE_WINDOW_MINUTES;
}

/**
 * Sanitize message content
 */
export function sanitizeMessageContent(content: string): string {
  // Remove script tags
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Check if conversation is closed
 */
export function isConversationClosed(closedAt?: string): boolean {
  return !!closedAt;
}

/**
 * Check if message is within retention period
 */
export function isWithinRetentionPeriod(retentionUntil?: string): boolean {
  if (!retentionUntil) return false;
  return new Date(retentionUntil) > new Date();
}

/**
 * Validate message priority
 */
export function validateMessagePriority(priority: string): boolean {
  return ['normal', 'urgent', 'critical'].includes(priority);
}

/**
 * Validate message type
 */
export function validateMessageType(type: string): boolean {
  return ['text', 'file', 'video_link', 'quick_question'].includes(type);
}

/**
 * Extract video ID from common video URLs
 */
export function extractVideoId(url: string): string | null {
  // YouTube
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) return youtubeMatch[1];

  // Vimeo
  const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/i;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) return vimeoMatch[1];

  return null;
}

/**
 * Validate video URL
 */
export function validateVideoUrl(url: string): MessageValidation {
  const errors: string[] = [];

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    const allowedDomains = [
      'youtube.com',
      'www.youtube.com',
      'youtu.be',
      'vimeo.com',
      'www.vimeo.com'
    ];

    if (!allowedDomains.includes(hostname)) {
      errors.push('Video URL must be from YouTube or Vimeo');
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      errors.push('Could not extract video ID from URL');
    }
  } catch (err) {
    errors.push('Invalid URL format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Rate limiting check (client-side)
 */
export class MessageRateLimiter {
  private messageTimestamps: number[] = [];
  private readonly maxMessagesPerMinute: number = 10;
  private readonly windowMs: number = 60000; // 1 minute

  canSendMessage(): boolean {
    const now = Date.now();
    
    // Remove timestamps older than the window
    this.messageTimestamps = this.messageTimestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    // Check if we've exceeded the limit
    if (this.messageTimestamps.length >= this.maxMessagesPerMinute) {
      return false;
    }

    // Add current timestamp
    this.messageTimestamps.push(now);
    return true;
  }

  getRemainingMessages(): number {
    const now = Date.now();
    this.messageTimestamps = this.messageTimestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );
    return this.maxMessagesPerMinute - this.messageTimestamps.length;
  }

  getTimeUntilNextMessage(): number {
    if (this.messageTimestamps.length === 0) return 0;
    
    const now = Date.now();
    const oldestTimestamp = this.messageTimestamps[0];
    const timeElapsed = now - oldestTimestamp;
    
    if (timeElapsed >= this.windowMs) return 0;
    
    return this.windowMs - timeElapsed;
  }
}

/**
 * Export singleton rate limiter instance
 */
export const messageRateLimiter = new MessageRateLimiter();
