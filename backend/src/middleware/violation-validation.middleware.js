/**
 * Violation Type-Specific Data Validation Middleware
 * Sprint 074 / Story VT-4
 *
 * Validates `type_specific_data` JSONB against the field schema
 * defined in the backend violation-types registry.
 */

const { validateTypeSpecificData, ALL_TYPES } = require('../constants/violation-types');

/**
 * Express middleware that validates req.body.type_specific_data
 * against the schema for the given req.body.violation_type.
 *
 * - Passes through if type_specific_data is absent or empty {}
 * - Ignores unknown fields (forward compatibility)
 * - Returns 400 with field-level errors on validation failure
 */
function validateTypeSpecificDataMiddleware(req, res, next) {
  const { violation_type, type_specific_data } = req.body;

  // Nothing to validate if no type_specific_data provided
  if (!type_specific_data || (typeof type_specific_data === 'object' && Object.keys(type_specific_data).length === 0)) {
    return next();
  }

  // If type_specific_data is present but not an object, reject
  if (typeof type_specific_data !== 'object' || Array.isArray(type_specific_data)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_TYPE_SPECIFIC_DATA',
        message: 'type_specific_data must be a JSON object',
        fields: ['type_specific_data'],
      },
    });
  }

  // If no violation_type provided, skip schema validation (can't validate without type)
  if (!violation_type) {
    return next();
  }

  // Validate violation_type is recognized
  if (!ALL_TYPES.includes(violation_type)) {
    return next(); // Let express-validator handle unknown type errors
  }

  const result = validateTypeSpecificData(violation_type, type_specific_data);

  if (!result.valid) {
    return res.status(400).json({
      error: {
        code: 'INVALID_TYPE_SPECIFIC_DATA',
        message: `Validation failed for ${violation_type} type-specific data`,
        fields: result.errors,
      },
    });
  }

  next();
}

module.exports = { validateTypeSpecificDataMiddleware };
