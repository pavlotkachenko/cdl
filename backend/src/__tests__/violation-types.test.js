/**
 * Violation Type System Tests
 * Sprint 074 / Story VT-8
 *
 * Covers: constants, field schemas, JSONB validation,
 * validation middleware, and GET /api/violation-types endpoint.
 */

const {
  ALL_TYPES,
  ACTIVE_TYPES,
  LEGACY_TYPES,
  SEVERITY_VALUES,
  FIELD_SCHEMAS,
  DEFAULT_SEVERITY,
  getFieldSchema,
  validateTypeSpecificData,
  getDefaultSeverity,
} = require('../constants/violation-types');

const { validateTypeSpecificDataMiddleware } = require('../middleware/violation-validation.middleware');

// ============================================================
// Constants & Field Schema
// ============================================================

describe('Violation Type Constants', () => {
  it('ALL_TYPES has 16 entries', () => {
    expect(ALL_TYPES).toHaveLength(16);
  });

  it('ACTIVE_TYPES has 14 entries (excludes parking, traffic_signal)', () => {
    expect(ACTIVE_TYPES).toHaveLength(14);
    expect(ACTIVE_TYPES).not.toContain('parking');
    expect(ACTIVE_TYPES).not.toContain('traffic_signal');
  });

  it('LEGACY_TYPES is [parking, traffic_signal]', () => {
    expect(LEGACY_TYPES).toEqual(['parking', 'traffic_signal']);
  });

  it('SEVERITY_VALUES has 4 values', () => {
    expect(SEVERITY_VALUES).toEqual(['critical', 'serious', 'standard', 'minor']);
  });

  it('every active type has a field schema entry', () => {
    for (const type of ACTIVE_TYPES) {
      expect(FIELD_SCHEMAS).toHaveProperty(type);
      expect(Array.isArray(FIELD_SCHEMAS[type])).toBe(true);
    }
  });

  it('every active type has a default severity', () => {
    for (const type of ACTIVE_TYPES) {
      expect(DEFAULT_SEVERITY).toHaveProperty(type);
      expect(SEVERITY_VALUES).toContain(DEFAULT_SEVERITY[type]);
    }
  });
});

