# Story 6.4 — Tests: template.service.js

**Epic:** Backend Test Coverage
**Priority:** HIGH
**Status:** DONE

## User Story
As a developer,
I want unit tests for the template variable engine,
so that broken substitution patterns don't send malformed emails to drivers.

## Scope
- `extractVariables` — detects `{{var}}`, deduplicates, empty string (pure)
- `substituteVariables` — replaces all, handles missing vars, whitespace in braces (pure)
- `previewTemplate` — uses default samples, accepts overrides (pure)
- `createTemplate` — DB insert, required field validation
- `getTemplateById` — found, not found, DB error
- File: `backend/src/__tests__/template.service.test.js`

## Acceptance Criteria
- [x] `extractVariables` deduplicates repeated placeholders
- [x] `substituteVariables` handles `{{ name }}` with spaces
- [x] `createTemplate` throws when name/category/body missing
- [x] `getTemplateById` throws "Template not found" when data is null
