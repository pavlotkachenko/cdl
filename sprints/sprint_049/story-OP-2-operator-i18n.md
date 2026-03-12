# Story OP-2: Operator i18n Keys

## Status: DONE

## Description
Add OPR.* translation keys for the operator dashboard to all three language files.

## Changes
- **`en.json`**: Added ~40 OPR keys (DASHBOARD, DASHBOARD_SUBTITLE, MY_ASSIGNED, UNASSIGNED_QUEUE, stat labels, status labels, priority labels, etc.) + NAV.UNASSIGNED_QUEUE
- **`es.json`**: Spanish translations for all OPR keys + NAV.UNASSIGNED_QUEUE
- **`fr.json`**: French translations for all OPR keys + NAV.UNASSIGNED_QUEUE

## Acceptance Criteria
- [x] All OPR.* keys present in en.json, es.json, fr.json
- [x] NAV.UNASSIGNED_QUEUE added for sidebar
- [x] Dashboard renders translated text in all three languages
