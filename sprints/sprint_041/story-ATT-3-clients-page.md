# Story ATT-3: Attorney Clients Page

**Status:** DONE

## Description
Created a new clients management page with client cards, contact info, case history, search, and filter by active/inactive status.

## Changes
- Tab filters: All Clients, Active Clients, Inactive Clients
- Search bar for client name, email, CDL number
- Client cards with avatar, contact info, CDL details
- Per-client stats: total cases, open cases, last case date
- Client detail expansion with case history
- 8 mock clients with varied data
- Active/inactive status badges
- Click-to-view client detail
- Full i18n with ATT.* keys
- OnPush change detection, signals-based state

## Files Changed
- `frontend/src/app/features/attorney/attorney-clients/attorney-clients.component.ts` — new file
