# Story AP-5: Admin Notifications Page

**Status:** DONE

## Description
Created a new admin notifications page following the carrier notifications pattern, with
mock notification data, unread indicators, and mark-as-read functionality.

## Changes
- New AdminNotificationsComponent with OnPush change detection and signals
- 10 mock notifications covering: new cases, escalations, attorney actions, payments, staff requests, security alerts, reports, court dates, registrations, backups
- 4 notification types with distinct icon/color: info (blue), warning (amber), success (green), error (red)
- Unread count banner with notifications_active icon
- Click-to-mark-read on individual notifications, mark-all-read button
- Unread indicator: left border + blue dot + slightly tinted background
- Loading spinner state (400ms simulated async load)
- Full i18n with ADMIN.* translation keys

## Files Changed
- `frontend/src/app/features/admin/notifications/admin-notifications.component.ts` — new file
