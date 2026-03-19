# Sprint 060 — Submit Ticket Redesign

## Theme
Complete redesign of the Driver Submit Ticket flow to match the new template: custom stepper, chip-based violation types, two-column layout with info sidebar, new form fields (fine amount, alleged speed, citation number), and CDL-specific violation type enum.

## Stories

| ID | Title | Scope | Status |
|----|-------|-------|--------|
| ST-1 | DB Migration — violation_type enum + new case columns | Backend/DB | TODO |
| ST-2 | Backend API — createCase endpoint update | Backend | TODO |
| ST-3 | Frontend — Custom stepper component | Frontend | TODO |
| ST-4 | Frontend — Violation type chip selector | Frontend | TODO |
| ST-5 | Frontend — Form redesign (Details step) | Frontend | TODO |
| ST-6 | Frontend — Info sidebar cards | Frontend | TODO |
| ST-7 | Frontend — OCR integration + stepper wiring | Frontend | TODO |
| ST-8 | Frontend — Review step + submission flow | Frontend | TODO |
| ST-9 | Frontend — Cleanup stale HTML file | Frontend | TODO |
| ST-10 | Tests — Full coverage for all changes | Testing | TODO |

## Dependencies
- ST-1 must complete first (DB migration before backend/frontend)
- ST-2 depends on ST-1 (new columns + enum values)
- ST-3 through ST-6 can run in parallel after ST-2
- ST-7 depends on ST-3 + ST-5 (needs stepper + form)
- ST-8 depends on ST-5 (needs form data)
- ST-10 runs last (covers all changes)

## Key Risks
- Violation type enum migration requires backward compatibility with existing cases
- Payload mapping (camelCase → snake_case) must not break existing flows
- OCR service may need updating if violation type labels change
