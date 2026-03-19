# Story ST-8: Frontend — Review Step + Submission Flow

## Status: DONE

## Description
Implement Step 4 (Review & Submit) showing a summary of all entered data, document attachment, and the final submit action. Also update the success state to match the new design.

## Review Step Layout
- Read-only summary of all form data:
  - Violation type (chip label)
  - Citation number
  - Violation date (formatted)
  - State (full name)
  - Court date (if provided)
  - Location
  - Fine amount (if provided, formatted as $X.XX)
  - Alleged speed (if speeding, formatted as X mph)
  - Description (truncated preview)
- Attached documents list with file sizes
- Edit links that jump back to the relevant step

## Document Upload
- Upload area in review step (or accessible from review)
- Same constraints: PDF/JPG/PNG, max 10MB, max 10 files
- Files listed with name, size, remove button

## Submit Action
- "Submit Ticket" button with loading spinner
- On success: show success state
- On error: inline error message, retry button

## Payload Construction
Map form data to backend expected format:
```typescript
{
  customer_name: currentUser.name,
  customer_type: 'one_time_driver', // or derive from user subscription
  violation_type: ticketTypeForm.value.type,
  violation_date: ticketDetailsForm.value.violationDate,
  violation_details: ticketDetailsForm.value.description,
  state: ticketDetailsForm.value.state,
  town: ticketDetailsForm.value.location,
  citation_number: ticketDetailsForm.value.citationNumber,
  fine_amount: ticketDetailsForm.value.fineAmount,
  alleged_speed: ticketDetailsForm.value.allegedSpeed,
  court_date: ticketDetailsForm.value.courtDate,
}
```

## Success State
- Case number displayed prominently
- "View Case" and "Submit Another" buttons
- "An attorney will review it shortly" message

## Acceptance Criteria
- [ ] Review step shows all form data in read-only format
- [ ] Edit links navigate back to correct step
- [ ] Document upload works from review step
- [ ] Payload maps correctly to backend snake_case format
- [ ] Submit button shows loading state
- [ ] Error state shows inline with retry
- [ ] Success state displays case number
- [ ] "Submit Another" resets entire form + stepper

## Files to Modify
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.ts`
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.scss`
