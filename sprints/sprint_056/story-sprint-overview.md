# Sprint 056 — Mock Data Migration: Hardcoded Values to Live API Data

## Goal
Eliminate **all hardcoded mock data** from production frontend components. Every screen, every role, every dashboard, list, and analytics view must display real data from the backend API/Supabase database. Where data doesn't exist yet, show proper empty states (not fake data).

## Context
The CDL Ticket Management frontend was built with mock data arrays embedded directly in component files to enable rapid UI prototyping. An audit identified **108 instances of hardcoded mock data across 18 files**, affecting all 6 user roles. This creates several problems:
1. **Misleading demos** — stakeholders see fake data and assume features work end-to-end
2. **Hidden API gaps** — mock fallbacks in catchError() mask missing/broken endpoints
3. **Data inconsistency** — mock users (Marcus Johnson, Sarah Chen, etc.) appear across unrelated screens
4. **Test fragility** — tests that assert on mock data pass even when APIs are broken
5. **Stale data** — hardcoded dates (Jan-Mar 2026), case numbers, and amounts never update

## Approach
For each component with mock data:
1. **Identify** the API endpoint that should provide the data (create new endpoint if none exists)
2. **Remove** the MOCK_ constants and fallback-to-mock patterns from component code
3. **Wire** the component to call the real service method
4. **Add proper empty states** — skeleton loaders during loading, "No data" illustrations when empty
5. **Move mock data to test files** — reuse the mock constants in .spec.ts files only
6. **Verify** with real database data or proper empty states

## Data Consistency Strategy
Mock data currently uses inconsistent fake identities across screens. After migration:
- All user names, emails, phones come from the `users` table
- All case numbers come from the `cases` table (format: CDL-YYYY-NNNNN)
- All financial data comes from the `payments` table via Stripe
- All notifications come from the `notifications` table
- All documents come from the `case_documents` table
- All messages come from the `conversations`/`messages` tables

## Stories

| # | Story | Priority | Status |
|---|-------|----------|--------|
| MD-1 | Backend: audit and create missing API endpoints for all mock data sources | P0 | TODO |
| MD-2 | Driver: migrate messages and notifications to live API data | P0 | TODO |
| MD-3 | Attorney: migrate dashboard, cases, clients, notifications, and reports | P0 | TODO |
| MD-4 | Admin: migrate dashboard, revenue, reports, client management, notifications, documents | P0 | TODO |
| MD-5 | Operator: migrate dashboard case queue and summary to live data | P1 | TODO |
| MD-6 | Carrier: migrate documents and analytics to live data | P1 | TODO |
| MD-7 | Shared: migrate payment history and add consistent empty states | P1 | TODO |
| MD-8 | Remove messaging mock service and all MOCK_ constants from production code | P2 | TODO |
| MD-9 | Comprehensive testing and data consistency verification | P2 | TODO |

## Mock Data Inventory (108 instances, 18 files)

### Driver Role (2 files)
| File | Mock Data | Lines | Impact |
|------|-----------|-------|--------|
| `driver/messages/messages.component.ts` | 3 fake conversations, message threads | ~903-1034 | Fake attorney conversations |
| `driver/services/messaging.service.mock.ts` | Full mock messaging service with simulated responses | ~32-431 | Fake incoming messages every 15s |

### Attorney Role (6 files)
| File | Mock Data | Lines | Impact |
|------|-----------|-------|--------|
| `attorney/attorney-dashboard/attorney-dashboard.component.ts` | 8 cases, rating, court dates | ~27-1011 | Fake case queue, stats |
| `attorney/attorney-cases/attorney-cases.component.ts` | 16 case records with full details | ~17-116 | Fake case list |
| `attorney/attorney-reports/attorney-reports.component.ts` | KPIs, monthly perf, trends, distributions | ~81-112 | Fake performance data |
| `attorney/attorney-notifications/attorney-notifications.component.ts` | 8 notifications | ~21-62 | Fake alerts |
| `attorney/attorney-clients/attorney-clients.component.ts` | Client data | varies | Fake client list |
| `attorney/attorney-documents/attorney-documents.component.ts` | Document data | varies | Fake documents |

