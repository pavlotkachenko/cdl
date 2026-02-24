// ============================================
// STORAGE SERVICE
// File upload/download operations using Supabase Storage
// ============================================

const { supabase } = require('../config/supabase');
const { AppError } = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

/**
 * Upload file to Supabase Storage
 */
const uploadFile = async (file, bucket = 'message-attachments') => {
  try {
    if (!file) {
      throw new AppError('No file provided', 400);
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new AppError('File size exceeds 10MB limit', 400);
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError('File type not allowed', 400);
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = `${Date.now()}_${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filepath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      throw new AppError(`File upload failed: ${error.message}`, 500);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filepath);

    return urlData.publicUrl;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to upload file', 500);
  }
};

/**
 * Delete file from Supabase Storage
 */
const deleteFile = async (fileUrl) => {
  try {
    // Extract bucket and path from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucket = pathParts[pathParts.length - 2];
    const filename = pathParts[pathParts.length - 1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filename]);

    if (error) {
      console.error('Failed to delete file:', error);
      // Don't throw error for file deletion failures
    }

    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
};

/**
 * Get signed URL for private file
 */
const getSignedUrl = async (filepath, bucket = 'message-attachments', expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filepath, expiresIn);

    if (error) {
      throw new AppError(`Failed to generate signed URL: ${error.message}`, 500);
    }

    return data.signedUrl;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to generate signed URL', 500);
  }
};

/**
 * Download file from storage
 */
const downloadFile = async (filepath, bucket = 'message-attachments') => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filepath);

    if (error) {
      throw new AppError(`Failed to download file: ${error.message}`, 500);
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to download file', 500);
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  getSignedUrl,
  downloadFile
};
