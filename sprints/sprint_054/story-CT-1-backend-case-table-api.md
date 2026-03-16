# Story CT-1: Backend — Extend Case Listing APIs with All 19 Fields, Filters, Sorting & Pagination

## Status: DONE

## Priority: P0

## Depends On: None (foundation story)

## Description
Extend the existing `GET /api/admin/cases` endpoint and create a new
`GET /api/operator/all-cases` endpoint so both roles can power a comprehensive case table
with all 19 business columns, server-side sorting, server-side filtering (status, state,
carrier), full-text search across multiple fields, and cursor-based pagination with accurate
total counts.

## Current State Analysis

### `GET /api/admin/cases` (admin.controller.js:getAllCases)
Currently returns **14 fields** from a flat select with two JOINs:

| Returned | Missing (needed for 19-column table) |
|----------|--------------------------------------|
| id, case_number, status, state | driver_phone |
| violation_type, violation_date | customer_type |
| customer_name, customer_email | who_sent |
| assigned_operator_id, operator_name (JOIN) | carrier |
| assigned_attorney_id, attorney_name (JOIN) | attorney_price |
| created_at, updated_at, ageHours (calc) | price_cdl |
| | subscriber_paid |
| | court_fee |
| | court_fee_paid_by |
| | court_date |
| | next_action_date |
| | file_count (subquery) |

**Filters supported:** `status`, `operator_id`, `attorney_id`, `search`
**Missing filters:** `state`, `carrier`
**Sorting:** Hardcoded `created_at DESC` — no dynamic sort

### Operator Endpoints
No "all cases" endpoint exists for operators. `getTeamCases` returns non-closed cases across
all operators but with only ~10 fields and no pagination/sorting.

## Implementation

### 1. Extend `getAllCases` in `admin.controller.js`

**New query params:**
- `state` — filter by state (2-char code), e.g. `?state=TX`
- `carrier` — filter by carrier name (ilike partial match), e.g. `?carrier=swift`
- `sort_by` — column to sort by (default: `created_at`). Allowed values:
  `case_number`, `customer_name`, `status`, `state`, `violation_type`, `violation_date`,
  `court_date`, `next_action_date`, `attorney_price`, `price_cdl`, `court_fee`,
  `carrier`, `created_at`, `updated_at`
- `sort_dir` — `asc` or `desc` (default: `desc`)

**Extended select:**
```javascript
let query = supabase
  .from('cases')
  .select(`
    id, case_number, status, state, violation_type, violation_date,
    customer_name, customer_email, driver_phone, customer_type,
    court_date, next_action_date,
    assigned_operator_id, assigned_attorney_id,
    attorney_price, price_cdl, subscriber_paid, court_fee, court_fee_paid_by,
    carrier, who_sent,
    created_at, updated_at,
    operator:assigned_operator_id(id, full_name),
    attorney:assigned_attorney_id(id, full_name)
  `, { count: 'exact' })
  .range(off, off + lim - 1);
```

**Sorting (whitelist-based):**
```javascript
const SORTABLE_COLUMNS = new Set([
  'case_number', 'customer_name', 'status', 'state', 'violation_type',
  'violation_date', 'court_date', 'next_action_date', 'attorney_price',
  'price_cdl', 'court_fee', 'carrier', 'created_at', 'updated_at',
]);

const sortBy = SORTABLE_COLUMNS.has(req.query.sort_by) ? req.query.sort_by : 'created_at';
const sortAsc = req.query.sort_dir === 'asc';
query = query.order(sortBy, { ascending: sortAsc });
```

**New filters:**
```javascript
if (state) query = query.eq('state', state.toUpperCase());
if (carrier) query = query.ilike('carrier', `%${carrier}%`);
```

**Extended search (add carrier, attorney_name):**
```javascript
if (search) {
  query = query.or(
    `case_number.ilike.%${search}%,customer_name.ilike.%${search}%,` +
    `customer_email.ilike.%${search}%,carrier.ilike.%${search}%`
  );
}
```

**File count subquery:**
After the main query, fetch file counts in a single batch:
```javascript
const caseIds = (data || []).map(c => c.id);
let fileCounts = {};
if (caseIds.length > 0) {
  const { data: fileData } = await supabase
    .from('case_files')
    .select('case_id')
    .in('case_id', caseIds);
  fileCounts = (fileData || []).reduce((acc, f) => {
    acc[f.case_id] = (acc[f.case_id] || 0) + 1;
    return acc;
  }, {});
}
```

**Response mapping — add all 19 fields:**
```javascript
const cases = (data || []).map(c => ({
  id: c.id,
  case_number: c.case_number,
  status: c.status,
  state: c.state,
  violation_type: c.violation_type,
  violation_date: c.violation_date,
  customer_name: c.customer_name,
  customer_email: c.customer_email,
  driver_phone: c.driver_phone || null,
  customer_type: c.customer_type || null,
  court_date: c.court_date || null,
  next_action_date: c.next_action_date || null,
  assigned_operator_id: c.assigned_operator_id,
  operator_name: c.operator?.full_name || null,
  assigned_attorney_id: c.assigned_attorney_id,
  attorney_name: c.attorney?.full_name || null,
  attorney_price: c.attorney_price != null ? Number(c.attorney_price) : null,
  price_cdl: c.price_cdl != null ? Number(c.price_cdl) : null,
  subscriber_paid: c.subscriber_paid ?? null,
  court_fee: c.court_fee != null ? Number(c.court_fee) : null,
  court_fee_paid_by: c.court_fee_paid_by || null,
  carrier: c.carrier || null,
  who_sent: c.who_sent || null,
  file_count: fileCounts[c.id] || 0,
  created_at: c.created_at,
  updated_at: c.updated_at,
  ageHours: Math.floor((now - new Date(c.created_at).getTime()) / (1000 * 60 * 60)),
}));
```

