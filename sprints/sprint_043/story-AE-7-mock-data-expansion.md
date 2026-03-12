# Story AE-7: Mock Data Expansion

**Status:** DONE

## Description
Expanded the Case interface and mock data in admin.service.ts:
- Added `operatorId` and `operatorName` optional fields to Case interface
- Expanded mock cases from 3 to 10 with diverse statuses, priorities, violations
- All cases that have an assigned attorney now also have an operator assigned
- Updated case numbers to 2026 prefix for consistency

## Files Changed
- `frontend/src/app/core/services/admin.service.ts` — updated Case interface, expanded getMockCases()
