// ============================================
// VALIDATION MIDDLEWARE
// Request validation using express-validator
// ============================================

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validate request and return errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

/**
 * Conversation validation rules
 */
const validateConversation = [
  body('caseId')
    .notEmpty().withMessage('Case ID is required')
    .isUUID().withMessage('Case ID must be a valid UUID'),
  body('attorneyId')
    .notEmpty().withMessage('Attorney ID is required')
    .isUUID().withMessage('Attorney ID must be a valid UUID'),
  validate
];

/**
 * Message validation rules
 */
const validateMessage = [
  body('conversationId')
    .notEmpty().withMessage('Conversation ID is required')
    .isUUID().withMessage('Conversation ID must be a valid UUID'),
  body('recipientId')
    .notEmpty().withMessage('Recipient ID is required')
    .isUUID().withMessage('Recipient ID must be a valid UUID'),
  body('content')
    .notEmpty().withMessage('Message content is required')
    .isString().withMessage('Content must be a string')
    .isLength({ max: 10000 }).withMessage('Content must not exceed 10,000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'file', 'video_link', 'quick_question']).withMessage('Invalid message type'),
  body('priority')
    .optional()
    .isIn(['normal', 'urgent', 'critical']).withMessage('Invalid priority'),
  validate
];

/**
 * Quick question validation rules
 */
const validateQuickQuestion = [
  body('question')
    .notEmpty().withMessage('Question is required')
    .isString().withMessage('Question must be a string')
    .isLength({ min: 5, max: 500 }).withMessage('Question must be between 5 and 500 characters'),
  body('category')
    .optional()
    .isIn(['status', 'court', 'documents', 'meeting', 'general']).withMessage('Invalid category'),
  body('sortOrder')
    .optional()
    .isInt().withMessage('Sort order must be an integer'),
  validate
];

/**
 * Pagination validation rules
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validate
];

/**
 * UUID parameter validation
 */
const validateUUIDParam = (paramName = 'id') => [
  param(paramName)
    .isUUID().withMessage(`${paramName} must be a valid UUID`),
  validate
];

module.exports = {
  validate,
  validateConversation,
  validateMessage,
  validateQuickQuestion,
  validatePagination,
  validateUUIDParam
};
