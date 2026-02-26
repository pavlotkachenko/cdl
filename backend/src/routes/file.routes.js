// ============================================
// FILE ROUTES
// File upload and download endpoints
// ============================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const fileController = require('../controllers/file.controller');
const { authenticate } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/upload.middleware');

/**
 * POST /api/files/upload
 * Upload single file to case
 */
router.post('/upload',
  authenticate,
  uploadSingle,
  handleUploadError,
  [
    body('case_id')
      .notEmpty()
      .withMessage('Case ID required')
      .isUUID()
      .withMessage('Invalid case ID format'),
    body('description')
      .optional()
      .isString()
      .trim()
  ],
  fileController.uploadFile
);

/**
 * POST /api/files/upload-multiple
 * Upload multiple files to case
 */
router.post('/upload-multiple',
  authenticate,
  uploadMultiple,
  handleUploadError,
  [
    body('case_id')
      .notEmpty()
      .withMessage('Case ID required')
      .isUUID()
      .withMessage('Invalid case ID format')
  ],
  fileController.uploadMultipleFiles
);

/**
 * GET /api/files/:id
 * Get file details
 */
router.get('/:id',
  authenticate,
  fileController.getFileDetails
);

/**
 * GET /api/files/:id/download
 * Download file (get signed URL)
 */
router.get('/:id/download',
  authenticate,
  fileController.downloadFile
);

/**
 * GET /api/files/case/:caseId
 * Get all files for a case
 */
router.get('/case/:caseId',
  authenticate,
  fileController.getCaseFiles
);

/**
 * DELETE /api/files/:id
 * Delete file
 */
router.delete('/:id',
  authenticate,
  fileController.deleteFile
);

module.exports = router;
