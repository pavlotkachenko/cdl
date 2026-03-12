# Story AU-6: Notifications Search Filter

**Status:** DONE

## Description
Added a hidable/unhidable search filter to the Admin Notifications page:
- Search toggle button in the page header alongside Mark All Read
- `showSearch` signal controls visibility
- Full-width search input with clear button
- `searchTerm` signal + `filteredNotifications` computed filters by title and message
- Notification list now uses `filteredNotifications()` instead of `notifications()`

## Files Changed
- `frontend/src/app/features/admin/notifications/admin-notifications.component.ts` — imports, template, CSS, class properties
