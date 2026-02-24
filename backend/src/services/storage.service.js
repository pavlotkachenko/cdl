// ============================================
// STORAGE SERVICE
// Supabase Storage integration for file management
// ============================================

const { supabase } = require('../config/supabase');
const crypto = require('crypto');

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'case-documents';

/**
 * Upload file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileName - File name
 * @param {String} mimeType - File MIME type
 * @param {String} folder - Folder path (e.g., 'cases/123')
 * @returns {Promise<Object>} Upload result
 */
const uploadToSupabase = async (fileBuffer, fileName, mimeType, folder = '') => {
  try {
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    return {
      path: data.path,
      fullPath: data.fullPath || filePath,
      bucket: STORAGE_BUCKET
    };

  } catch (error) {
    console.error('Upload to Supabase error:', error);
    throw error;
  }
};

/**
 * Generate signed URL for file download
 * @param {String} filePath - File path in storage
 * @param {Number} expiresIn - URL expiry in seconds (default: 1 hour)
 * @returns {Promise<String>} Signed URL
 */
const generateSignedUrl = async (filePath, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Generate signed URL error:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;

  } catch (error) {
    console.error('Signed URL error:', error);
    throw error;
  }
};

/**
 * Get public URL for file (if bucket is public)
 * @param {String} filePath - File path in storage
 * @returns {String} Public URL
 */
const getPublicUrl = (filePath) => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * Delete file from Supabase Storage
 * @param {String} filePath - File path in storage
 * @returns {Promise<void>}
 */
const deleteFromSupabase = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }

  } catch (error) {
    console.error('Delete from Supabase error:', error);
    throw error;
  }
};

/**
 * Delete multiple files from Supabase Storage
 * @param {Array} filePaths - Array of file paths
 * @returns {Promise<void>}
 */
const deleteMultipleFiles = async (filePaths) => {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths);

    if (error) {
      console.error('Supabase delete multiple error:', error);
      throw new Error(`Delete multiple failed: ${error.message}`);
    }

  } catch (error) {
    console.error('Delete multiple files error:', error);
    throw error;
  }
};

/**
 * List files in a folder
 * @param {String} folder - Folder path
 * @returns {Promise<Array>} List of files
 */
const listFiles = async (folder = '') => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('List files error:', error);
      throw new Error(`List failed: ${error.message}`);
    }

    return data || [];

  } catch (error) {
    console.error('List files error:', error);
    throw error;
  }
};

/**
 * Check if file exists
 * @param {String} filePath - File path
 * @returns {Promise<Boolean>} True if exists
 */
const fileExists = async (filePath) => {
  try {
    const folder = filePath.substring(0, filePath.lastIndexOf('/'));
    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);

    const files = await listFiles(folder);
    return files.some(file => file.name === fileName);

  } catch (error) {
    console.error('File exists check error:', error);
    return false;
  }
};

/**
 * Get file metadata
 * @param {String} filePath - File path
 * @returns {Promise<Object>} File metadata
 */
const getFileMetadata = async (filePath) => {
  try {
    const folder = filePath.substring(0, filePath.lastIndexOf('/'));
    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);

    const files = await listFiles(folder);
    const file = files.find(f => f.name === fileName);

    if (!file) {
      throw new Error('File not found');
    }

    return file;

  } catch (error) {
    console.error('Get file metadata error:', error);
    throw error;
  }
};

/**
 * Scan file for viruses (placeholder - integrate with ClamAV or VirusTotal)
 * @param {Buffer} fileBuffer - File buffer
 * @returns {Promise<Object>} Scan result
 */
const scanForVirus = async (fileBuffer) => {
  try {
    // TODO: Integrate with virus scanning service
    // For now, return clean status
    
    // Example integration with ClamAV:
    // const clam = require('clamscan');
    // const scanner = await clam.init({ ... });
    // const result = await scanner.scanBuffer(fileBuffer);
    
    return {
      isClean: true,
      threats: [],
      scannedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Virus scan error:', error);
    // In production, you might want to fail-safe and reject the file
    throw new Error('Virus scan failed');
  }
};

/**
 * Calculate file hash (for duplicate detection)
 * @param {Buffer} fileBuffer - File buffer
 * @returns {String} SHA256 hash
 */
const calculateFileHash = (fileBuffer) => {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

/**
 * Store file metadata in database
 * @param {Object} fileData - File metadata
 * @returns {Promise<Object>} Stored file record
 */
const storeFileMetadata = async (fileData) => {
  try {
    const { data, error } = await supabase
      .from('case_documents')
      .insert({
        case_id: fileData.caseId,
        uploaded_by: fileData.uploadedBy,
        file_name: fileData.fileName,
        file_path: fileData.filePath,
        file_size: fileData.fileSize,
        mime_type: fileData.mimeType,
        file_hash: fileData.fileHash,
        is_virus_scanned: fileData.isVirusScanned || false,
        virus_scan_result: fileData.virusScanResult || null
      })
      .select()
      .single();

    if (error) {
      console.error('Store file metadata error:', error);
      throw new Error('Failed to store file metadata');
    }

    return data;

  } catch (error) {
    console.error('Store metadata error:', error);
    throw error;
  }
};

/**
 * Get file metadata from database
 * @param {String} fileId - File ID
 * @returns {Promise<Object>} File metadata
 */
const getFileMetadataFromDb = async (fileId) => {
  try {
    const { data, error } = await supabase
      .from('case_documents')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) {
      console.error('Get file metadata from DB error:', error);
      throw new Error('File not found');
    }

    return data;

  } catch (error) {
    console.error('Get metadata from DB error:', error);
    throw error;
  }
};

/**
 * Delete file metadata from database
 * @param {String} fileId - File ID
 * @returns {Promise<void>}
 */
const deleteFileMetadata = async (fileId) => {
  try {
    const { error } = await supabase
      .from('case_documents')
      .delete()
      .eq('id', fileId);

    if (error) {
      console.error('Delete file metadata error:', error);
      throw new Error('Failed to delete file metadata');
    }

  } catch (error) {
    console.error('Delete metadata error:', error);
    throw error;
  }
};

module.exports = {
  uploadToSupabase,
  generateSignedUrl,
  getPublicUrl,
  deleteFromSupabase,
  deleteMultipleFiles,
  listFiles,
  fileExists,
  getFileMetadata,
  scanForVirus,
  calculateFileHash,
  storeFileMetadata,
  getFileMetadataFromDb,
  deleteFileMetadata,
  STORAGE_BUCKET
};
