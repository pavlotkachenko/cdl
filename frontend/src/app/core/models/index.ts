// ============================================
// Core Models and Interfaces
// ============================================
// Location: frontend/src/app/core/models/index.ts

// ============================================
// USER MODELS
// ============================================

export type UserRole = 'driver' | 'operator' | 'attorney' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  cdlNumber?: string;
  cdlState?: string;
  auth_user_id: string;
  assigned_states?: string[];
  jurisdictions?: {
    states?: string[];
    counties?: string[];
  };
  created_at: string;
  updated_at: string;
  createdAt?: string; // Alias for consistency if needed
}

// ============================================
// CASE MODELS
// ============================================

export type CustomerType = 
  | 'subscriber_driver' 
  | 'subscriber_carrier' 
  | 'one_time_driver' 
  | 'one_time_carrier';

export type CaseStatus =
  | 'new'
  | 'reviewed'
  | 'assigned_to_attorney'
  | 'waiting_for_driver'
  | 'send_info_to_attorney'
  | 'attorney_paid'
  | 'call_court'
  | 'check_with_manager'
  | 'pay_attorney'
  | 'closed'
  | 'resolved';

export type ViolationType =
  // Moving violations
  | 'speeding'
  | 'dui'
  | 'reckless_driving'
  | 'seatbelt_cell_phone'
  // CDL-specific
  | 'hos_logbook'
  | 'dot_inspection'
  | 'dqf'
  | 'suspension'
  | 'csa_score'
  // Vehicle & cargo
  | 'equipment_defect'
  | 'overweight_oversize'
  | 'hazmat'
  | 'railroad_crossing'
  // Legacy (hidden in UI)
  | 'parking'
  | 'traffic_signal'
  // Other
  | 'other';

export type ViolationSeverity = 'critical' | 'serious' | 'standard' | 'minor';

export interface Case {
  id: string;
  case_number: string;
  ticketNumber?: string; // Added from new version (potential alias for case_number)
  citationNumber?: string; // Added from new version
  
  // Driver info
  driver_id?: string;
  userId?: string; // Added from new version (potential alias for driver_id)
  customer_name: string;
  full_name?: string; // Added from new version (potential alias for customer_name)
  driver_phone?: string;
  customer_type: CustomerType;
  type?: string; // Added from new version (potential untyped alias for customer_type)
  
  // Location
  state: string;
  town?: string;
  county?: string;
  location?: string; // Added from new version (could derive from town/county)
  
  // Violation details
  violation_date: string;
  violationDate?: string; // Added from new version (alias for violation_date)
  violation_type: ViolationType;
  violation_details?: string;
  description?: string; // Added from new version (alias for violation_details)
  citation_number?: string;
  fine_amount?: number;
  alleged_speed?: number;
  type_specific_data?: Record<string, unknown>;
  violation_regulation_code?: string;
  violation_severity?: ViolationSeverity;
  
  // Assignment
  status: CaseStatus;
  assigned_operator_id?: string;
  assigned_attorney_id?: string;
  assignedAttorney?: string; // Added from new version (alias for assigned_attorney_id)
  
  // Dates
  court_date?: string;
  courtDate?: string; // Added from new version (alias for court_date)
  next_action_date?: string;
  
  // Financial
  attorney_price?: number;
  price_cdl?: number;
  subscriber_paid?: boolean;
  court_fee?: number;
  court_fee_paid_by?: string;
  
  // Additional
  carrier?: string;
  who_sent?: string;
  resolution?: string; // Added from new version
  
  // Timestamps
  created_at: string;
  createdAt?: string; // Added from new version (alias for created_at)
  updated_at: string;
  updatedAt?: string; // Added from new version (alias for updated_at)
  attorney_price_set_at?: string;
  closed_at?: string;
  
  // Relations (populated)
  driver?: User;
  operator?: User;
  attorney?: User;
  files?: CaseFile[];
  documents?: Document[]; // Added from new version (potential alias for files)
  statusHistory?: StatusHistory[]; // Added from new version
}

