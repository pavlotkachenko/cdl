/**
 * Violation Type Registry Tests
 * Sprint 074 / Story VT-8
 */
import { describe, it, expect } from 'vitest';

import {
  VIOLATION_TYPE_REGISTRY,
  ACTIVE_VIOLATION_TYPES,
  LEGACY_VIOLATION_TYPES,
  VIOLATION_CATEGORIES,
  getViolationTypeConfig,
  getConditionalFields,
  resolveSelectLabel,
  type ConditionalField,
} from './violation-type-registry';

describe('VIOLATION_TYPE_REGISTRY', () => {
  it('has entries for all 14 active types', () => {
    expect(Object.keys(VIOLATION_TYPE_REGISTRY)).toHaveLength(14);
  });

  it('each entry has required fields: value, label, icon, category, severity, conditionalFields, fineRange', () => {
    for (const [key, config] of Object.entries(VIOLATION_TYPE_REGISTRY)) {
      expect(config.value).toBe(key);
      expect(config.label).toBeTruthy();
      expect(config.icon).toBeTruthy();
      expect(['moving', 'cdl_specific', 'vehicle_cargo', 'other']).toContain(config.category);
      expect(['critical', 'serious', 'standard', 'minor']).toContain(config.severity);
      expect(Array.isArray(config.conditionalFields)).toBe(true);
      expect(config.fineRange).toBeDefined();
      expect(typeof config.fineRange.min).toBe('number');
      expect(typeof config.fineRange.max).toBe('number');
      expect(typeof config.disqualificationRisk).toBe('boolean');
      expect(Array.isArray(config.defenseStrategies)).toBe(true);
    }
  });
});

describe('ACTIVE_VIOLATION_TYPES', () => {
  it('has 14 entries', () => {
    expect(ACTIVE_VIOLATION_TYPES).toHaveLength(14);
  });

  it('does not include parking or traffic_signal', () => {
    const values = ACTIVE_VIOLATION_TYPES.map(t => t.value);
    expect(values).not.toContain('parking');
    expect(values).not.toContain('traffic_signal');
  });
});

describe('LEGACY_VIOLATION_TYPES', () => {
  it('is [parking, traffic_signal]', () => {
    expect(LEGACY_VIOLATION_TYPES).toEqual(['parking', 'traffic_signal']);
  });
});

describe('VIOLATION_CATEGORIES', () => {
  it('has 4 entries in correct order', () => {
    expect(VIOLATION_CATEGORIES).toHaveLength(4);
    expect(VIOLATION_CATEGORIES.map(c => c.key)).toEqual([
      'moving', 'cdl_specific', 'vehicle_cargo', 'other',
    ]);
  });

  it('category types sum to 14 (no duplicates, no missing)', () => {
    const allTypesFromCategories = VIOLATION_CATEGORIES.flatMap(c => c.types);
    expect(allTypesFromCategories).toHaveLength(14);
    const unique = new Set(allTypesFromCategories);
    expect(unique.size).toBe(14);
  });

  it('every category type exists in the registry', () => {
    for (const cat of VIOLATION_CATEGORIES) {
      for (const type of cat.types) {
        expect(VIOLATION_TYPE_REGISTRY[type]).toBeDefined();
      }
    }
  });
});

