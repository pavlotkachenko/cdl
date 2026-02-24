// ============================================
// QUICK QUESTION CONTROLLER
// Business logic for quick questions management
// ============================================

const quickQuestionService = require('../services/quick-question.service');
const { AppError } = require('../utils/errors');

/**
 * @desc Get all active quick questions
 * @route GET /api/quick-questions
 * @access Private
 */
const getQuickQuestions = async (req, res, next) => {
  try {
    const category = req.query.category;
    
    const questions = await quickQuestionService.getActiveQuestions(category);

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create new quick question
 * @route POST /api/quick-questions
 * @access Private (Admin)
 */
const createQuickQuestion = async (req, res, next) => {
  try {
    const userRole = req.user.role;

    // Only admins can create quick questions
    if (userRole !== 'admin') {
      throw new AppError('Only admins can create quick questions', 403);
    }

    const { question, category, sortOrder } = req.body;

    const newQuestion = await quickQuestionService.createQuestion({
      question,
      category,
      sortOrder
    });

    res.status(201).json({
      success: true,
      message: 'Quick question created successfully',
      data: newQuestion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update quick question
 * @route PUT /api/quick-questions/:id
 * @access Private (Admin)
 */
const updateQuickQuestion = async (req, res, next) => {
  try {
    const userRole = req.user.role;

    // Only admins can update quick questions
    if (userRole !== 'admin') {
      throw new AppError('Only admins can update quick questions', 403);
    }

    const questionId = req.params.id;
    const updates = req.body;

    const updatedQuestion = await quickQuestionService.updateQuestion(questionId, updates);

    res.json({
      success: true,
      message: 'Quick question updated successfully',
      data: updatedQuestion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete quick question
 * @route DELETE /api/quick-questions/:id
 * @access Private (Admin)
 */
const deleteQuickQuestion = async (req, res, next) => {
  try {
    const userRole = req.user.role;

    // Only admins can delete quick questions
    if (userRole !== 'admin') {
      throw new AppError('Only admins can delete quick questions', 403);
    }

    const questionId = req.params.id;

    await quickQuestionService.deleteQuestion(questionId);

    res.json({
      success: true,
      message: 'Quick question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuickQuestions,
  createQuickQuestion,
  updateQuickQuestion,
  deleteQuickQuestion
};