// ============================================
// FILE MODELS
// ============================================

export type FileType = 'ticket' | 'evidence' | 'resolution' | 'other';

export interface CaseFile {
  id: string;
  case_id: string;
  file_name: string;
  file_url: string;
  file_type: FileType;
  fileSize?: number; // Added from new version (as Document.fileSize)
  uploaded_by?: string;
  uploaded_at: string;
  uploadedAt?: string; // Added from new version (alias for uploaded_at)
}

export interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

// ============================================
// STATUS HISTORY MODELS
// ============================================

export interface StatusHistory {
  status: string;
  timestamp: string;
  note?: string;
}

// ============================================
// SUBSCRIPTION MODELS
// ============================================

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  user_id: string;
  customer_type: CustomerType;
  status: SubscriptionStatus;
  plan_name?: string;
  price_per_month?: number;
  start_date: string;
  end_date?: string;
  created_at: string;
}

// ============================================
// ACTIVITY LOG MODELS
// ============================================

export interface ActivityLog {
  id: string;
  case_id: string;
  user_id?: string;
  action: string;
  details?: Record<string, any>;
  created_at: string;
  user?: User;
}

// ============================================
// NOTIFICATION MODELS
// ============================================

export type NotificationType = 'assignment' | 'delay' | 'status_change' | 'message';

export interface Notification {
  id: string;
  user_id: string;
  case_id?: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  case?: Case;
}

// ============================================
// ASSIGNMENT RULE MODELS
// ============================================

export interface AssignmentRule {
  id: string;
  state: string;
  operator_id: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  operator?: User;
}

// ============================================
// FORM MODELS
// ============================================

export interface SubmitTicketForm {
  customer_name: string;
  driver_phone: string;
  customer_type: CustomerType;
  state: string;
  town?: string;
  county?: string;
  violation_date: string;
  violation_type: ViolationType;
  violation_details?: string;
  carrier?: string;
  citation_number?: string;
  court_date?: string;
  fine_amount?: number;
  alleged_speed?: number;
  type_specific_data?: Record<string, unknown>;
  violation_regulation_code?: string;
}

export interface LoginForm {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  phone?: string;
  role?: UserRole;
}

// ============================================
// API RESPONSE MODELS
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CaseStats {
  total: number;
  by_status: Record<CaseStatus, number>;
  by_state: Record<string, number>;
  by_customer_type: Record<CustomerType, number>;
}

// ============================================
// UI MODELS
// ============================================

export interface MenuItem {
  label: string;
  icon?: string;
  route?: string;
  action?: () => void;
  children?: MenuItem[];
  badge?: number;
  visible?: boolean;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'date' | 'number' | 'status' | 'badge' | 'actions';
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface FilterOption {
  label: string;
  value: string | number | boolean;
  count?: number;
}

export interface StatusConfig {
  label: string;
  color: string;
  icon: string;
  description?: string;
}

// ============================================
// CONSTANTS
// ============================================

export const STATUS_COLORS: Record<CaseStatus, string> = {
  'new': '#3b82f6',
  'reviewed': '#8b5cf6',
  'assigned_to_attorney': '#ec4899',
  'waiting_for_driver': '#f59e0b',
  'send_info_to_attorney': '#06b6d4',
  'attorney_paid': '#10b981',
  'call_court': '#f97316',
  'check_with_manager': '#eab308',
  'pay_attorney': '#22c55e',
  'closed': '#6b7280',
  'resolved': '#059669'
};

export const STATUS_LABELS: Record<CaseStatus, string> = {
  'new': 'New',
  'reviewed': 'Reviewed',
  'assigned_to_attorney': 'Assigned to Attorney',
  'waiting_for_driver': 'Waiting for Driver',
  'send_info_to_attorney': 'Send Info to Attorney',
  'attorney_paid': 'Attorney Paid',
  'call_court': 'Call Court',
  'check_with_manager': 'Check with Manager',
  'pay_attorney': 'Pay Attorney',
  'closed': 'Closed',
  'resolved': 'Resolved'
};

export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];