describe('Conditional fields per type', () => {
  it('speeding has 4 conditional fields', () => {
    const fields = VIOLATION_TYPE_REGISTRY['speeding'].conditionalFields;
    expect(fields).toHaveLength(4);
    expect(fields.map(f => f.key)).toEqual([
      'alleged_speed', 'posted_speed_limit', 'speed_detection_method', 'road_zone',
    ]);
  });

  it('dui has 4 conditional fields', () => {
    expect(VIOLATION_TYPE_REGISTRY['dui'].conditionalFields).toHaveLength(4);
  });

  it('other has 0 conditional fields', () => {
    expect(VIOLATION_TYPE_REGISTRY['other'].conditionalFields).toHaveLength(0);
  });

  it('all select-type fields have non-empty options array', () => {
    for (const config of Object.values(VIOLATION_TYPE_REGISTRY)) {
      for (const field of config.conditionalFields) {
        if (field.type === 'select') {
          expect(field.options).toBeDefined();
          expect(field.options!.length).toBeGreaterThan(0);
          for (const opt of field.options!) {
            expect(opt.value).toBeTruthy();
            expect(opt.label).toBeTruthy();
          }
        }
      }
    }
  });

  it('all required fields have required: true', () => {
    // Speeding has alleged_speed and posted_speed_limit as required
    const speedingRequired = VIOLATION_TYPE_REGISTRY['speeding'].conditionalFields
      .filter(f => f.required);
    expect(speedingRequired).toHaveLength(2);
    expect(speedingRequired.map(f => f.key)).toContain('alleged_speed');
    expect(speedingRequired.map(f => f.key)).toContain('posted_speed_limit');

    // seatbelt_cell_phone has violation_subtype as required
    const seatbeltRequired = VIOLATION_TYPE_REGISTRY['seatbelt_cell_phone'].conditionalFields
      .filter(f => f.required);
    expect(seatbeltRequired).toHaveLength(1);
    expect(seatbeltRequired[0].key).toBe('violation_subtype');
  });
});

describe('disqualificationRisk', () => {
  it('DUI has disqualificationRisk: true', () => {
    expect(VIOLATION_TYPE_REGISTRY['dui'].disqualificationRisk).toBe(true);
  });

  it('suspension has disqualificationRisk: true', () => {
    expect(VIOLATION_TYPE_REGISTRY['suspension'].disqualificationRisk).toBe(true);
  });

  it('railroad_crossing has disqualificationRisk: true', () => {
    expect(VIOLATION_TYPE_REGISTRY['railroad_crossing'].disqualificationRisk).toBe(true);
  });

  it('speeding has disqualificationRisk: false', () => {
    expect(VIOLATION_TYPE_REGISTRY['speeding'].disqualificationRisk).toBe(false);
  });
});

describe('getViolationTypeConfig()', () => {
  it('returns config for valid type', () => {
    const config = getViolationTypeConfig('speeding');
    expect(config).toBeDefined();
    expect(config!.label).toBe('Speeding');
  });

  it('returns undefined for unknown type', () => {
    expect(getViolationTypeConfig('nonexistent')).toBeUndefined();
  });
});

describe('getConditionalFields()', () => {
  it('returns fields for valid type', () => {
    const fields = getConditionalFields('dui');
    expect(fields).toHaveLength(4);
  });

  it('returns empty array for unknown type', () => {
    expect(getConditionalFields('nonexistent')).toEqual([]);
  });
});

describe('resolveSelectLabel()', () => {
  it('resolves a select field value to its label', () => {
    const field: ConditionalField = {
      key: 'speed_detection_method',
      label: 'Detection Method',
      type: 'select',
      required: false,
      options: [
        { value: 'radar', label: 'Radar' },
        { value: 'lidar', label: 'Lidar' },
      ],
    };
    expect(resolveSelectLabel(field, 'radar')).toBe('Radar');
    expect(resolveSelectLabel(field, 'lidar')).toBe('Lidar');
  });

  it('returns raw value when option not found', () => {
    const field: ConditionalField = {
      key: 'test',
      label: 'Test',
      type: 'select',
      required: false,
      options: [{ value: 'a', label: 'A' }],
    };
    expect(resolveSelectLabel(field, 'unknown')).toBe('unknown');
  });

  it('returns raw value for non-select fields', () => {
    const field: ConditionalField = {
      key: 'test',
      label: 'Test',
      type: 'text',
      required: false,
    };
    expect(resolveSelectLabel(field, 'hello')).toBe('hello');
  });
});
