# Story 12.5 — Driver Feature Spec Files

**Sprint:** 008 — Driver Experience Modernization
**Status:** DONE

## Tests Written

### driver-dashboard.component.spec.ts (7 tests)
- loads cases on init and computes stats correctly
- recentCases returns at most 5 cases
- sets error signal on getMyCases failure
- submitNewCase navigates to /driver/submit-ticket
- viewCase navigates to /driver/cases/:id
- viewAllCases navigates to /driver/tickets
- getStatusLabel maps known status codes

### notifications.component.spec.ts (6 tests)
- loads notifications from service on init
- unreadCount reflects service BehaviorSubject value
- filteredNotifications shows all by default
- filteredNotifications filters to unread only
- filteredNotifications filters by type
- markAllAsRead calls service subscribe

### profile.component.spec.ts (5 tests)
- populates form from currentUser$ on init
- saveProfile calls authService.updateProfile with combined name
- saveProfile with invalid form shows snackBar and does not call service
- savePassword calls authService.changePassword
- savePassword with mismatched passwords shows snackBar

## Total
272/272 tests pass (was 254 before Sprint 008, +18 new tests).
