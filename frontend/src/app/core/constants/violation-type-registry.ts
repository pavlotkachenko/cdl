// ============================================
// Violation Type Registry — Single Source of Truth
// ============================================
// Sprint 074 / Story VT-2
// Defines all violation types with metadata, conditional fields,
// severity, CSA BASIC mappings, and UI categorization.
// Used by: submit-ticket form, case-detail display, backend validation.

// --- Interfaces ---

export type ViolationCategory = 'moving' | 'cdl_specific' | 'vehicle_cargo' | 'other';
export type ViolationSeverity = 'critical' | 'serious' | 'standard' | 'minor';
export type FieldType = 'text' | 'number' | 'select' | 'date' | 'boolean';

export interface ConditionalField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: { value: string; label: string }[];
  validation?: { min?: number; max?: number; maxLength?: number; step?: number };
  helpText?: string;
}

export interface ViolationTypeConfig {
  value: string;
  label: string;
  icon: string;
  category: ViolationCategory;
  severity: ViolationSeverity;
  csaBasic?: string;
  regulationRef?: string;
  conditionalFields: ConditionalField[];
  fineRange: { min: number; max: number };
  disqualificationRisk: boolean;
  defenseStrategies: string[];
}

export interface ViolationCategoryConfig {
  key: ViolationCategory;
  label: string;
  types: string[];
}

// --- Registry ---

