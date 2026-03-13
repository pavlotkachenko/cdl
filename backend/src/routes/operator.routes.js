/**
 * Operator Routes - Case queue management
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const operatorController = require('../controllers/operator.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Multer for batch OCR: memory storage, max 10 files, images + PDF only, 10MB each
const ocrUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

/**
 * GET /api/operator/cases
 * Get cases queue (default status=new)
 * Access: Operators, Admins
 */
router.get(
  '/cases',
  authenticate,
  authorize(['operator', 'admin']),
  operatorController.getOperatorCases
);

/**
 * GET /api/operator/unassigned
 * Get unassigned cases for the queue
 * Access: Operators, Admins
 */
router.get(
  '/unassigned',
  authenticate,
  authorize(['operator', 'admin']),
  operatorController.getUnassignedCases
);

/**
 * GET /api/operator/cases/:caseId
 * Get full case detail (driver, attorney, court dates, activity log)
 * Access: Operators (own cases), Admins (any case)
 */
router.get(
  '/cases/:caseId',
  authenticate,
  authorize(['operator', 'admin']),
  operatorController.getCaseDetail
);

/**
 * PATCH /api/operator/cases/:caseId/status
 * Update case status with optional note
 * Access: Operators (own cases), Admins (any case)
 */
router.patch(
  '/cases/:caseId/status',
  authenticate,
  authorize(['operator', 'admin']),
  operatorController.updateCaseStatus
);

/**
 * POST /api/operator/cases/:caseId/request-assignment
 * Operator requests assignment to an unassigned case
 * Access: Operators
 */
router.post(
  '/cases/:caseId/request-assignment',
  authenticate,
  authorize(['operator']),
  operatorController.requestAssignment
);

/**
 * GET /api/operator/cases/:caseId/conversation
 * Get or create conversation for a case
 * Access: Operators (own cases), Admins (any case)
 */
router.get(
  '/cases/:caseId/conversation',
  authenticate,
  authorize(['operator', 'admin']),
  operatorController.getCaseConversation
);

/**
 * GET /api/operator/cases/:caseId/messages
 * Get messages for a case conversation
 * Access: Operators (own cases), Admins (any case)
 */
router.get(
  '/cases/:caseId/messages',
  authenticate,
  authorize(['operator', 'admin']),
  operatorController.getCaseMessages
);

/**
 * POST /api/operator/cases/:caseId/messages
 * Send a message in the case conversation
 * Access: Operators (own cases), Admins (any case)
 */
router.post(
  '/cases/:caseId/messages',
  authenticate,
  authorize(['operator', 'admin']),
  operatorController.sendCaseMessage
);

/**
 * POST /api/operator/batch-ocr
 * Process multiple ticket images through OCR
 * Access: Operators, Admins
 */
router.post(
  '/batch-ocr',
  authenticate,
  authorize(['operator', 'admin']),
  ocrUpload.array('tickets', 10),
  operatorController.batchOcr
);

/**
 * GET /api/operator/attorneys
 * Get available attorneys for manual assignment
 * Access: Operators, Admins
 */
router.get(
  '/attorneys',
  authenticate,
  authorize(['operator', 'admin']),
  operatorController.getAvailableAttorneys
);

module.exports = router;