describe('getFieldSchema()', () => {
  it('returns 4 fields for speeding', () => {
    const schema = getFieldSchema('speeding');
    expect(schema).toHaveLength(4);
    const keys = schema.map(f => f.key);
    expect(keys).toEqual(['alleged_speed', 'posted_speed_limit', 'speed_detection_method', 'road_zone']);
  });

  it('returns empty array for "other"', () => {
    expect(getFieldSchema('other')).toEqual([]);
  });

  it('returns empty array for nonexistent type', () => {
    expect(getFieldSchema('nonexistent')).toEqual([]);
  });

  it('returns empty array for legacy types', () => {
    expect(getFieldSchema('parking')).toEqual([]);
    expect(getFieldSchema('traffic_signal')).toEqual([]);
  });

  it('each field has key, type, and required properties', () => {
    for (const type of ACTIVE_TYPES) {
      const schema = getFieldSchema(type);
      for (const field of schema) {
        expect(field).toHaveProperty('key');
        expect(field).toHaveProperty('type');
        expect(field).toHaveProperty('required');
        expect(['text', 'number', 'select', 'date', 'boolean']).toContain(field.type);
      }
    }
  });

  it('select fields have non-empty options arrays', () => {
    for (const type of ACTIVE_TYPES) {
      const schema = getFieldSchema(type);
      for (const field of schema) {
        if (field.type === 'select') {
          expect(field.options).toBeDefined();
          expect(field.options.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('getDefaultSeverity()', () => {
  it('returns "serious" for speeding', () => {
    expect(getDefaultSeverity('speeding')).toBe('serious');
  });

  it('returns "critical" for dui', () => {
    expect(getDefaultSeverity('dui')).toBe('critical');
  });

  it('returns null for nonexistent type', () => {
    expect(getDefaultSeverity('nonexistent')).toBeNull();
  });
});

// ============================================================
// JSONB Validation
// ============================================================

describe('validateTypeSpecificData()', () => {
  // --- Speeding ---
  it('speeding: valid alleged_speed', () => {
    const result = validateTypeSpecificData('speeding', { alleged_speed: 82, posted_speed_limit: 65 });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('speeding: invalid alleged_speed < min', () => {
    const result = validateTypeSpecificData('speeding', { alleged_speed: -1, posted_speed_limit: 65 });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('alleged_speed'))).toBe(true);
  });

  it('speeding: alleged_speed is not a number', () => {
    const result = validateTypeSpecificData('speeding', { alleged_speed: 'fast', posted_speed_limit: 65 });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('alleged_speed'))).toBe(true);
  });

  it('speeding: missing required fields', () => {
    const result = validateTypeSpecificData('speeding', {});
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('alleged_speed'))).toBe(true);
    expect(result.errors.some(e => e.includes('posted_speed_limit'))).toBe(true);
  });

  // --- DUI ---
  it('dui: valid bac_level', () => {
    const result = validateTypeSpecificData('dui', { bac_level: 0.06 });
    expect(result.valid).toBe(true);
  });

  it('dui: empty object is valid (no required fields)', () => {
    const result = validateTypeSpecificData('dui', {});
    expect(result.valid).toBe(true);
  });

  // --- DOT Inspection ---
  it('dot_inspection: valid inspection_report_number', () => {
    const result = validateTypeSpecificData('dot_inspection', { inspection_report_number: 'RPT-123' });
    expect(result.valid).toBe(true);
  });

  // --- Other ---
  it('other: empty object is valid', () => {
    const result = validateTypeSpecificData('other', {});
    expect(result.valid).toBe(true);
  });

  it('other: unknown fields are ignored (forward compatibility)', () => {
    const result = validateTypeSpecificData('other', { random_field: 'value' });
    expect(result.valid).toBe(true);
  });

  // --- Overweight ---
  it('overweight_oversize: valid weights', () => {
    const result = validateTypeSpecificData('overweight_oversize', {
      actual_weight: 82000,
      permitted_weight: 80000,
    });
    expect(result.valid).toBe(true);
  });

  // --- Hazmat ---
  it('hazmat: valid hazmat_class and un_number', () => {
    const result = validateTypeSpecificData('hazmat', {
      hazmat_class: '3',
      un_number: '1203',
    });
    expect(result.valid).toBe(true);
  });

  // --- Railroad Crossing ---
  it('railroad_crossing: prior_rr_offenses exceeds max', () => {
    const result = validateTypeSpecificData('railroad_crossing', { prior_rr_offenses: 6 });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('prior_rr_offenses'))).toBe(true);
  });

  it('railroad_crossing: valid prior_rr_offenses', () => {
    const result = validateTypeSpecificData('railroad_crossing', { prior_rr_offenses: 3 });
    expect(result.valid).toBe(true);
  });

  // --- Edge cases ---
  it('null data returns valid', () => {
    const result = validateTypeSpecificData('speeding', null);
    expect(result.valid).toBe(true);
  });

  it('nonexistent type returns valid (no schema to validate against)', () => {
    const result = validateTypeSpecificData('nonexistent', { foo: 'bar' });
    expect(result.valid).toBe(true);
  });

  // --- Text field validation ---
  it('hos_logbook: eld_manufacturer exceeds maxLength', () => {
    const result = validateTypeSpecificData('hos_logbook', {
      eld_manufacturer: 'x'.repeat(101),
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('eld_manufacturer'))).toBe(true);
  });

  // --- Select field validation ---
  it('speeding: invalid speed_detection_method option', () => {
    const result = validateTypeSpecificData('speeding', {
      alleged_speed: 80,
      posted_speed_limit: 65,
      speed_detection_method: 'magic',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('speed_detection_method'))).toBe(true);
  });

  // --- Boolean field validation ---
  it('dui: hazmat_at_time with valid boolean', () => {
    const result = validateTypeSpecificData('dui', { hazmat_at_time: true });
    expect(result.valid).toBe(true);
  });

  it('dui: hazmat_at_time with invalid value', () => {
    const result = validateTypeSpecificData('dui', { hazmat_at_time: 'maybe' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('hazmat_at_time'))).toBe(true);
  });
});

// ============================================================
// Validation Middleware
// ============================================================

describe('validateTypeSpecificDataMiddleware', () => {
  function makeReq(body = {}) {
    return { body };
  }
  function makeRes() {
    const res = { json: jest.fn(), status: jest.fn(), set: jest.fn() };
    res.status.mockReturnValue(res);
    return res;
  }

  it('passes through when type_specific_data is absent', () => {
    const req = makeReq({ violation_type: 'speeding' });
    const res = makeRes();
    const next = jest.fn();
    validateTypeSpecificDataMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('passes through when type_specific_data is empty object', () => {
    const req = makeReq({ violation_type: 'speeding', type_specific_data: {} });
    const res = makeRes();
    const next = jest.fn();
    validateTypeSpecificDataMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 400 when type_specific_data is not an object', () => {
    const req = makeReq({ violation_type: 'speeding', type_specific_data: 'string' });
    const res = makeRes();
    const next = jest.fn();
    validateTypeSpecificDataMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'INVALID_TYPE_SPECIFIC_DATA' }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when type_specific_data is an array', () => {
    const req = makeReq({ violation_type: 'speeding', type_specific_data: [1, 2] });
    const res = makeRes();
    const next = jest.fn();
    validateTypeSpecificDataMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes through when violation_type is absent', () => {
    const req = makeReq({ type_specific_data: { foo: 'bar' } });
    const res = makeRes();
    const next = jest.fn();
    validateTypeSpecificDataMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('passes through when violation_type is unrecognized', () => {
    const req = makeReq({ violation_type: 'alien_invasion', type_specific_data: { foo: 1 } });
    const res = makeRes();
    const next = jest.fn();
    validateTypeSpecificDataMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('passes through with valid speeding data', () => {
    const req = makeReq({
      violation_type: 'speeding',
      type_specific_data: { alleged_speed: 80, posted_speed_limit: 65 },
    });
    const res = makeRes();
    const next = jest.fn();
    validateTypeSpecificDataMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 400 with field-level errors for invalid speeding data', () => {
    const req = makeReq({
      violation_type: 'speeding',
      type_specific_data: { alleged_speed: -5, posted_speed_limit: 65 },
    });
    const res = makeRes();
    const next = jest.fn();
    validateTypeSpecificDataMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.error.code).toBe('INVALID_TYPE_SPECIFIC_DATA');
    expect(body.error.fields.length).toBeGreaterThan(0);
    expect(next).not.toHaveBeenCalled();
  });
});

// ============================================================
// Violation Types Endpoint
// ============================================================

describe('GET /api/violation-types endpoint', () => {
  // Reset cached response between tests
  let getViolationTypes;

  beforeEach(() => {
    jest.resetModules();
    const controller = require('../controllers/violation-type.controller');
    getViolationTypes = controller.getViolationTypes;
  });

  function makeReq() {
    return {};
  }
  function makeRes() {
    const res = { json: jest.fn(), set: jest.fn(), status: jest.fn() };
    res.status.mockReturnValue(res);
    return res;
  }

  it('returns 200 with types and categories', () => {
    const req = makeReq();
    const res = makeRes();
    getViolationTypes(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.types).toBeDefined();
    expect(body.categories).toBeDefined();
  });

  it('returns 14 active types (no parking, traffic_signal)', () => {
    const req = makeReq();
    const res = makeRes();
    getViolationTypes(req, res);
    const body = res.json.mock.calls[0][0];
    expect(body.types).toHaveLength(14);
    const values = body.types.map(t => t.value);
    expect(values).not.toContain('parking');
    expect(values).not.toContain('traffic_signal');
  });

  it('returns 4 categories', () => {
    const req = makeReq();
    const res = makeRes();
    getViolationTypes(req, res);
    const body = res.json.mock.calls[0][0];
    expect(body.categories).toHaveLength(4);
    const keys = body.categories.map(c => c.key);
    expect(keys).toEqual(['moving', 'cdl', 'vehicle', 'other']);
  });

  it('each type has conditionalFields array', () => {
    const req = makeReq();
    const res = makeRes();
    getViolationTypes(req, res);
    const body = res.json.mock.calls[0][0];
    for (const type of body.types) {
      expect(type).toHaveProperty('value');
      expect(type).toHaveProperty('label');
      expect(type).toHaveProperty('icon');
      expect(type).toHaveProperty('category');
      expect(type).toHaveProperty('severity');
      expect(Array.isArray(type.conditionalFields)).toBe(true);
    }
  });

  it('sets Cache-Control header', () => {
    const req = makeReq();
    const res = makeRes();
    getViolationTypes(req, res);
    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
  });
});
