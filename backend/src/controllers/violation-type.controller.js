/**
 * Violation Type Controller
 * Sprint 074 / Story VT-4
 *
 * Serves violation type metadata for dynamic form rendering.
 * Public endpoint — no auth required.
 */

const { ACTIVE_TYPES, FIELD_SCHEMAS, DEFAULT_SEVERITY } = require('../constants/violation-types');

// Category definitions matching the frontend registry
const CATEGORIES = [
  {
    key: 'moving',
    label: 'Moving Violations',
    icon: '🚗',
    types: ['speeding', 'dui', 'reckless_driving', 'seatbelt_cell_phone'],
  },
  {
    key: 'cdl',
    label: 'CDL-Specific',
    icon: '🚛',
    types: ['hos_logbook', 'dot_inspection', 'dqf', 'suspension', 'csa_score'],
  },
  {
    key: 'vehicle',
    label: 'Vehicle & Cargo',
    icon: '🔧',
    types: ['equipment_defect', 'overweight_oversize', 'hazmat', 'railroad_crossing'],
  },
  {
    key: 'other',
    label: 'Other',
    icon: '📋',
    types: ['other'],
  },
];

// Icons per type (matches frontend registry)
const TYPE_ICONS = {
  speeding: '🚗',
  dui: '🍺',
  reckless_driving: '⚠️',
  seatbelt_cell_phone: '📱',
  hos_logbook: '📋',
  dot_inspection: '🔍',
  dqf: '📁',
  suspension: '🚫',
  csa_score: '📊',
  equipment_defect: '🔧',
  overweight_oversize: '⚖️',
  hazmat: '☢️',
  railroad_crossing: '🚂',
  other: '📝',
};

// Labels per type (human-readable)
const TYPE_LABELS = {
  speeding: 'Speeding',
  dui: 'DUI / DWI',
  reckless_driving: 'Reckless Driving',
  seatbelt_cell_phone: 'Seatbelt / Cell Phone',
  hos_logbook: 'HOS / Logbook',
  dot_inspection: 'DOT Inspection',
  dqf: 'Driver Qualification File',
  suspension: 'CDL Suspension',
  csa_score: 'CSA Score Issue',
  equipment_defect: 'Equipment Defect',
  overweight_oversize: 'Overweight / Oversize',
  hazmat: 'Hazmat Violation',
  railroad_crossing: 'Railroad Crossing',
  other: 'Other Violation',
};

// Build the response once (static data)
let cachedResponse = null;

function buildResponse() {
  if (cachedResponse) return cachedResponse;

  const types = ACTIVE_TYPES.map(value => ({
    value,
    label: TYPE_LABELS[value] || value,
    icon: TYPE_ICONS[value] || '📋',
    category: CATEGORIES.find(c => c.types.includes(value))?.key || 'other',
    severity: DEFAULT_SEVERITY[value] || 'standard',
    conditionalFields: FIELD_SCHEMAS[value] || [],
  }));

  const categories = CATEGORIES.map(c => ({
    key: c.key,
    label: c.label,
    icon: c.icon,
    types: c.types.filter(t => ACTIVE_TYPES.includes(t)),
  }));

  cachedResponse = { types, categories };
  return cachedResponse;
}

/**
 * GET /api/violation-types
 * Returns active violation types with metadata for dynamic form rendering.
 * Public — no auth required.
 */
exports.getViolationTypes = (req, res) => {
  res.set('Cache-Control', 'public, max-age=86400');
  res.json(buildResponse());
};
