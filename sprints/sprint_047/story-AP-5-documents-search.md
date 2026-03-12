# Story AP-5: Attorney Documents — Add Search

**Status:** DONE

## Description
Added a search bar to the Attorney Documents page between the header and category filter chips. Search filters documents by name, category, and file type. Uses Material form field with outline appearance, search icon prefix, and clear button suffix.

## Files Changed
- `frontend/src/app/features/attorney/attorney-documents/attorney-documents.component.ts` — added `FormsModule`, `MatFormFieldModule`, `MatInputModule` imports, `searchTerm` signal, search bar template, updated `filteredDocs` computed to include search filtering, added search-bar CSS
- `frontend/src/assets/i18n/en.json` — added `ATT.SEARCH_DOCUMENTS` key
