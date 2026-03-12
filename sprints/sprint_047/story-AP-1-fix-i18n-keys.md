# Story AP-1: Fix Broken i18n Keys Across All Attorney Pages

**Status:** DONE

## Description
Added ~60 missing ATT keys to `en.json` that were referenced in Attorney component templates but not present in the English translation file, causing raw key strings (e.g., `ATT.UPCOMING_COURT_DATES`) to appear on screen.

Key groups added:
- Dashboard: `WELCOME_BACK`, `DASHBOARD_SUBTITLE`, `PENDING_CASES`, `RESOLVED_CASES`, `UPCOMING_COURT_DATES`, `NO_COURT_DATES`, `NO_RATINGS`, `NO_RECENT_ACTIVITY`, `NO_CASES_TAB`, `TAB_PENDING/ACTIVE/RESOLVED`
- Cases: `CASES_FOUND`, `SEARCH_PLACEHOLDER`, `STATUS_ALL/PENDING`, `VIOLATION_ALL`, `NO_CASES_TITLE/SUBTITLE`
- Calendar: `CALENDAR_TITLE`, `CALENDAR_GRID`, `EVENTS_LIST`, `EVENTS_ON`, `UPCOMING_EVENTS`, `VIEW_EVENT`, `MODIFY_EVENT`
- Clients: `CLIENTS_TITLE`, `ADD_CLIENT`, `AVG_CASES_CLIENT`, `CLEAR_SEARCH`, `CDL_LABEL`, `SATISFACTION`, `TOTAL`, `VIEW`, `CASES`, `MESSAGE`
- Reports: `REPORTS_ANALYTICS`, `CLIENT_INSIGHTS`, `REVENUE`, `MONTHLY_PERFORMANCE`, `MONTH`, table column keys, chart section keys
- Documents: `SEARCH_DOCUMENTS`
- Profile: `PROFILE_INFO`, `FIRST_NAME`, `LAST_NAME`, `FULL_NAME`, `EMAIL`, `PHONE`, `BAR_NUMBER`, `FIRM_NAME`, password-related keys

## Files Changed
- `frontend/src/assets/i18n/en.json` — added ~60 ATT keys
