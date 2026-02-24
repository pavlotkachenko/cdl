// ============================================
// QUICK QUESTIONS ROUTES
// REST API endpoints for predefined quick questions
// ============================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const quickQuestionController = require('../controllers/quick-question.controller');

/**
 * @route GET /api/quick-questions
 * @desc Get all active quick questions
 * @access Private
 */
router.get('/', authenticate, quickQuestionController.getQuickQuestions);

/**
 * @route POST /api/quick-questions
 * @desc Create new quick question (Admin only)
 * @access Private (Admin)
 */
router.post('/', authenticate, quickQuestionController.createQuickQuestion);

/**
 * @route PUT /api/quick-questions/:id
 * @desc Update quick question (Admin only)
 * @access Private (Admin)
 */
router.put('/:id', authenticate, quickQuestionController.updateQuickQuestion);

/**
 * @route DELETE /api/quick-questions/:id
 * @desc Delete quick question (Admin only)
 * @access Private (Admin)
 */
router.delete('/:id', authenticate, quickQuestionController.deleteQuickQuestion);

module.exports = router;
