# TD-003: Admin Test Data Requirements

> **Goal:** Seed comprehensive test data so every admin tab shows meaningful, realistic content.
> **Date:** 2026-03-19

---

## Current State

| Table | Rows | Gap |
|-------|------|-----|
| users | 1151 (3 admin, 990 driver, 3 attorney, 4 operator) | Too many drivers from bulk import; attorneys/operators need enrichment |
| cases | 67 (56 new, 6 assigned, 5 closed) | 84% stuck in "new" — no status variety |
| payments | 56 (27 succeeded, 18 pending, 6 failed, 5 refunded) | OK but needs more method variety |
| notifications | 20 (11 unread) | Needs more variety and admin-specific types |
| case_files | 20 | Needs more file types and categories |
| activity_log | 75 | Needs status_change, assignment, and admin actions |
| assignment_requests | 0 | **Empty** — Assignment Requests tab shows nothing |
| invoices | 0 | **Empty** — Revenue tab has no invoice data |
| subscriptions | 2 | Minimal |

---

## Per-Tab Requirements

### Tab 1: Dashboard (`/admin/dashboard`)
**Needs:** Variety in case statuses, recent cases, workload data, chart data

| Data | What to seed |
|------|-------------|
| Case status variety | Move 20 "new" cases → reviewed(5), assigned_to_attorney(5), waiting_for_driver(3), send_info_to_attorney(3), call_court(2), pay_attorney(2) |
| Recent cases | Ensure 10+ cases created in last 7 days with customer_name, state, violation_type |
| Operator workload | Assign 5-10 cases per operator (4 operators exist) |
| Attorney workload | Assign 3-8 cases per attorney (3 attorneys exist) |
| Chart data | Already have violation_type and state variety ✓ |

### Tab 2: Case Management (`/admin/case-management`)
**Needs:** Cases in various statuses with all fields populated

| Data | What to seed |
|------|-------------|
| Court dates | Add court_date to 15 more cases (future dates) |
| Attorney prices | Add attorney_price to 20+ cases ($150-$500 range) |
| Carrier info | Add carrier names to 15+ cases |
| Customer names | Ensure all 67 cases have customer_name (currently some may be null) |

### Tab 3: Case Detail (`/admin/cases/:id`)
**Needs:** Rich activity log, documents, operator/attorney assignments

| Data | What to seed |
|------|-------------|
| Activity log variety | Add 30+ entries: status_change, admin_status_override, note_added, document_uploaded, operator_assigned, attorney_assigned |
| Case files per case | Ensure top 5 cases have 3+ files each |
| Full assignment chain | 5 cases with both operator AND attorney assigned |

### Tab 4: Staff Management (`/admin/staff-management`)
**Needs:** Staff with performance metrics (computed from case data)

| Data | What to seed |
|------|-------------|
| Attorney success rates | Already have success_rate on users table ✓ |
| Operator case counts | Assign more cases to operators |
| Active/inactive staff | Set 1 operator account_locked_until for "inactive" display |

### Tab 5: Client Management (`/admin/client-management`)
**Needs:** Drivers with cases, varied activity

| Data | What to seed |
|------|-------------|
| Active drivers | Ensure 10+ drivers have 2+ active cases |
| Inactive drivers | Ensure 5 drivers have only closed cases |
| Recent contact | Update cases for 10 drivers so updated_at is recent |
| Phone numbers | Add phone to 15 driver profiles |

### Tab 6: User Management (`/admin/users`)
**Needs:** Users in various statuses

| Data | What to seed |
|------|-------------|
| Suspended user | Set account_locked_until on 2 driver accounts |
| Recent invites | 3 users with recent created_at |
| Role variety | Already have admin, driver, attorney, operator ✓ |

### Tab 7: Reports (`/admin/reports`)
**Needs:** KPI stats and staff performance data (computed from cases/users)

| Data | What to seed |
|------|-------------|
| Closed cases with dates | Set closed_at on 5 closed cases for resolution time calc |
| Attorney case assignments | Spread cases across 3 attorneys |
| Date-ranged data | Cases created across last 30 days |

### Tab 8: Revenue Dashboard (`/admin/revenue-dashboard`)
**Needs:** Payments with dates, methods, and attorney associations

| Data | What to seed |
|------|-------------|
| Daily revenue variety | Spread payment created_at across last 30 days |
| Payment methods | Ensure 4+ methods: card, bank_transfer, ach, stripe |
| Attorney revenue | Link payments to cases with assigned attorneys |
| Failed/refunded | Already have 6 failed + 5 refunded ✓ |
| Invoices | Create 10 invoices linked to payments |

### Tab 9: Assignment Requests (`/admin/assignment-requests`)
**Needs:** Pending requests for admin to approve/reject

| Data | What to seed |
|------|-------------|
| Pending requests | 5 assignment_requests with status='pending', linking operators to cases |
| Approved requests | 3 with status='approved' (historical) |
| Rejected requests | 2 with status='rejected' (historical) |

### Tab 10: Operator Kanban (`/admin/kanban`)
**Needs:** Cases distributed across operators and unassigned pool

| Data | What to seed |
|------|-------------|
| Unassigned cases | Ensure 10+ cases have assigned_operator_id = null |
| Per-operator spread | 5-15 cases per operator |
| Age variety | Cases with created_at from 1 hour to 7 days ago |

### Tab 11: Case Table (`/admin/cases`)
**Needs:** Filterable data with all columns populated

| Data | What to seed |
|------|-------------|
| All columns filled | customer_name, state, violation_type, status, court_date, attorney_name |
| Multiple states | Already have 10 states ✓ |
| Multiple carriers | Add 5+ carrier names |

### Tab 12: Notifications (`/admin/notifications`)
**Needs:** Admin-targeted notifications

| Data | What to seed |
|------|-------------|
| Admin notifications | 15+ notifications with user_id = admin user ID |
| Type variety | case_update, payment, court_date, system, message |
| Read/unread mix | 60% unread |
| Recent dates | Spread across last 7 days |

### Tab 13: Documents (`/admin/documents`)
**Needs:** Case files with varied types

| Data | What to seed |
|------|-------------|
| File type variety | ticket, evidence, court_document, insurance, id_document, correspondence |
| File names | Realistic names: "citation-TX-2026.pdf", "insurance-card.jpg" |
| Multiple cases | Files spread across 10+ cases |

### Tab 14: Settings (`/admin/settings`)
**Needs:** No data (client-only) ✓

### Tab 15: Operator Dashboard (`/admin/operator-dashboard`)
**Needs:** Same as Dashboard (Tab 1) — workload stats, queue, charts
Already covered by Dashboard data requirements ✓

---

## Seed Execution Plan

1. **Phase 1: Case status diversification** — Update 20 "new" cases to various statuses
2. **Phase 2: Case enrichment** — Add court_date, attorney_price, carrier to cases
3. **Phase 3: Assignment requests** — Create 10 assignment_request records
4. **Phase 4: Activity log expansion** — Add 30+ varied activity entries
5. **Phase 5: Notification enrichment** — Add 15 admin-targeted notifications
6. **Phase 6: Document variety** — Add 15 case_files with diverse types
7. **Phase 7: Invoice creation** — Create 10 invoices linked to payments
8. **Phase 8: Payment date spread** — Update payment dates across 30 days
9. **Phase 9: User enrichment** — Phone numbers, suspended accounts, driver activity
