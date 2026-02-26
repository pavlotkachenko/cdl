/**
 * Template Routes - Message template management routes
 * Location: backend/src/routes/template.routes.js
 */

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/templates
 * @desc    Create new template
 * @access  Private (Operator, Admin)
 */
router.post(
  '/',
  authenticate,
  authorize(['operator', 'admin']),
  templateController.createTemplate
);

/**
 * @route   GET /api/templates
 * @desc    Get all templates with optional filters
 * @access  Private (All authenticated users)
 */
router.get(
  '/',
  authenticate,
  templateController.getAllTemplates
);

/**
 * @route   GET /api/templates/categories
 * @desc    Get template categories
 * @access  Private (All authenticated users)
 */
router.get(
  '/categories',
  authenticate,
  templateController.getTemplateCategories
);

/**
 * @route   GET /api/templates/:templateId
 * @desc    Get template by ID
 * @access  Private (All authenticated users)
 */
router.get(
  '/:templateId',
  authenticate,
  templateController.getTemplateById
);

/**
 * @route   GET /api/templates/category/:category
 * @desc    Get templates by category
 * @access  Private (All authenticated users)
 */
router.get(
  '/category/:category',
  authenticate,
  templateController.getTemplatesByCategory
);

/**
 * @route   PUT /api/templates/:templateId
 * @desc    Update template
 * @access  Private (Operator, Admin)
 */
router.put(
  '/:templateId',
  authenticate,
  authorize(['operator', 'admin']),
  templateController.updateTemplate
);

/**
 * @route   DELETE /api/templates/:templateId
 * @desc    Delete template (soft delete)
 * @access  Private (Admin)
 */
router.delete(
  '/:templateId',
  authenticate,
  authorize(['admin']),
  templateController.deleteTemplate
);

/**
 * @route   GET /api/templates/:templateId/render/:caseId
 * @desc    Render template for specific case
 * @access  Private (All authenticated users)
 */
router.get(
  '/:templateId/render/:caseId',
  authenticate,
  templateController.renderTemplateForCase
);

/**
 * @route   POST /api/templates/preview
 * @desc    Preview template with sample data
 * @access  Private (Operator, Admin)
 */
router.post(
  '/preview',
  authenticate,
  authorize(['operator', 'admin']),
  templateController.previewTemplate
);

module.exports = router;