**Use inline count instead of separate count query:**
The select with `{ count: 'exact' }` returns `count` alongside data, eliminating the need for
a separate count query. This reduces DB round-trips from 2 → 1 for the main query.

```javascript
const { data, count: total, error } = await query;
```

### 2. New `getAllCasesTable` in `operator.controller.js`

Same field set and response shape as admin, but with **operator-scoped visibility**:

```javascript
exports.getAllCasesTable = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { status, state, carrier, search, sort_by, sort_dir, limit = '50', offset = '0' } = req.query;
    // ... same parsing as admin ...

    let query = supabase
      .from('cases')
      .select(`
        id, case_number, status, state, violation_type, violation_date,
        customer_name, customer_email, driver_phone, customer_type,
        court_date, next_action_date,
        assigned_operator_id, assigned_attorney_id,
        attorney_price, price_cdl, subscriber_paid, court_fee, court_fee_paid_by,
        carrier, who_sent,
        created_at, updated_at,
        operator:assigned_operator_id(id, full_name),
        attorney:assigned_attorney_id(id, full_name)
      `, { count: 'exact' })
      // Operator sees: own assigned + all non-closed (team view)
      .or(`assigned_operator_id.eq.${operatorId},and(status.neq.closed,status.neq.resolved)`)
      .range(off, off + lim - 1);

    // ... same filters, sorting, search as admin ...
    // ... same file count batch ...
    // ... same response mapping ...
  } catch (error) {
    // ...
  }
};
```

**Important:** The operator endpoint uses `authorize(['operator', 'admin'])` so admins can also
call it if needed.

### 3. Wire new route in `operator.routes.js`

```javascript
// After existing routes
router.get('/all-cases', authenticate, authorize(['operator', 'admin']), operatorController.getAllCasesTable);
```

### 4. Database Indexes

Verify the following indexes exist (they do per schema):
- `idx_cases_status` on `cases(status)`
- `idx_cases_state` on `cases(state)`
- `idx_cases_assigned_operator` on `cases(assigned_operator_id)`
- `idx_cases_assigned_attorney` on `cases(assigned_attorney_id)`
- `idx_cases_created_at` on `cases(created_at)`

**New index needed for carrier filter:**
```sql
CREATE INDEX IF NOT EXISTS idx_cases_carrier ON cases(carrier);
```

This is a non-blocking `CREATE INDEX` and can be added as migration
`017_cases_carrier_index.sql`.

## Files Changed

### Backend (Modified)
- `controllers/admin.controller.js` — extend `getAllCases` (add 9 fields, 2 filters, dynamic
  sort, inline count, file count batch)
- `controllers/operator.controller.js` — new `getAllCasesTable` handler
- `routes/operator.routes.js` — add `GET /api/operator/all-cases` route

### Backend (New)
- `migrations/017_cases_carrier_index.sql` — carrier index

### Backend Tests
- `__tests__/admin.controller.test.js` — update existing getAllCases tests + new tests for:
  - `state` filter returns only matching state
  - `carrier` filter (ilike partial match)
  - `sort_by=attorney_price&sort_dir=asc` returns sorted results
  - Invalid `sort_by` falls back to `created_at`
  - Response includes all new fields (driver_phone, customer_type, etc.)
  - `file_count` is correct for cases with/without files
  - Inline count matches filtered result set
- `__tests__/operator.controller.test.js` — new tests for `getAllCasesTable`:
  - Returns only operator-accessible cases (own + team non-closed)
  - Supports same filters and sorting as admin
  - Returns all 19+ fields
  - Pagination works correctly

## Acceptance Criteria
- [ ] `GET /api/admin/cases` returns all 19 display fields + `file_count` + `ageHours`
- [ ] `GET /api/admin/cases?state=TX` returns only Texas cases
- [ ] `GET /api/admin/cases?carrier=swift` returns cases with carrier containing "swift"
- [ ] `GET /api/admin/cases?sort_by=attorney_price&sort_dir=asc` returns price-sorted results
- [ ] Invalid `sort_by` value silently falls back to `created_at`
- [ ] `GET /api/admin/cases?search=santos` matches customer_name, email, case_number, carrier
- [ ] File count is accurate (0 for cases with no files, N for cases with N files)
- [ ] Numeric fields (attorney_price, price_cdl, court_fee) are returned as numbers, not strings
- [ ] Boolean field (subscriber_paid) is returned as boolean or null
- [ ] `GET /api/operator/all-cases` exists and requires operator or admin role
- [ ] Operator endpoint scopes results to own assigned + team non-closed cases
- [ ] Operator endpoint supports same filters, sorting, and pagination as admin
- [ ] Pagination total count reflects filtered result count, not total table count
- [ ] Response time <200ms for 50-row page on 10,000+ case dataset
- [ ] All backend tests pass
