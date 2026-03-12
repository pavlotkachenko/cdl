# Story AU-5: Documents Search Filter

**Status:** DONE

## Description
Added a hidable/unhidable search filter to the Admin Documents page:
- Search toggle button (search/search_off icon) in the page header
- `showSearch` signal controls visibility
- Full-width search input with clear button
- `searchTerm` signal filters documents by name, category, or type
- `filteredDocs` computed updated to include search term filtering

## Files Changed
- `frontend/src/app/features/admin/documents/admin-documents.component.ts` — imports, template, CSS, class properties