### Admin Role (6 files)
| File | Mock Data | Lines | Impact |
|------|-----------|-------|--------|
| `admin/dashboard/admin-dashboard.component.ts` | Stats, fallback patterns | varies | Fake KPI metrics |
| `admin/revenue-dashboard/revenue-dashboard.component.ts` | $156K revenue, 342 transactions, 8 attorneys, 10 recent txns, payment methods | ~27-107 | Entire revenue screen is fake |
| `admin/reports/reports.component.ts` | 247 cases, 4 staff members, breakdown data | ~74-99 | Fake admin reports |
| `admin/client-management/client-management.component.ts` | 4 clients with full PII (names, emails, phones, CDL numbers, addresses) | ~21-80 | Fake client directory |
| `admin/notifications/admin-notifications.component.ts` | Notification data | varies | Fake admin alerts |
| `admin/documents/admin-documents.component.ts` | Document data | varies | Fake document list |

### Operator Role (1 file)
| File | Mock Data | Lines | Impact |
|------|-----------|-------|--------|
| `operator/operator-dashboard/operator-dashboard.component.ts` | 3+3 cases (assigned+unassigned), KPI summary | ~29-41 | Fake case queue |

### Carrier Role (2 files)
| File | Mock Data | Lines | Impact |
|------|-----------|-------|--------|
| `carrier/documents/carrier-documents.component.ts` | Document data | varies | Fake documents |
| `core/services/carrier.service.ts` | Fleet analytics fallback data | varies | Fake analytics |

### Shared (1 file)
| File | Mock Data | Lines | Impact |
|------|-----------|-------|--------|
| `features/shared/payment/payment-history/payment-history.component.ts` | Payment history data | varies | Fake transactions |

## Story Dependency Graph
```
MD-1 (backend endpoints) <--- ALL frontend stories depend on this
  |
  |-->  MD-2 (driver messages/notifications)
  |-->  MD-3 (attorney -- 6 files, largest scope)
  |-->  MD-4 (admin -- 6 files, includes revenue dashboard)
  |-->  MD-5 (operator dashboard)
  |-->  MD-6 (carrier documents/analytics)
  └-->  MD-7 (shared payment history)

MD-8 (cleanup) <--- after all role migrations done
MD-9 (verification) <--- final story
```

## Implementation Order
1. **Wave 0:** MD-1 -- backend audit/creation (must land first)
2. **Wave 1:** MD-3, MD-4 (parallel -- attorney + admin, largest scope)
3. **Wave 2:** MD-2, MD-5, MD-6 (parallel -- driver, operator, carrier)
4. **Wave 3:** MD-7 (shared payment history)
5. **Wave 4:** MD-8, MD-9 (parallel -- cleanup + verification)

## Non-Functional Requirements
- **Zero mock data in production code** -- all MOCK_* constants moved to test files or deleted
- **Proper loading states** -- SkeletonLoaderComponent used while API calls are in flight
- **Proper empty states** -- meaningful messages when no data exists (not fake data)
- **Error states** -- ErrorStateComponent with retry button when API calls fail
- **No catchError -> mock fallback** -- errors must be shown to the user, not masked
- **Data consistency** -- same case/user/payment shows identical data across all screens
- **Performance** -- API calls complete within 200ms (p95)

## Files Changed (summary)

### Backend (New/Modified)
- `controllers/attorney.controller.js` -- add endpoints for cases, clients, reports, notifications
- `controllers/admin.controller.js` -- add endpoints for revenue, reports, client management
- `routes/attorney.routes.js` -- wire new endpoints
- `routes/admin.routes.js` -- wire new endpoints
- `services/revenue.service.js` -- real revenue aggregation from payments table
- `services/report.service.js` -- real report generation from cases/users tables

### Frontend (Modified -- mock removal)
All 18 files listed in the inventory above

### Frontend (New -- empty states)
- Potential new empty-state illustration components per role

### Testing
- All removed mock constants relocated to .spec.ts test files
- New integration tests verifying API -> component data flow
