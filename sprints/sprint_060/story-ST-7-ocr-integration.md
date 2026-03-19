# Story ST-7: Frontend — OCR Integration + Stepper Wiring

## Status: DONE

## Description
Wire the existing OCR scan functionality into the new custom stepper and map OCR results to new form fields (fine_amount, alleged_speed, violation type chip).

## Changes

### OCR → Form Field Mapping
| OCR Field | Form Field | Notes |
|-----------|------------|-------|
| `ticketNumber` | `citationNumber` | Already mapped |
| `violationDate` | `violationDate` | Already mapped |
| `state` | `state` | Already mapped |
| `location` | `location` | Already mapped |
| `courtDate` | `courtDate` | Already mapped |
| `fineAmount` | `fineAmount` | NEW — wire to new field |
| `violationType` | `type` (chip selection) | NEW — map OCR string to enum value |

### OCR Violation Type Mapping
OCR may return free-text like "speeding", "overweight", "logbook". Map to chip values:
```typescript
const OCR_TYPE_MAP: Record<string, string> = {
  'speeding': 'speeding',
  'speed': 'speeding',
  'logbook': 'hos_logbook',
  'hours of service': 'hos_logbook',
  'hos': 'hos_logbook',
  'inspection': 'dot_inspection',
  'dot': 'dot_inspection',
  'suspension': 'suspension',
  'suspended': 'suspension',
  'csa': 'csa_score',
  'dqf': 'dqf',
  'disqualification': 'dqf',
};
```

### Stepper Integration
- Step 1 (Scan): Upload area + OCR processing
- On OCR success: auto-advance stepper to step 2 (Type), pre-select chip if violation type detected
- On OCR skip: advance to step 2 with no pre-fills
- OCR confidence banner persists across steps

### Alleged Speed from OCR
If OCR detects a speed value (e.g., "78 in a 65 zone"), extract and set `allegedSpeed`.

## Acceptance Criteria
- [ ] OCR scan triggers from Step 1 upload area
- [ ] OCR results populate all mapped form fields including fineAmount
- [ ] OCR violation type maps to correct chip selection
- [ ] Stepper advances to Step 2 after scan
- [ ] OCR confidence banner shows field count
- [ ] Skip button advances without OCR
- [ ] Alleged speed extracted from OCR text when available

## Files to Modify
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.ts`
