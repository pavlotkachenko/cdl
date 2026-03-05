/**
 * OCR Routes - Ticket OCR processing routes
 * Location: backend/src/routes/ocr.routes.js
 */

const express = require('express');
const router = express.Router();
const ocrController = require('../controllers/ocr.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/ocr/extract
 * @desc    Extract ticket data from photo (driver-accessible)
 * @access  Private (all authenticated users)
 */
router.post(
  '/extract',
  authenticate,
  ocrController.uploadMiddleware,
  ocrController.processTicket
);

/**
 * @route   POST /api/ocr/ticket
 * @desc    Process single ticket image with OCR
 * @access  Private (Operator, Admin)
 */
router.post(
  '/ticket',
  authenticate,
  authorize(['operator', 'admin']),
  ocrController.uploadMiddleware,
  ocrController.processTicket
);

/**
 * @route   POST /api/ocr/batch
 * @desc    Process multiple ticket images
 * @access  Private (Operator, Admin)
 */
router.post(
  '/batch',
  authenticate,
  authorize(['operator', 'admin']),
  ocrController.processBatchTickets
);

/**
 * @route   POST /api/ocr/validate
 * @desc    Validate extracted ticket data
 * @access  Private (Operator, Admin)
 */
router.post(
  '/validate',
  authenticate,
  authorize(['operator', 'admin']),
  ocrController.validateTicketData
);

/**
 * @route   POST /api/ocr/preview
 * @desc    Preview parsing of raw text
 * @access  Private (Operator, Admin)
 */
router.post(
  '/preview',
  authenticate,
  authorize(['operator', 'admin']),
  ocrController.previewParsing
);

module.exports = router;
