/**
 * OCR Service - Ticket data extraction using Tesseract.js
 * Location: backend/src/services/ocr.service.js
 */

const Tesseract = require('tesseract.js');
const logger = require('../utils/logger');

/**
 * Extract ticket data from image buffer
 * @param {Buffer} imageBuffer - Image file buffer
 * @returns {Promise<Object>} Extracted ticket data
 */
const extractTicketData = async (imageBuffer) => {
  try {
    logger.info('Starting OCR extraction...');

    // Perform OCR using Tesseract.js
    const result = await Tesseract.recognize(
      imageBuffer,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    const extractedText = result.data.text;
    const confidence = result.data.confidence;

    logger.info(`OCR extraction complete. Confidence: ${confidence}%`);

    // Parse the extracted text
    const parsedData = parseExtractedText(extractedText);

    // Validate the extraction
    const validation = validateExtraction(parsedData);

    return {
      success: true,
      rawText: extractedText,
      confidence,
      extractedData: parsedData,
      validation,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error in OCR extraction:', error);
    throw error;
  }
};

/**
 * Parse extracted text to identify ticket fields
 * @param {string} text - Raw OCR text
 * @returns {Object} Parsed ticket data
 */
const parseExtractedText = (text) => {
  try {
    const data = {
      citationNumber: null,
      violationDate: null,
      violationType: null,
      location: null,
      officerName: null,
      officerBadge: null,
      driverName: null,
      driverLicense: null,
      vehicleInfo: null,
      fineAmount: null,
      courtDate: null,
      state: null
    };

    // Normalize text
    const normalizedText = text.replace(/\n+/g, '\n').trim();
    const lines = normalizedText.split('\n');

    // Citation/Ticket Number patterns
    const citationPatterns = [
      /(?:citation|ticket|citation\s*#|ticket\s*#|no\.?)\s*:?\s*([A-Z0-9\-]+)/i,
      /^([A-Z]{2}\d{6,10})$/m,
      /\b([A-Z]\d{7,10})\b/
    ];

    for (const pattern of citationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data.citationNumber = match[1].trim();
        break;
      }
    }

    // Date patterns
    const datePatterns = [
      /(?:date|violation\s*date|issued)\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data.violationDate = match[1].trim();
        break;
      }
    }

    // Violation type patterns
    const violationPatterns = [
      /(?:violation|charge|offense)\s*:?\s*([^\n]{10,100})/i,
      /(?:speeding|reckless|DUI|DWI|running\s*red\s*light|expired\s*registration)/i
    ];

    for (const pattern of violationPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.violationType = match[1] ? match[1].trim() : match[0].trim();
        break;
      }
    }

    // Location patterns
    const locationPatterns = [
      /(?:location|address)\s*:?\s*([^\n]{10,100})/i,
      /\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|highway|hwy)/i
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.location = match[1] ? match[1].trim() : match[0].trim();
        break;
      }
    }

    // Officer name and badge
    const officerNamePattern = /(?:officer|issued\s*by)\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i;
    const officerMatch = text.match(officerNamePattern);
    if (officerMatch && officerMatch[1]) {
      data.officerName = officerMatch[1].trim();
    }

    const badgePattern = /(?:badge|id)\s*#?\s*:?\s*(\d{3,6})/i;
    const badgeMatch = text.match(badgePattern);
    if (badgeMatch && badgeMatch[1]) {
      data.officerBadge = badgeMatch[1].trim();
    }

    // Driver license
    const licensePattern = /(?:license|dl|driver\s*license)\s*#?\s*:?\s*([A-Z0-9\-]{6,20})/i;
    const licenseMatch = text.match(licensePattern);
    if (licenseMatch && licenseMatch[1]) {
      data.driverLicense = licenseMatch[1].trim();
    }

    // Fine amount
    const finePattern = /(?:fine|amount|total)\s*:?\s*\$?\s*(\d{1,4}(?:\.\d{2})?)/i;
    const fineMatch = text.match(finePattern);
    if (fineMatch && fineMatch[1]) {
      data.fineAmount = parseFloat(fineMatch[1]);
    }

    // Court date
    const courtDatePattern = /(?:court\s*date|appear\s*by)\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
    const courtMatch = text.match(courtDatePattern);
    if (courtMatch && courtMatch[1]) {
      data.courtDate = courtMatch[1].trim();
    }

    // State (2-letter state code)
    const statePattern = /\b([A-Z]{2})\b/;
    const stateMatches = text.match(new RegExp(statePattern, 'g'));
    if (stateMatches && stateMatches.length > 0) {
      // Common US state codes
      const validStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
                           'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                           'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                           'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                           'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
      
      for (const match of stateMatches) {
        if (validStates.includes(match)) {
          data.state = match;
          break;
        }
      }
    }

    return data;
  } catch (error) {
    logger.error('Error parsing extracted text:', error);
    return {};
  }
};

