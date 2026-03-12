# Story ATT-5: Attorney Notifications Page

**Status:** DONE

## Description
Created a notifications page following the carrier/admin notification pattern with mock data, unread indicators, and mark-as-read functionality.

## Changes
- 10 mock notifications: new cases, court reminders, document uploads, payments, messages, deadlines
- Notification types with distinct icons/colors: info (blue), warning (amber), success (green), error (red)
- Unread count banner
- Click-to-mark-read, mark-all-read button
- Unread indicator: left border + dot + tinted background
- Full i18n with ATT.* keys
- OnPush change detection, signals-based state

## Files Changed
- `frontend/src/app/features/attorney/attorney-notifications/attorney-notifications.component.ts` — new file
