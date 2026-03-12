# Story AP-2: Attorney Dashboard — Mock Data Fallback for All Sub-Components

**Status:** DONE

## Description
Fixed mock data fallback logic in Attorney Dashboard. Previously, if the API returned an empty array (success with no data), mock data would not display. Changed the fallback to use MOCK_CASES when API returns empty results, ensuring all dashboard sub-components (stats, chart, court dates, recent activity, tabs) always show data. Also applied same fix to rating fallback.

## Files Changed
- `frontend/src/app/features/attorney/attorney-dashboard/attorney-dashboard.component.ts` — changed `loadCases()` to fall back to MOCK_CASES when API returns empty array; changed rating subscriber to fall back to MOCK_RATING on null
