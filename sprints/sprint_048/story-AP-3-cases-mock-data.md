# Story AP-3: Attorney My Cases — Mock Data Fallback for All Sub-Components

**Status:** DONE

## Description
Fixed mock data fallback logic in Attorney My Cases. Same issue as Dashboard — API returning empty array didn't trigger mock data. Changed `loadCases()` to use MOCK_CASES when API returns empty results, ensuring the case list, filters, and search all have data to display.

## Files Changed
- `frontend/src/app/features/attorney/attorney-cases/attorney-cases.component.ts` — changed `loadCases()` to fall back to MOCK_CASES when API returns empty array