/**
 * Validate extracted data and provide confidence scores
 * @param {Object} data - Parsed ticket data
 * @returns {Object} Validation results with field-level confidence
 */
const validateExtraction = (data) => {
  try {
    const validation = {
      isValid: false,
      fieldConfidence: {},
      missingFields: [],
      warnings: []
    };

    // Define required fields
    const requiredFields = ['citationNumber', 'violationDate', 'violationType'];
    const optionalFields = ['location', 'officerName', 'driverLicense', 'fineAmount', 'state'];

    // Check required fields
    requiredFields.forEach(field => {
      if (data[field]) {
        validation.fieldConfidence[field] = calculateFieldConfidence(field, data[field]);
      } else {
        validation.missingFields.push(field);
        validation.fieldConfidence[field] = 0;
      }
    });

    // Check optional fields
    optionalFields.forEach(field => {
      if (data[field]) {
        validation.fieldConfidence[field] = calculateFieldConfidence(field, data[field]);
      } else {
        validation.fieldConfidence[field] = 0;
      }
    });

    // Overall validation
    validation.isValid = validation.missingFields.length === 0;

    // Calculate average confidence
    const confidenceValues = Object.values(validation.fieldConfidence);
    const avgConfidence = confidenceValues.length > 0
      ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
      : 0;
    
    validation.overallConfidence = Math.round(avgConfidence);

    // Add warnings for low confidence fields
    Object.entries(validation.fieldConfidence).forEach(([field, confidence]) => {
      if (confidence > 0 && confidence < 70) {
        validation.warnings.push(`Low confidence for field: ${field} (${confidence}%)`);
      }
    });

    return validation;
  } catch (error) {
    logger.error('Error validating extraction:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
};

/**
 * Calculate confidence score for a specific field
 * @param {string} fieldName - Field name
 * @param {any} value - Field value
 * @returns {number} Confidence score (0-100)
 */
const calculateFieldConfidence = (fieldName, value) => {
  if (!value) return 0;

  let confidence = 50; // Base confidence

  switch (fieldName) {
    case 'citationNumber':
      // Citation numbers are usually alphanumeric with specific format
      if (/^[A-Z0-9\-]{6,15}$/.test(value)) confidence = 90;
      else if (/[A-Z0-9]{5,}/.test(value)) confidence = 70;
      break;

    case 'violationDate':
      // Valid date format
      if (/^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/.test(value)) confidence = 85;
      break;

    case 'violationType':
      // Violation type should be descriptive
      if (value.length > 10 && value.length < 100) confidence = 80;
      else if (value.length > 5) confidence = 60;
      break;

    case 'location':
      // Address-like format
      if (/\d+.*(?:street|st|avenue|ave|road|rd|highway|hwy)/i.test(value)) confidence = 85;
      else if (value.length > 10) confidence = 60;
      break;

    case 'officerName':
      // Name format (First Last)
      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(value)) confidence = 90;
      break;

    case 'officerBadge':
      // Badge number (3-6 digits)
      if (/^\d{3,6}$/.test(value)) confidence = 95;
      break;

    case 'driverLicense':
      // License format varies by state
      if (/^[A-Z0-9\-]{6,20}$/.test(value)) confidence = 80;
      break;

    case 'fineAmount':
      // Numeric value
      if (typeof value === 'number' && value > 0) confidence = 90;
      break;

    case 'state':
      // 2-letter state code
      if (/^[A-Z]{2}$/.test(value)) confidence = 95;
      break;

    default:
      confidence = 50;
  }

  return confidence;
};

/**
 * Process multiple ticket images
 * @param {Array<Buffer>} imageBuffers - Array of image buffers
 * @returns {Promise<Array>} Array of extraction results
 */
const processBatchTickets = async (imageBuffers) => {
  try {
    logger.info(`Processing batch of ${imageBuffers.length} tickets`);

    const results = await Promise.all(
      imageBuffers.map(async (buffer, index) => {
        try {
          const result = await extractTicketData(buffer);
          return {
            index,
            success: true,
            ...result
          };
        } catch (error) {
          logger.error(`Error processing image ${index}:`, error);
          return {
            index,
            success: false,
            error: error.message
          };
        }
      })
    );

    return results;
  } catch (error) {
    logger.error('Error in batch processing:', error);
    throw error;
  }
};

module.exports = {
  extractTicketData,
  parseExtractedText,
  validateExtraction,
  calculateFieldConfidence,
  processBatchTickets
};
