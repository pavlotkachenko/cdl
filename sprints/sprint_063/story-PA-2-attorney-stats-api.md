# Story PA-2: Attorney Stats in Case Detail API

## Status: DONE

## Changes

### `backend/src/controllers/case.controller.js` — `getCaseById`
Extended the attorney join to include profile fields:
```
attorney:assigned_attorney_id(id, full_name, email, phone, success_rate, specializations, state_licenses, current_cases_count, created_at)
```

Added derived stats enrichment:
- `win_rate` = `success_rate * 100` (percent, rounded)
- `years_experience` = `currentYear - attorney.created_at.getFullYear()` (min 1)
- `cases_won` = `current_cases_count` (proxy — no separate won count in schema)

## Response Shape
```json
{
  "case": {
    "attorney": {
      "id": "...",
      "full_name": "John Smith",
      "win_rate": 87,
      "years_experience": 5,
      "cases_won": 23
    }
  }
}
```
