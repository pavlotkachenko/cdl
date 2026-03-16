/**
 * Models for the shared CaseTableComponent.
 * Defines the 19-column data contract, column definitions, and display types.
 */

export interface CaseTableRow {
  id: string;
  case_number: string;
  customer_name: string;
  status: string;
  state: string;
  violation_type: string;
  violation_date: string | null;
  court_date: string | null;
  next_action_date: string | null;
  driver_phone: string | null;
  customer_type: string | null;
  who_sent: string | null;
  carrier: string | null;
  attorney_name: string | null;
  attorney_price: number | null;
  price_cdl: number | null;
  subscriber_paid: boolean | null;
  court_fee: number | null;
  court_fee_paid_by: string | null;
  operator_name: string | null;
  file_count: number;
  ageHours: number;
  assigned_operator_id: string | null;
  assigned_attorney_id: string | null;
}

export type ColumnGroup = 'core' | 'case_info' | 'assignment' | 'contact' | 'financial' | 'meta';
export type TableDensity = 'compact' | 'default' | 'comfortable';
export type CellType = 'text' | 'date' | 'currency' | 'boolean' | 'status' | 'count' | 'phone';

export interface ColumnDef {
  key: string;
  header: string;
  group: ColumnGroup;
  sticky?: boolean;
  sortable?: boolean;
  type: CellType;
  width?: string;
}

export const ALL_COLUMNS: ColumnDef[] = [
  // Core (always visible, sticky)
  { key: 'customer_name',     header: 'TABLE.COL_CUSTOMER_NAME',     group: 'core',       sticky: true,  sortable: true, type: 'text',     width: '160px' },
  { key: 'case_number',       header: 'TABLE.COL_CASE_NUMBER',       group: 'core',       sticky: true,  sortable: true, type: 'text',     width: '140px' },
  { key: 'status',            header: 'TABLE.COL_STATUS',            group: 'core',       sortable: true, type: 'status', width: '130px' },

  // Case Info
  { key: 'state',             header: 'TABLE.COL_STATE',             group: 'case_info',  sortable: true, type: 'text',     width: '60px' },
  { key: 'violation_type',    header: 'TABLE.COL_VIOLATION_TYPE',    group: 'case_info',  sortable: true, type: 'text',     width: '130px' },
  { key: 'violation_date',    header: 'TABLE.COL_VIOLATION_DATE',    group: 'case_info',  sortable: true, type: 'date',     width: '110px' },
  { key: 'court_date',        header: 'TABLE.COL_COURT_DATE',        group: 'case_info',  sortable: true, type: 'date',     width: '110px' },

  // Assignment
  { key: 'attorney_name',     header: 'TABLE.COL_ATTORNEY_NAME',     group: 'assignment', sortable: true, type: 'text',     width: '140px' },
  { key: 'carrier',           header: 'TABLE.COL_CARRIER',           group: 'assignment', sortable: true, type: 'text',     width: '130px' },
  { key: 'who_sent',          header: 'TABLE.COL_WHO_SENT',          group: 'assignment', sortable: true, type: 'text',     width: '100px' },

  // Contact
  { key: 'driver_phone',      header: 'TABLE.COL_DRIVER_PHONE',      group: 'contact',    type: 'phone',    width: '120px' },
  { key: 'customer_type',     header: 'TABLE.COL_CUSTOMER_TYPE',     group: 'contact',    sortable: true, type: 'text',     width: '140px' },

  // Financial
  { key: 'attorney_price',    header: 'TABLE.COL_ATTORNEY_PRICE',    group: 'financial',  sortable: true, type: 'currency', width: '110px' },
  { key: 'price_cdl',         header: 'TABLE.COL_PRICE_CDL',         group: 'financial',  sortable: true, type: 'currency', width: '100px' },
  { key: 'subscriber_paid',   header: 'TABLE.COL_SUBSCRIBER_PAID',   group: 'financial',  type: 'boolean',  width: '120px' },
  { key: 'court_fee',         header: 'TABLE.COL_COURT_FEE',         group: 'financial',  sortable: true, type: 'currency', width: '100px' },
  { key: 'court_fee_paid_by', header: 'TABLE.COL_COURT_FEE_PAID_BY', group: 'financial',  type: 'text',     width: '130px' },

  // Meta
  { key: 'next_action_date',  header: 'TABLE.COL_NEXT_ACTION_DATE',  group: 'meta',       sortable: true, type: 'date',     width: '120px' },
  { key: 'file_count',        header: 'TABLE.COL_FILES',             group: 'meta',       type: 'count',    width: '70px' },
];

export const DEFAULT_VISIBLE_COLUMNS = ALL_COLUMNS
  .filter(c => ['core', 'case_info', 'assignment'].includes(c.group))
  .map(c => c.key);

/** Ordered list of column groups for consistent rendering. */
export const COLUMN_GROUPS: ColumnGroup[] = [
  'core', 'case_info', 'assignment', 'contact', 'financial', 'meta',
];

/** i18n keys for column group labels. */
export const GROUP_LABELS: Record<ColumnGroup, string> = {
  core: 'TABLE.GROUP_CORE',
  case_info: 'TABLE.GROUP_CASE_INFO',
  assignment: 'TABLE.GROUP_ASSIGNMENT',
  contact: 'TABLE.GROUP_CONTACT',
  financial: 'TABLE.GROUP_FINANCIAL',
  meta: 'TABLE.GROUP_META',
};
