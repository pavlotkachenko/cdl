/**
 * Violation Type Constants — Backend
 * Sprint 074 / Story VT-2
 *
 * Mirrors the frontend violation-type-registry.ts.
 * Used for: route validation, JSONB schema validation, API metadata endpoint.
 */

// All violation types including legacy
const ALL_TYPES = [
  'speeding', 'dui', 'reckless_driving', 'seatbelt_cell_phone',
  'hos_logbook', 'dot_inspection', 'dqf', 'suspension', 'csa_score',
  'equipment_defect', 'overweight_oversize', 'hazmat', 'railroad_crossing',
  'other',
  'parking', 'traffic_signal', // legacy — hidden in UI
];

// Active types (excludes legacy)
const ACTIVE_TYPES = ALL_TYPES.filter(t => t !== 'parking' && t !== 'traffic_signal');

const LEGACY_TYPES = ['parking', 'traffic_signal'];

// Valid severity values
const SEVERITY_VALUES = ['critical', 'serious', 'standard', 'minor'];

/**
 * Field schemas per violation type.
 * Each field: { key, type, required, options?, validation? }
 * Types: 'text' | 'number' | 'select' | 'date' | 'boolean'
 */
const FIELD_SCHEMAS = {
  speeding: [
    { key: 'alleged_speed', type: 'number', required: true, validation: { min: 1, max: 300 } },
    { key: 'posted_speed_limit', type: 'number', required: true, validation: { min: 5, max: 100 } },
    { key: 'speed_detection_method', type: 'select', required: false, options: ['radar', 'lidar', 'pacing', 'vascar', 'aircraft'] },
    { key: 'road_zone', type: 'select', required: false, options: ['normal', 'school', 'construction', 'residential'] },
  ],
  dui: [
    { key: 'bac_level', type: 'number', required: false, validation: { min: 0, max: 1 } },
    { key: 'substance_type', type: 'select', required: false, options: ['alcohol', 'marijuana', 'amphetamine', 'cocaine', 'opioid', 'other', 'refusal_to_test'] },
    { key: 'test_type', type: 'select', required: false, options: ['breath', 'blood', 'urine', 'refusal'] },
    { key: 'hazmat_at_time', type: 'boolean', required: false },
  ],
  reckless_driving: [
    { key: 'incident_description', type: 'text', required: false, validation: { maxLength: 500 } },
    { key: 'injuries_involved', type: 'boolean', required: false },
    { key: 'cmv_at_time', type: 'boolean', required: false },
    { key: 'witnesses', type: 'boolean', required: false },
  ],
  seatbelt_cell_phone: [
    { key: 'violation_subtype', type: 'select', required: true, options: ['seatbelt', 'cell_phone', 'texting'] },
    { key: 'device_type', type: 'select', required: false, options: ['handheld', 'hands_free'] },
    { key: 'hands_free_available', type: 'boolean', required: false },
  ],
  hos_logbook: [
    { key: 'violation_subtype', type: 'select', required: false, options: ['driving_limit_11hr', 'window_14hr', 'rest_break_30min', 'weekly_60_70hr', 'eld_malfunction', 'false_log'] },
    { key: 'hours_over_limit', type: 'number', required: false, validation: { min: 0, max: 24 } },
    { key: 'eld_manufacturer', type: 'text', required: false, validation: { maxLength: 100 } },
    { key: 'violation_regulation_code', type: 'text', required: false, validation: { maxLength: 50 } },
  ],
  dot_inspection: [
    { key: 'inspection_level', type: 'select', required: false, options: ['I', 'II', 'III', 'IV', 'V', 'VI'] },
    { key: 'inspection_report_number', type: 'text', required: true, validation: { maxLength: 50 } },
    { key: 'cvsa_decal_issued', type: 'boolean', required: false },
    { key: 'vehicle_oos', type: 'boolean', required: false },
    { key: 'driver_oos', type: 'boolean', required: false },
  ],
  dqf: [
    { key: 'document_type', type: 'select', required: false, options: ['medical_certificate', 'mvr', 'employment_application', 'road_test_certificate', 'annual_review', 'drug_test_records'] },
    { key: 'violation_regulation_code', type: 'text', required: false, validation: { maxLength: 50 } },
    { key: 'document_expiration_date', type: 'date', required: false },
    { key: 'audit_type', type: 'select', required: false, options: ['roadside', 'compliance_review', 'new_entrant', 'complaint'] },
  ],
  suspension: [
    { key: 'suspension_reason', type: 'select', required: false, options: ['serious_traffic_violations', 'major_offense', 'dui', 'leaving_scene', 'felony_with_cmv', 'medical_disqualification', 'unpaid_fines'] },
    { key: 'disqualification_duration', type: 'select', required: false, options: ['60_day', '120_day', '1_year', '3_year', 'lifetime'] },
    { key: 'disqualification_end_date', type: 'date', required: false },
    { key: 'reinstatement_status', type: 'select', required: false, options: ['disqualified', 'eligible', 'pending', 'reinstated'] },
  ],
  csa_score: [
    { key: 'basic_category', type: 'select', required: false, options: ['unsafe_driving', 'crash_indicator', 'hos', 'vehicle_maintenance', 'controlled_substances', 'hazmat', 'driver_fitness'] },
    { key: 'severity_weight', type: 'number', required: false, validation: { min: 1, max: 10 } },
    { key: 'current_percentile', type: 'number', required: false, validation: { min: 0, max: 100 } },
    { key: 'projected_percentile', type: 'number', required: false, validation: { min: 0, max: 100 } },
  ],
  equipment_defect: [
    { key: 'equipment_category', type: 'select', required: false, options: ['brakes', 'tires', 'lights', 'coupling', 'frame', 'steering', 'exhaust', 'windshield', 'mirrors', 'other'] },
    { key: 'responsible_party', type: 'select', required: false, options: ['driver', 'carrier', 'both'] },
    { key: 'vehicle_oos', type: 'boolean', required: false },
    { key: 'pre_trip_inspection_done', type: 'boolean', required: false },
  ],
  overweight_oversize: [
    { key: 'actual_weight', type: 'number', required: false, validation: { min: 0, max: 200000 } },
    { key: 'permitted_weight', type: 'number', required: false, validation: { min: 0, max: 200000 } },
    { key: 'violation_subtype', type: 'select', required: false, options: ['gross_weight', 'axle_weight', 'bridge_formula', 'oversize_height', 'oversize_width', 'oversize_length'] },
    { key: 'weigh_method', type: 'select', required: false, options: ['scale_house', 'portable_scale', 'wim'] },
  ],
  hazmat: [
    { key: 'hazmat_class', type: 'select', required: false, options: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
    { key: 'un_number', type: 'text', required: false, validation: { maxLength: 10 } },
    { key: 'violation_subtype', type: 'select', required: false, options: ['placarding', 'shipping_papers', 'packaging', 'marking_labeling', 'loading_segregation', 'security_plan', 'training', 'endorsement'] },
    { key: 'hazmat_endorsement_valid', type: 'boolean', required: false },
  ],
  railroad_crossing: [
    { key: 'violation_subtype', type: 'select', required: false, options: ['failure_to_stop', 'insufficient_clearance', 'failure_to_obey_signal', 'failure_to_negotiate_safely', 'insufficient_undercarriage_clearance'] },
    { key: 'prior_rr_offenses', type: 'number', required: false, validation: { min: 0, max: 5 } },
    { key: 'crossing_type', type: 'select', required: false, options: ['grade_crossing', 'drawbridge'] },
    { key: 'signal_type', type: 'select', required: false, options: ['gates_and_lights', 'lights_only', 'crossbucks_only', 'none'] },
  ],
  other: [],
  // Legacy types — no conditional fields
  parking: [],
  traffic_signal: [],
};

// Default severity per violation type
const DEFAULT_SEVERITY = {
  speeding: 'serious',
  dui: 'critical',
  reckless_driving: 'serious',
  seatbelt_cell_phone: 'minor',
  hos_logbook: 'serious',
  dot_inspection: 'standard',
  dqf: 'serious',
  suspension: 'critical',
  csa_score: 'standard',
  equipment_defect: 'standard',
  overweight_oversize: 'standard',
  hazmat: 'critical',
  railroad_crossing: 'critical',
  other: 'standard',
  parking: 'minor',
  traffic_signal: 'standard',
};

/**
 * Get field schema for a given violation type.
 * @param {string} violationType
 * @returns {Array} Array of field definitions
 */
function getFieldSchema(violationType) {
  return FIELD_SCHEMAS[violationType] || [];
}

/**
 * Validate type_specific_data against the schema for a given violation type.
 * Permissive on unknown keys (forward compatibility).
 * @param {string} violationType
 * @param {object} data - The type_specific_data JSONB payload
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateTypeSpecificData(violationType, data) {
  const errors = [];
  const schema = getFieldSchema(violationType);

  if (!data || typeof data !== 'object') {
    return { valid: true, errors: [] }; // empty is always valid
  }

  for (const field of schema) {
    const value = data[field.key];

    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field.key} is required for ${violationType} violations`);
      continue;
    }

    // Skip validation if value not provided (and not required)
    if (value === undefined || value === null || value === '') continue;

    // Type validation
    switch (field.type) {
      case 'number': {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`${field.key} must be a number`);
        } else if (field.validation) {
          if (field.validation.min !== undefined && num < field.validation.min) {
            errors.push(`${field.key} must be at least ${field.validation.min}`);
          }
          if (field.validation.max !== undefined && num > field.validation.max) {
            errors.push(`${field.key} must be at most ${field.validation.max}`);
          }
        }
        break;
      }
      case 'text': {
        if (typeof value !== 'string') {
          errors.push(`${field.key} must be a string`);
        } else if (field.validation?.maxLength && value.length > field.validation.maxLength) {
          errors.push(`${field.key} must be at most ${field.validation.maxLength} characters`);
        }
        break;
      }
      case 'select': {
        if (field.options && !field.options.includes(String(value))) {
          errors.push(`${field.key} must be one of: ${field.options.join(', ')}`);
        }
        break;
      }
      case 'date': {
        if (typeof value === 'string' && isNaN(Date.parse(value))) {
          errors.push(`${field.key} must be a valid date`);
        }
        break;
      }
      case 'boolean': {
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          errors.push(`${field.key} must be a boolean`);
        }
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get the default severity for a violation type.
 * @param {string} violationType
 * @returns {string|null}
 */
function getDefaultSeverity(violationType) {
  return DEFAULT_SEVERITY[violationType] || null;
}

module.exports = {
  ALL_TYPES,
  ACTIVE_TYPES,
  LEGACY_TYPES,
  SEVERITY_VALUES,
  FIELD_SCHEMAS,
  DEFAULT_SEVERITY,
  getFieldSchema,
  validateTypeSpecificData,
  getDefaultSeverity,
};