export const VIOLATION_TYPE_REGISTRY: Record<string, ViolationTypeConfig> = {
  // ═══════════════════════════════════════
  // MOVING VIOLATIONS
  // ═══════════════════════════════════════
  speeding: {
    value: 'speeding',
    label: 'Speeding',
    icon: '🚗',
    category: 'moving',
    severity: 'serious',
    csaBasic: 'Unsafe Driving',
    regulationRef: '49 CFR 392.2',
    conditionalFields: [
      {
        key: 'alleged_speed',
        label: 'Alleged Speed (mph)',
        type: 'number',
        required: true,
        validation: { min: 1, max: 300 },
        helpText: 'Speed recorded on citation',
      },
      {
        key: 'posted_speed_limit',
        label: 'Posted Speed Limit (mph)',
        type: 'number',
        required: true,
        validation: { min: 5, max: 100 },
      },
      {
        key: 'speed_detection_method',
        label: 'Detection Method',
        type: 'select',
        required: false,
        options: [
          { value: 'radar', label: 'Radar' },
          { value: 'lidar', label: 'Lidar' },
          { value: 'pacing', label: 'Pacing' },
          { value: 'vascar', label: 'VASCAR' },
          { value: 'aircraft', label: 'Aircraft' },
        ],
      },
      {
        key: 'road_zone',
        label: 'Road Zone',
        type: 'select',
        required: false,
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'school', label: 'School Zone' },
          { value: 'construction', label: 'Construction Zone' },
          { value: 'residential', label: 'Residential' },
        ],
        helpText: 'School/construction zones carry doubled fines',
      },
    ],
    fineRange: { min: 150, max: 2500 },
    disqualificationRisk: false,
    defenseStrategies: [
      'Challenge radar/lidar calibration records',
      'Request officer training certification',
      'Verify speed detection equipment maintenance logs',
      'Check speed limit signage visibility and placement',
    ],
  },

  dui: {
    value: 'dui',
    label: 'DUI / Controlled Substance',
    icon: '🚨',
    category: 'moving',
    severity: 'critical',
    csaBasic: 'Controlled Substances/Alcohol',
    regulationRef: '49 CFR 383.51',
    conditionalFields: [
      {
        key: 'bac_level',
        label: 'BAC Level (%)',
        type: 'number',
        required: false,
        validation: { min: 0, max: 1, step: 0.01 },
        helpText: 'CDL threshold is 0.04%',
      },
      {
        key: 'substance_type',
        label: 'Substance Type',
        type: 'select',
        required: false,
        options: [
          { value: 'alcohol', label: 'Alcohol' },
          { value: 'marijuana', label: 'Marijuana' },
          { value: 'amphetamine', label: 'Amphetamine' },
          { value: 'cocaine', label: 'Cocaine' },
          { value: 'opioid', label: 'Opioid' },
          { value: 'other', label: 'Other' },
          { value: 'refusal_to_test', label: 'Refusal to Test' },
        ],
      },
      {
        key: 'test_type',
        label: 'Test Type',
        type: 'select',
        required: false,
        options: [
          { value: 'breath', label: 'Breath' },
          { value: 'blood', label: 'Blood' },
          { value: 'urine', label: 'Urine' },
          { value: 'refusal', label: 'Refusal' },
        ],
      },
      {
        key: 'hazmat_at_time',
        label: 'Hazmat Endorsement Active',
        type: 'boolean',
        required: false,
        helpText: 'Triggers 3-year vs 1-year disqualification',
      },
    ],
    fineRange: { min: 2500, max: 10000 },
    disqualificationRisk: true,
    defenseStrategies: [
      'Challenge breathalyzer calibration and maintenance',
      'Review blood sample chain of custody',
      'Verify officer probable cause for stop',
      'Check 20-minute observation period compliance',
    ],
  },

  reckless_driving: {
    value: 'reckless_driving',
    label: 'Reckless Driving',
    icon: '💨',
    category: 'moving',
    severity: 'serious',
    csaBasic: 'Unsafe Driving',
    regulationRef: '49 CFR 383.51',
    conditionalFields: [
      {
        key: 'incident_description',
        label: 'Incident Description',
        type: 'text',
        required: false,
        validation: { maxLength: 500 },
      },
      {
        key: 'injuries_involved',
        label: 'Injuries Involved',
        type: 'boolean',
        required: false,
      },
      {
        key: 'cmv_at_time',
        label: 'Operating CMV at Time',
        type: 'boolean',
        required: false,
        helpText: 'Commercial motor vehicle operation at time of violation',
      },
      {
        key: 'witnesses',
        label: 'Witnesses Present',
        type: 'boolean',
        required: false,
      },
    ],
    fineRange: { min: 500, max: 5000 },
    disqualificationRisk: false,
    defenseStrategies: [
      'Challenge subjective "reckless" determination',
      'Present dashcam or witness evidence',
      'Negotiate reduction to lesser charge',
      'Review road and weather conditions at time',
    ],
  },

  seatbelt_cell_phone: {
    value: 'seatbelt_cell_phone',
    label: 'Seatbelt / Cell Phone',
    icon: '📱',
    category: 'moving',
    severity: 'minor',
    csaBasic: 'Unsafe Driving',
    regulationRef: '49 CFR 392.16',
    conditionalFields: [
      {
        key: 'violation_subtype',
        label: 'Violation Type',
        type: 'select',
        required: true,
        options: [
          { value: 'seatbelt', label: 'Seatbelt Violation' },
          { value: 'cell_phone', label: 'Cell Phone Use' },
          { value: 'texting', label: 'Texting While Driving' },
        ],
      },
      {
        key: 'device_type',
        label: 'Device Type',
        type: 'select',
        required: false,
        options: [
          { value: 'handheld', label: 'Handheld' },
          { value: 'hands_free', label: 'Hands-Free' },
        ],
        helpText: 'Only applicable for cell phone violations',
      },
      {
        key: 'hands_free_available',
        label: 'Hands-Free Available',
        type: 'boolean',
        required: false,
      },
    ],
    fineRange: { min: 100, max: 500 },
    disqualificationRisk: false,
    defenseStrategies: [
      'Challenge officer observation angle',
      'Present evidence of hands-free device use',
      'Verify state-specific cell phone law applicability',
    ],
  },

  // ═══════════════════════════════════════
  // CDL-SPECIFIC
  // ═══════════════════════════════════════
  hos_logbook: {
    value: 'hos_logbook',
    label: 'HOS / Logbook',
    icon: '📋',
    category: 'cdl_specific',
    severity: 'serious',
    csaBasic: 'HOS Compliance',
    regulationRef: '49 CFR 395',
    conditionalFields: [
      {
        key: 'violation_subtype',
        label: 'Violation Subtype',
        type: 'select',
        required: false,
        options: [
          { value: 'driving_limit_11hr', label: '11-Hour Driving Limit' },
          { value: 'window_14hr', label: '14-Hour Window' },
          { value: 'rest_break_30min', label: '30-Minute Rest Break' },
          { value: 'weekly_60_70hr', label: '60/70-Hour Weekly Limit' },
          { value: 'eld_malfunction', label: 'ELD Malfunction' },
          { value: 'false_log', label: 'False Log Entry' },
        ],
      },
      {
        key: 'hours_over_limit',
        label: 'Hours Over Limit',
        type: 'number',
        required: false,
        validation: { min: 0, max: 24, step: 0.5 },
      },
      {
        key: 'eld_manufacturer',
        label: 'ELD Manufacturer',
        type: 'text',
        required: false,
        validation: { maxLength: 100 },
        helpText: 'e.g., KeepTrucking, Samsara, Omnitracs',
      },
      {
        key: 'violation_regulation_code',
        label: 'Regulation Code',
        type: 'text',
        required: false,
        validation: { maxLength: 50 },
        helpText: 'e.g., 395.3(a)(1)',
      },
    ],
    fineRange: { min: 1000, max: 16000 },
    disqualificationRisk: false,
    defenseStrategies: [
      'Review ELD data for malfunction records',
      'Challenge hours calculation methodology',
      'Present evidence of adverse driving conditions exception',
      'Verify personal conveyance classification',
    ],
  },

  dot_inspection: {
    value: 'dot_inspection',
    label: 'DOT Inspection',
    icon: '🔍',
    category: 'cdl_specific',
    severity: 'standard',
    csaBasic: 'Vehicle Maintenance',
    regulationRef: '49 CFR 396',
    conditionalFields: [
      {
        key: 'inspection_level',
        label: 'Inspection Level',
        type: 'select',
        required: false,
        options: [
          { value: 'I', label: 'Level I — Full Inspection' },
          { value: 'II', label: 'Level II — Walk-Around' },
          { value: 'III', label: 'Level III — Driver Only' },
          { value: 'IV', label: 'Level IV — Special' },
          { value: 'V', label: 'Level V — Vehicle Only' },
          { value: 'VI', label: 'Level VI — Enhanced NAS' },
        ],
      },
      {
        key: 'inspection_report_number',
        label: 'Inspection Report Number',
        type: 'text',
        required: true,
        validation: { maxLength: 50 },
      },
      {
        key: 'cvsa_decal_issued',
        label: 'CVSA Decal Issued',
        type: 'boolean',
        required: false,
      },
      {
        key: 'vehicle_oos',
        label: 'Vehicle Out of Service',
        type: 'boolean',
        required: false,
      },
      {
        key: 'driver_oos',
        label: 'Driver Out of Service',
        type: 'boolean',
        required: false,
      },
    ],
    fineRange: { min: 0, max: 16000 },
    disqualificationRisk: false,
    defenseStrategies: [
      'Review inspection report for procedural errors',
      'Present pre-trip inspection documentation',
      'Challenge violation code applicability',
      'Provide certified repair documentation within 15 days',
    ],
  },

  dqf: {
    value: 'dqf',
    label: 'DQF',
    icon: '⚖️',
    category: 'cdl_specific',
    severity: 'serious',
    csaBasic: 'Driver Fitness',
    regulationRef: '49 CFR 391',
    conditionalFields: [
      {
        key: 'document_type',
        label: 'Document Type',
        type: 'select',
        required: false,
        options: [
          { value: 'medical_certificate', label: 'Medical Certificate' },
          { value: 'mvr', label: 'Motor Vehicle Record (MVR)' },
          { value: 'employment_application', label: 'Employment Application' },
          { value: 'road_test_certificate', label: 'Road Test Certificate' },
          { value: 'annual_review', label: 'Annual Review' },
          { value: 'drug_test_records', label: 'Drug Test Records' },
        ],
      },
      {
        key: 'violation_regulation_code',
        label: 'Regulation Code',
        type: 'text',
        required: false,
        validation: { maxLength: 50 },
        helpText: 'e.g., 391.41A1NPH, 391.45B',
      },
      {
        key: 'document_expiration_date',
        label: 'Document Expiration Date',
        type: 'date',
        required: false,
      },
      {
        key: 'audit_type',
        label: 'Audit Type',
        type: 'select',
        required: false,
        options: [
          { value: 'roadside', label: 'Roadside' },
          { value: 'compliance_review', label: 'Compliance Review' },
          { value: 'new_entrant', label: 'New Entrant Audit' },
          { value: 'complaint', label: 'Complaint Investigation' },
        ],
      },
    ],
    fineRange: { min: 1000, max: 16000 },
    disqualificationRisk: false,
    defenseStrategies: [
      'Produce missing documents promptly',
      'Challenge document expiration date interpretation',
      'Present valid replacement documentation',
      'Verify carrier vs driver responsibility for DQF maintenance',
    ],
  },

  suspension: {
    value: 'suspension',
    label: 'Suspension',
    icon: '🚫',
    category: 'cdl_specific',
    severity: 'critical',
    csaBasic: 'Driver Fitness',
    regulationRef: '49 CFR 383.51',
    conditionalFields: [
      {
        key: 'suspension_reason',
        label: 'Suspension Reason',
        type: 'select',
        required: false,
        options: [
          { value: 'serious_traffic_violations', label: 'Serious Traffic Violations' },
          { value: 'major_offense', label: 'Major Offense' },
          { value: 'dui', label: 'DUI' },
          { value: 'leaving_scene', label: 'Leaving Scene of Accident' },
          { value: 'felony_with_cmv', label: 'Felony with CMV' },
          { value: 'medical_disqualification', label: 'Medical Disqualification' },
          { value: 'unpaid_fines', label: 'Unpaid Fines' },
        ],
      },
      {
        key: 'disqualification_duration',
        label: 'Disqualification Duration',
        type: 'select',
        required: false,
        options: [
          { value: '60_day', label: '60 Days' },
          { value: '120_day', label: '120 Days' },
          { value: '1_year', label: '1 Year' },
          { value: '3_year', label: '3 Years' },
          { value: 'lifetime', label: 'Lifetime' },
        ],
      },
      {
        key: 'disqualification_end_date',
        label: 'Disqualification End Date',
        type: 'date',
        required: false,
      },
      {
        key: 'reinstatement_status',
        label: 'Reinstatement Status',
        type: 'select',
        required: false,
        options: [
          { value: 'disqualified', label: 'Disqualified' },
          { value: 'eligible', label: 'Eligible for Reinstatement' },
          { value: 'pending', label: 'Reinstatement Pending' },
          { value: 'reinstated', label: 'Reinstated' },
        ],
      },
    ],
    fineRange: { min: 2500, max: 25000 },
    disqualificationRisk: true,
    defenseStrategies: [
      'Challenge underlying violation validity',
      'Request hearing on disqualification',
      'Present evidence of compliance with reinstatement requirements',
      'Verify proper notification procedures were followed',
    ],
  },

  csa_score: {
    value: 'csa_score',
    label: 'CSA Score',
    icon: '📊',
    category: 'cdl_specific',
    severity: 'standard',
    regulationRef: '49 CFR 385',
    conditionalFields: [
      {
        key: 'basic_category',
        label: 'BASIC Category',
        type: 'select',
        required: false,
        options: [
          { value: 'unsafe_driving', label: 'Unsafe Driving' },
          { value: 'crash_indicator', label: 'Crash Indicator' },
          { value: 'hos', label: 'HOS Compliance' },
          { value: 'vehicle_maintenance', label: 'Vehicle Maintenance' },
          { value: 'controlled_substances', label: 'Controlled Substances/Alcohol' },
          { value: 'hazmat', label: 'Hazmat Compliance' },
          { value: 'driver_fitness', label: 'Driver Fitness' },
        ],
      },
      {
        key: 'severity_weight',
        label: 'Severity Weight',
        type: 'number',
        required: false,
        validation: { min: 1, max: 10 },
        helpText: '1 (minor) to 10 (most severe)',
      },
      {
        key: 'current_percentile',
        label: 'Current Percentile',
        type: 'number',
        required: false,
        validation: { min: 0, max: 100 },
      },
      {
        key: 'projected_percentile',
        label: 'Projected Percentile',
        type: 'number',
        required: false,
        validation: { min: 0, max: 100 },
      },
    ],
    fineRange: { min: 0, max: 0 },
    disqualificationRisk: false,
    defenseStrategies: [
      'Request DataQs challenge to dispute violation record',
      'Contest underlying inspection violations',
      'Present evidence of corrective actions taken',
      'Review time weight — older violations have less impact',
    ],
  },

  // ═══════════════════════════════════════
  // VEHICLE & CARGO
  // ═══════════════════════════════════════
  equipment_defect: {
    value: 'equipment_defect',
    label: 'Equipment Defect',
    icon: '🔧',
    category: 'vehicle_cargo',
    severity: 'standard',
    csaBasic: 'Vehicle Maintenance',
    regulationRef: '49 CFR 393',
    conditionalFields: [
      {
        key: 'equipment_category',
        label: 'Equipment Category',
        type: 'select',
        required: false,
        options: [
          { value: 'brakes', label: 'Brakes' },
          { value: 'tires', label: 'Tires' },
          { value: 'lights', label: 'Lights' },
          { value: 'coupling', label: 'Coupling Devices' },
          { value: 'frame', label: 'Frame' },
          { value: 'steering', label: 'Steering' },
          { value: 'exhaust', label: 'Exhaust' },
          { value: 'windshield', label: 'Windshield' },
          { value: 'mirrors', label: 'Mirrors' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        key: 'responsible_party',
        label: 'Responsible Party',
        type: 'select',
        required: false,
        options: [
          { value: 'driver', label: 'Driver' },
          { value: 'carrier', label: 'Carrier' },
          { value: 'both', label: 'Both' },
        ],
      },
      {
        key: 'vehicle_oos',
        label: 'Vehicle Out of Service',
        type: 'boolean',
        required: false,
      },
      {
        key: 'pre_trip_inspection_done',
        label: 'Pre-Trip Inspection Done',
        type: 'boolean',
        required: false,
        helpText: 'Was pre-trip inspection completed before departure?',
      },
    ],
    fineRange: { min: 500, max: 16000 },
    disqualificationRisk: false,
    defenseStrategies: [
      'Present pre-trip inspection documentation',
      'Show repair receipts and maintenance records',
      'Challenge carrier vs driver responsibility',
      'Verify defect occurred after pre-trip inspection',
    ],
  },

  overweight_oversize: {
    value: 'overweight_oversize',
    label: 'Overweight / Oversize',
    icon: '🏋️',
    category: 'vehicle_cargo',
    severity: 'standard',
    csaBasic: 'Vehicle Maintenance',
    regulationRef: '49 CFR 392.2',
    conditionalFields: [
      {
        key: 'actual_weight',
        label: 'Actual Weight (lbs)',
        type: 'number',
        required: false,
        validation: { min: 0, max: 200000 },
      },
      {
        key: 'permitted_weight',
        label: 'Permitted Weight (lbs)',
        type: 'number',
        required: false,
        validation: { min: 0, max: 200000 },
      },
      {
        key: 'violation_subtype',
        label: 'Violation Subtype',
        type: 'select',
        required: false,
        options: [
          { value: 'gross_weight', label: 'Gross Weight' },
          { value: 'axle_weight', label: 'Axle Weight' },
          { value: 'bridge_formula', label: 'Bridge Formula' },
          { value: 'oversize_height', label: 'Oversize — Height' },
          { value: 'oversize_width', label: 'Oversize — Width' },
          { value: 'oversize_length', label: 'Oversize — Length' },
        ],
      },
      {
        key: 'weigh_method',
        label: 'Weigh Method',
        type: 'select',
        required: false,
        options: [
          { value: 'scale_house', label: 'Scale House' },
          { value: 'portable_scale', label: 'Portable Scale' },
          { value: 'wim', label: 'Weigh-In-Motion' },
        ],
      },
    ],
    fineRange: { min: 100, max: 50000 },
    disqualificationRisk: false,
    defenseStrategies: [
      'Challenge scale calibration and certification',
      'Verify weight tolerance allowance for state',
      'Present shipper weight documentation',
      'Request axle-by-axle weight breakdown',
    ],
  },

  hazmat: {
    value: 'hazmat',
    label: 'Hazmat',
    icon: '☢️',
    category: 'vehicle_cargo',
    severity: 'critical',
    csaBasic: 'Hazmat Compliance',
    regulationRef: '49 CFR 171-180',
    conditionalFields: [
      {
        key: 'hazmat_class',
        label: 'Hazmat Class',
        type: 'select',
        required: false,
        options: [
          { value: '1', label: 'Class 1 — Explosives' },
          { value: '2', label: 'Class 2 — Gases' },
          { value: '3', label: 'Class 3 — Flammable Liquids' },
          { value: '4', label: 'Class 4 — Flammable Solids' },
          { value: '5', label: 'Class 5 — Oxidizers' },
          { value: '6', label: 'Class 6 — Toxic/Infectious' },
          { value: '7', label: 'Class 7 — Radioactive' },
          { value: '8', label: 'Class 8 — Corrosives' },
          { value: '9', label: 'Class 9 — Miscellaneous' },
        ],
      },
      {
        key: 'un_number',
        label: 'UN Number',
        type: 'text',
        required: false,
        validation: { maxLength: 10 },
        helpText: '4-digit UN identification number',
      },
      {
        key: 'violation_subtype',
        label: 'Violation Subtype',
        type: 'select',
        required: false,
        options: [
          { value: 'placarding', label: 'Placarding' },
          { value: 'shipping_papers', label: 'Shipping Papers' },
          { value: 'packaging', label: 'Packaging' },
          { value: 'marking_labeling', label: 'Marking/Labeling' },
          { value: 'loading_segregation', label: 'Loading/Segregation' },
          { value: 'security_plan', label: 'Security Plan' },
          { value: 'training', label: 'Training' },
          { value: 'endorsement', label: 'Endorsement' },
        ],
      },
      {
        key: 'hazmat_endorsement_valid',
        label: 'Hazmat Endorsement Valid',
        type: 'boolean',
        required: false,
      },
    ],
    fineRange: { min: 450, max: 75000 },
    disqualificationRisk: false,
    defenseStrategies: [
      'Review shipping paper accuracy and completeness',
      'Verify placard requirements for specific material',
      'Present training records and certifications',
      'Challenge material classification determination',
    ],
  },

  railroad_crossing: {
    value: 'railroad_crossing',
    label: 'Railroad Crossing',
    icon: '🚂',
    category: 'vehicle_cargo',
    severity: 'critical',
    csaBasic: 'Unsafe Driving',
    regulationRef: '49 CFR 392.10',
    conditionalFields: [
      {
        key: 'violation_subtype',
        label: 'Violation Subtype',
        type: 'select',
        required: false,
        options: [
          { value: 'failure_to_stop', label: 'Failure to Stop' },
          { value: 'insufficient_clearance', label: 'Insufficient Clearance' },
          { value: 'failure_to_obey_signal', label: 'Failure to Obey Signal' },
          { value: 'failure_to_negotiate_safely', label: 'Failure to Negotiate Safely' },
          { value: 'insufficient_undercarriage_clearance', label: 'Insufficient Undercarriage Clearance' },
        ],
      },
      {
        key: 'prior_rr_offenses',
        label: 'Prior Railroad Offenses',
        type: 'number',
        required: false,
        validation: { min: 0, max: 5 },
        helpText: '1st offense = 60 days, 2nd = 120 days, 3rd = 1 year disqual',
      },
      {
        key: 'crossing_type',
        label: 'Crossing Type',
        type: 'select',
        required: false,
        options: [
          { value: 'grade_crossing', label: 'Grade Crossing' },
          { value: 'drawbridge', label: 'Drawbridge' },
        ],
      },
      {
        key: 'signal_type',
        label: 'Signal Type',
        type: 'select',
        required: false,
        options: [
          { value: 'gates_and_lights', label: 'Gates and Lights' },
          { value: 'lights_only', label: 'Lights Only' },
          { value: 'crossbucks_only', label: 'Crossbucks Only' },
          { value: 'none', label: 'No Signals' },
        ],
      },
    ],
    fineRange: { min: 500, max: 11000 },
    disqualificationRisk: true,
    defenseStrategies: [
      'Challenge signal functionality at time of violation',
      'Present evidence of visibility issues',
      'Review crossing warning sign placement',
      'Complete Operation Lifesaver training for mitigation',
    ],
  },

  // ═══════════════════════════════════════
  // OTHER
  // ═══════════════════════════════════════
  other: {
    value: 'other',
    label: 'Other',
    icon: '•••',
    category: 'other',
    severity: 'standard',
    conditionalFields: [],
    fineRange: { min: 0, max: 10000 },
    disqualificationRisk: false,
    defenseStrategies: [],
  },
};

// --- Derived Constants ---

export const ACTIVE_VIOLATION_TYPES: ViolationTypeConfig[] = Object.values(
  VIOLATION_TYPE_REGISTRY,
);

export const LEGACY_VIOLATION_TYPES: string[] = ['parking', 'traffic_signal'];

export const ALL_VIOLATION_TYPE_VALUES: string[] = [
  ...ACTIVE_VIOLATION_TYPES.map(t => t.value),
  ...LEGACY_VIOLATION_TYPES,
];

export const VIOLATION_CATEGORIES: ViolationCategoryConfig[] = [
  {
    key: 'moving',
    label: 'Moving Violations',
    types: ['speeding', 'dui', 'reckless_driving', 'seatbelt_cell_phone'],
  },
  {
    key: 'cdl_specific',
    label: 'CDL-Specific',
    types: ['hos_logbook', 'dot_inspection', 'dqf', 'suspension', 'csa_score'],
  },
  {
    key: 'vehicle_cargo',
    label: 'Vehicle & Cargo',
    types: ['equipment_defect', 'overweight_oversize', 'hazmat', 'railroad_crossing'],
  },
  {
    key: 'other',
    label: 'Other',
    types: ['other'],
  },
];

// --- Helper Functions ---

/** Get the ViolationTypeConfig for a given type value, or undefined if not found */
export function getViolationTypeConfig(
  type: string,
): ViolationTypeConfig | undefined {
  return VIOLATION_TYPE_REGISTRY[type];
}

/** Get conditional field definitions for a given type */
export function getConditionalFields(type: string): ConditionalField[] {
  return VIOLATION_TYPE_REGISTRY[type]?.conditionalFields ?? [];
}

/** Resolve a select field's raw value to its human-readable label */
export function resolveSelectLabel(
  field: ConditionalField,
  value: string,
): string {
  if (field.type !== 'select' || !field.options) return value;
  return field.options.find(o => o.value === value)?.label ?? value;
}
