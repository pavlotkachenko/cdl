# Story PY-6 — Frontend: Filter Card with Active Chips

## Status: DONE

## Description
Redesign the filter section from Material form fields to custom-styled inputs matching the HTML template. Add active filter chip strip that shows applied filters with individual remove buttons.

## Template Reference
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🔍 Search transactions...  │ All Statuses ▼ │ Start Date │ End Date │ $Min │ $Max │
│                                                                              │
│ [Apply Filters]  [Reset]                                                     │
│ ┌──────────────┐ ┌───────────────────┐                                       │
│ │ Status: Paid ✕│ │ Min Amount: $100 ✕│                                       │
│ └──────────────┘ └───────────────────┘                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Filter Fields
| Field | Type | Placeholder | Behavior |
|-------|------|-------------|----------|
| Search | Text input with 🔍 icon | "Search transactions..." | Filters description, case number, violation |
| Status | Custom select dropdown | "All Statuses" | Options: All, Paid, Pending, Failed, Refunded |
| Start Date | Native date input with 📅 icon | "Start Date" | Sets lower bound for created_at |
| End Date | Native date input with 📅 icon | "End Date" | Sets upper bound for created_at |
| Min Amount | Number input with $ prefix | "Min Amount" | Minimum payment amount |
| Max Amount | Number input with $ prefix | "Max Amount" | Maximum payment amount |

## Active Filter Chips
When a filter is applied (non-default value), a chip appears below the filter row:
- Chip shows filter name + value (e.g., "Status: Paid", "Min Amount: $100")
- Each chip has an ✕ button to remove that specific filter
- Removing a chip resets that filter to default and triggers a reload
- Chips use `$teal-bg` background, `$teal-border` border, `$teal` text color

## Hidden Requirements
1. **No Material form fields**: Replace `mat-form-field`, `mat-select`, `matDatepicker` with native HTML inputs styled to match the template's custom design (40px height, `$bg` background, `1.5px solid $border` border, `$radius-sm` border-radius)
2. **Focus state**: Inputs get `border-color: $teal; background: white; box-shadow: 0 0 0 3px rgba(29,173,140,.1)` on focus
3. **Select arrow**: Custom SVG chevron-down arrow positioned absolutely inside select wrapper
4. **Date icon**: SVG calendar icon positioned absolutely inside date input wrapper
5. **Amount prefix**: `$` character positioned absolutely inside amount input, input has left padding to accommodate
6. **Apply vs auto-apply**: Template has explicit "Apply Filters" button — filters are NOT auto-applied on change (unlike current implementation). User must click Apply.
7. **Reset button**: Resets all fields to defaults AND reloads data. Gets red hover state (`$red-border`, `$red` text, `$red-bg` background)
8. **Chip strip**: Only visible when at least one non-default filter is active
9. **Reactive form**: Keep using `FormGroup` but disconnect the auto-subscribe on value changes — only apply on button click
10. **SVG icons**: Filter button uses funnel SVG, reset uses X SVG — no mat-icons

## Acceptance Criteria
- [x] All 6 filter fields rendered with custom styling (no Material form fields)
- [x] Apply Filters button triggers API call with all filter params
- [x] Reset button clears all filters and reloads
- [x] Active filter chips appear for non-default filters
- [x] Individual chip removal works
- [x] Focus states match template
- [x] Custom select arrow, date icon, amount prefix rendered
- [x] SVG icons on buttons (no mat-icons)
