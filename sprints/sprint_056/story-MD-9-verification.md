# MD-9: Comprehensive testing and data consistency verification

**Status:** TODO
**Priority:** P2
**Dependencies:** MD-8

## Description
End-to-end verification that all screens show real data (or proper empty states) and data is consistent across roles. Run the full test suite and verify no regressions. This is the final story in the sprint -- it validates that the entire mock data migration was successful.

## Acceptance Criteria

- [ ] Manual verification: log in as each role (driver, carrier, attorney, admin, operator, paralegal) and verify no fake data visible
- [ ] Same case appears with identical data on driver, attorney, operator, and admin screens
- [ ] Same user appears with identical name/email across all screens they appear on
- [ ] Revenue numbers on admin dashboard match sum of actual payments in database
- [ ] All notification counts are real (not hardcoded 3, 5, 8, etc.)
- [ ] All date values are real (not hardcoded "Mar 9, 2026" etc.)
- [ ] Frontend unit tests pass: npx ng test --no-watch (no regressions from mock removal)
- [ ] Backend tests pass: npm test (no regressions from new endpoints)
- [ ] E2E smoke test passes for each role's dashboard
- [ ] No console.log warnings about mock data or fallbacks
- [ ] Empty states display correctly when database tables are empty
- [ ] Error states display correctly when API endpoints return errors

## Files

- All spec files across modified components
- Cypress E2E tests (if applicable)

## Technical Notes

- Data consistency verification requires at least one complete case in the database with associated data across all tables (case, payments, documents, notifications, messages, users)
- Test with both populated data (happy path) and empty database (empty state path)
- Check browser console for any residual warnings or errors related to mock data
- Performance verification: all API calls should complete within 200ms (p95) as per project NFRs
- Cross-role consistency is critical: if a case shows "CDL-2026-00042" on the driver screen, the same case must show the same number on attorney, operator, and admin screens
- Notification badge counts must reflect real unread counts, not hardcoded numbers
- Revenue totals must be mathematically consistent: sum of individual payments = total revenue shown on dashboard

## Verification Checklist by Role

### Driver
- [ ] Messages screen shows real conversations or empty state
- [ ] No fake attorney names in conversation list
- [ ] Notification count reflects real unread notifications

### Attorney
- [ ] Dashboard shows real pending cases or empty state
- [ ] Cases list shows real cases with real client names
- [ ] Reports show real performance data or zero/empty state
- [ ] Notifications are real
- [ ] Client list shows real clients
- [ ] Documents list shows real documents

### Admin
- [ ] Dashboard KPIs reflect real data
- [ ] Revenue dashboard shows real financial data or zero state
- [ ] Reports show real metrics
- [ ] Client management shows real clients (no fake PII)
- [ ] Notifications are real
- [ ] Documents are real

### Operator
- [ ] Dashboard shows real assigned/unassigned cases or empty state
- [ ] KPI summary reflects real case counts

### Carrier
- [ ] Documents show real documents or empty state
- [ ] Analytics show real fleet data or empty state

### Shared
- [ ] Payment history shows real transactions or empty state
