# Story 11.1 — AttorneyService

**Sprint:** 007
**Theme:** Attorney Portal Modernization

## What
Create `frontend/src/app/core/services/attorney.service.ts` — a dedicated Angular 21 service wrapping all attorney-scoped case API endpoints. Replaces the scattered `CaseService` calls in attorney components.

## Endpoints
| Method | URL | Purpose |
|--------|-----|---------|
| GET | `/api/cases/my-cases` | List attorney's assigned cases |
| GET | `/api/cases/:id` | Get single case details |
| GET | `/api/cases/:id/documents` | List case documents |
| POST | `/api/cases/:id/accept` | Accept assigned case |
| POST | `/api/cases/:id/decline` | Decline assigned case |
| POST | `/api/cases/:id/status` | Update case status + comment |

## Interfaces exported
- `AttorneyCase` — id, case_number, status, violation_type, state, driver_name, created_at, attorney_price
- `CaseDocument` — id, file_name, file_type, file_size, uploaded_at, url

## Acceptance Criteria
- [ ] `inject(HttpClient)` — no constructor injection
- [ ] `providedIn: 'root'`
- [ ] All methods return typed `Observable<T>`
- [ ] Uses `environment.apiUrl`
