/**
 * OCR Controller - Ticket OCR processing endpoints
 * Location: backend/src/controllers/ocr.controller.js
 */

const ocrService = require('../services/ocr.service');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, pdf)'));
    }
  }
}).single('ticket');

/**
 * Process ticket image with OCR
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const processTicket = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    logger.info(`Processing ticket OCR for file: ${req.file.originalname}`);

    // Extract ticket data
    const result = await ocrService.extractTicketData(req.file.buffer);

    res.json({
      success: true,
      message: 'Ticket processed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error processing ticket:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Process multiple ticket images
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const processBatchTickets = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    logger.info(`Processing batch of ${req.files.length} tickets`);

    const imageBuffers = req.files.map(file => file.buffer);
    const results = await ocrService.processBatchTickets(imageBuffers);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      message: `Processed ${results.length} tickets: ${successCount} successful, ${failureCount} failed`,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
        }
      }
    });
  } catch (error) {
    logger.error('Error processing batch tickets:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Validate extracted ticket data
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const validateTicketData = async (req, res) => {
  try {
    const { extractedData } = req.body;

    if (!extractedData) {
      return res.status(400).json({
        success: false,
        error: 'Extracted data is required'
      });
    }

    const validation = ocrService.validateExtraction(extractedData);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    logger.error('Error validating ticket data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Preview template parsing (for testing)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const previewParsing = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const parsedData = ocrService.parseExtractedText(text);
    const validation = ocrService.validateExtraction(parsedData);

    res.json({
      success: true,
      data: {
        parsedData,
        validation
      }
    });
  } catch (error) {
    logger.error('Error previewing parsing:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  processTicket,
  processBatchTickets,
  validateTicketData,
  previewParsing,
  uploadMiddleware: upload
};
