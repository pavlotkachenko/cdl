# Story PY-11 — Frontend: CSV Export of Filtered Data

## Status: DONE

## Description
Update the CSV export functionality to work with the new enriched data model and the redesigned page header button.

## Export Button
Located in the page header (top right), not in the table toolbar:
- `class="btn btn-secondary"` — white background, border, secondary text
- SVG cloud-download icon + "Export CSV" text
- Disabled when no data or loading

## CSV Format
Headers: `Date, Time, Description, Case Number, Violation, Amount, Currency, Payment Method, Card Last 4, Status`

Each row:
```csv
"Mar 14, 2026","9:42 AM","Attorney Fee","CASE-2026-000058","Speeding Defense","$450.00","USD","Visa","4242","Paid"
```

## Hidden Requirements
1. **Export filtered data**: If the user has active filters, export only the filtered results, not all payments. However, export ALL filtered results across ALL pages (not just the current page).
2. **Server-side export for large datasets**: If `totalItems > perPage`, the current page only has a subset. Must either:
   - (a) Make a separate API call with same filters but `per_page=9999` to get all data for export, OR
   - (b) Add a backend CSV export endpoint `GET /api/payments/user/me/export?format=csv` that returns the CSV directly
   - Option (a) is simpler for now — just fetch all with current filters.
3. **Filename**: `payment-history-YYYY-MM-DD.csv` where the date is today's date
4. **Encoding**: UTF-8 BOM (`\uFEFF` prefix) for Excel compatibility
5. **Amount formatting**: Export as plain number (e.g., `450.00`), not formatted currency, so Excel can treat it as a number
6. **Status mapping**: Export the display label ("Paid"), not the API value ("succeeded")
7. **Empty export**: If no data, show snackbar "No data to export" and don't create a file
8. **No mat-icon**: Button uses SVG download/cloud icon from template

## Acceptance Criteria
- [x] Export button in page header with SVG icon
- [x] CSV includes all enriched columns
- [x] Exports all filtered results (not just current page)
- [x] UTF-8 BOM for Excel compatibility
- [x] Filename includes current date
- [x] Status mapped to display labels
- [x] Empty data shows notification, no download
