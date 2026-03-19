# Story PY-8 — Frontend: Custom Pagination

## Status: DONE

## Description
Replace Material `mat-paginator` with a custom pagination bar matching the template design. Includes rows-per-page selector, page info text, and first/prev/numbered-pages/next/last navigation buttons.

## Template Reference
```
┌──────────────────────────────────────────────────────────────────────┐
│ Rows per page [10 ▼]   1–10 of 42        [<<] [<] [1] [2] [3] [>] [>>] │
└──────────────────────────────────────────────────────────────────────┘
```

## Specifications

### Left Side
- **Label**: "Rows per page" — `font-size: 12px; font-weight: 600; color: $text-muted`
- **Selector**: Native `<select>` with options 10, 25, 50. Styled: `height: 32px; border: 1.5px solid $border; border-radius: 5px; font-size: 12px; font-weight: 700`
- **Page info**: "1–10 of 42" — `font-size: 12px; font-weight: 600; color: $text-muted`

### Right Side — Page Buttons
- 32×32px square buttons with `border: 1.5px solid $border; border-radius: 5px`
- **First** (<<): Double left chevron SVG. Disabled when on page 1.
- **Prev** (<): Single left chevron SVG. Disabled when on page 1.
- **Page numbers**: Show current page ± 1 pages. Active page: `background: $teal; border-color: $teal; color: white; box-shadow: $shadow-teal`.
- **Next** (>): Single right chevron SVG. Disabled when on last page.
- **Last** (>>): Double right chevron SVG. Disabled when on last page.
- **Hover**: `border-color: $teal-border; color: $teal; background: $teal-bg`
- **Disabled**: `opacity: 0.35; cursor: not-allowed`

## Hidden Requirements
1. **Server-side pagination**: Changing page/perPage triggers new API call with `page` and `per_page` params. Do NOT use client-side slicing.
2. **Page number windowing**: When there are many pages, show at most 5 page number buttons centered around the current page. E.g., for page 5 of 10: `[3] [4] [5] [6] [7]`.
3. **Reset to page 1**: When filters change or per_page changes, reset to page 1.
4. **State management**: Use signals — `currentPage = signal(1)`, `perPage = signal(10)`, `totalItems = signal(0)`. Derive `totalPages = computed(() => Math.ceil(totalItems() / perPage()))`.
5. **Empty state**: When 0 results, show "0 of 0" and all buttons disabled.
6. **Keyboard accessible**: Page buttons must be focusable and activatable with Enter/Space. Disabled buttons have `aria-disabled="true"`.
7. **Border-top**: Pagination sits at the bottom of the table card with `border-top: 1px solid $border-light`.
8. **No MatPaginatorModule**: Remove from imports.

## Acceptance Criteria
- [x] Rows per page selector works (10, 25, 50)
- [x] Page info shows correct range (e.g., "1–10 of 42")
- [x] All 5 navigation buttons work (first, prev, pages, next, last)
- [x] Active page highlighted with teal background
- [x] Disabled states correct at boundaries
- [x] Page change triggers server-side data fetch
- [x] Filter change resets to page 1
- [x] No MatPaginatorModule in imports
- [x] Keyboard accessible
