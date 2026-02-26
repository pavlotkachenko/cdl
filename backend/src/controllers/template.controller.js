/**
 * Template Controller - Message template management endpoints
 * Location: backend/src/controllers/template.controller.js
 */

const templateService = require('../services/template.service');
const logger = require('../utils/logger');

/**
 * Create new template
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const createTemplate = async (req, res) => {
  try {
    const { name, category, subject, body, variables, isActive } = req.body;
    const userId = req.user?.userId;

    if (!name || !category || !body) {
      return res.status(400).json({
        success: false,
        error: 'Name, category, and body are required'
      });
    }

    const template = await templateService.createTemplate({
      name,
      category,
      subject,
      body,
      variables,
      isActive,
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    logger.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all templates
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getAllTemplates = async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      createdBy: req.query.createdBy
    };

    const templates = await templateService.getAllTemplates(filters);

    res.json({
      success: true,
      data: {
        templates,
        count: templates.length
      }
    });
  } catch (error) {
    logger.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get template by ID
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getTemplateById = async (req, res) => {
  try {
    const { templateId } = req.params;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }

    const template = await templateService.getTemplateById(templateId);

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Error getting template:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get templates by category
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getTemplatesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Category is required'
      });
    }

    const templates = await templateService.getTemplatesByCategory(category);

    res.json({
      success: true,
      data: {
        category,
        templates,
        count: templates.length
      }
    });
  } catch (error) {
    logger.error('Error getting templates by category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update template
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const updateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const updates = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }

    const template = await templateService.updateTemplate(templateId, updates);

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    logger.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete template
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const deleteTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }

    const result = await templateService.deleteTemplate(templateId);

    res.json({
      success: true,
      message: 'Template deleted successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Render template for case
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const renderTemplateForCase = async (req, res) => {
  try {
    const { templateId, caseId } = req.params;

    if (!templateId || !caseId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID and Case ID are required'
      });
    }

    const rendered = await templateService.renderTemplateForCase(templateId, caseId);

    res.json({
      success: true,
      data: rendered
    });
  } catch (error) {
    logger.error('Error rendering template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Preview template with sample data
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const previewTemplate = async (req, res) => {
  try {
    const { templateBody, sampleData } = req.body;

    if (!templateBody) {
      return res.status(400).json({
        success: false,
        error: 'Template body is required'
      });
    }

    const preview = templateService.previewTemplate(templateBody, sampleData);

    res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    logger.error('Error previewing template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get template categories
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getTemplateCategories = async (req, res) => {
  try {
    const categories = await templateService.getTemplateCategories();

    res.json({
      success: true,
      data: {
        categories,
        count: categories.length
      }
    });
  } catch (error) {
    logger.error('Error getting template categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  getTemplatesByCategory,
  updateTemplate,
  deleteTemplate,
  renderTemplateForCase,
  previewTemplate,
  getTemplateCategories
};
