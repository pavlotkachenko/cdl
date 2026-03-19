# Story ST-5: Frontend — Form Redesign (Details Step)

## Status: DONE

## Description
Redesign the ticket details form to match the template: two-column grid layout, custom-styled native inputs (replacing Material form fields), new fields (fine_amount, alleged_speed), character counter, form dividers, required indicators, and inline error states.

## Layout Structure
```
.form-layout (grid: 1fr 300px)
├── .form-card (main form)
│   ├── .form-card-header (icon + title + step indicator)
│   ├── .form-body
│   │   ├── Required legend
│   │   ├── Row: Citation Number + Violation Date
│   │   ├── Row: State + Court Date
│   │   ├── Divider: "Violation Type"
│   │   ├── Chip selector (from ST-4)
│   │   ├── Divider: "Location & Details"
│   │   ├── Full-width: Incident Location
│   │   ├── Row: Fine Amount + Alleged Speed (conditional)
│   │   └── Full-width: Description + char counter
│   └── .form-footer (encryption note + Back / Continue buttons)
└── Info sidebar (from ST-6)
```

## Form Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Citation Number | text | No | Icon left (document), optional tag |
| Violation Date | date | Yes | Icon left (calendar), red dot |
| State | select | Yes | Full state names, value=2-letter code |
| Court Date | date | No | Icon left (calendar), "if known" tag |
| Location | text | Yes | Icon left (pin), full-width |
| Fine Amount | number | No | "$" icon left, placeholder "0.00" |
| Alleged Speed | number | No | "mph" text right, only when type=speeding |
| Description | textarea | Yes | 500 char max, counter, min-height 110px |

## Conditional Logic
- `Alleged Speed` field: visible ONLY when `ticketTypeForm.value.type === 'speeding'`
- When hidden, value should be cleared from form

## Styling
- Replace Material `mat-form-field` with native `<input>`, `<select>`, `<textarea>`
- Custom CSS classes matching template: `.field-input`, `.field-select`, `.field-textarea`
- Error state: `.error` class on input + `.field-error` message below
- Filled state: `.filled` class (teal border, teal-bg)
- Focus: teal border + 3px teal ring
- Icons positioned absolutely inside `.field-input-wrap`

## State Dropdown
- Use full state names as display labels
- Value is 2-letter abbreviation (e.g., "Texas" → "TX")
- All 50 US states + DC

## Acceptance Criteria
- [ ] Two-column grid layout matching template
- [ ] All 8 form fields rendered with correct styling
- [ ] Required fields have red dot indicator
- [ ] Optional fields have "optional" / "if known" tags
- [ ] Input icons render correctly (left and right positioned)
- [ ] Inline error messages show on touched + invalid
- [ ] Character counter on description (0/500)
- [ ] Alleged Speed conditionally shown for speeding only
- [ ] State dropdown with full names, 2-letter values
- [ ] Form dividers with labels
- [ ] Form footer with encryption note + navigation buttons
- [ ] "Continue to Review" disabled until form valid
- [ ] Mobile: grid collapses to single column at 768px

## Files to Modify
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.ts`
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.scss`
