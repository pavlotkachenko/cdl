// ============================================
// FILE UPLOAD MIDDLEWARE
// Multer configuration for file uploads
// ============================================

const multer = require('multer');
const path = require('path');

// Allowed file types
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv']
};

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * File filter function
 */
const fileFilter = (req, file, cb) => {
  // Check if file type is allowed
  if (ALLOWED_FILE_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`), false);
  }
};

/**
 * Multer configuration with memory storage
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5 // Maximum 5 files per request
  },
  fileFilter: fileFilter
});

/**
 * Single file upload middleware
 */
const uploadSingle = upload.single('file');

/**
 * Multiple files upload middleware (max 5)
 */
const uploadMultiple = upload.array('files', 5);

/**
 * Error handler for multer errors
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File Too Large',
        message: `File size cannot exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too Many Files',
        message: 'Maximum 5 files allowed per upload'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected Field',
        message: 'Unexpected file field in request'
      });
    }
    
    return res.status(400).json({
      error: 'Upload Error',
      message: error.message
    });
  }

  if (error) {
    return res.status(400).json({
      error: 'Upload Error',
      message: error.message
    });
  }

  next();
};

/**
 * Validate file metadata
 */
const validateFile = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      error: 'No File',
      message: 'No file uploaded'
    });
  }

  // Additional validation can be added here
  // e.g., checking file content, scanning for viruses, etc.

  next();
};

/**
 * Get file extension from mimetype
 */
const getFileExtension = (mimetype) => {
  const extensions = ALLOWED_FILE_TYPES[mimetype];
  return extensions ? extensions[0] : '';
};

/**
 * Generate unique filename
 */
const generateFileName = (originalName, userId) => {
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  
  return `${userId}_${timestamp}_${sanitizedName}${ext}`;
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  validateFile,
  getFileExtension,
  generateFileName,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE
};
