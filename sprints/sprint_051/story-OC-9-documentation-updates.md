# Story OC-9: Documentation & API Specification Updates

## Status: DONE

## Priority: P2

## Depends On: OC-1 through OC-7 (documents what was built)

## Description
Update all canonical documentation to reflect the new operator capabilities. This ensures
future development, onboarding, and audits have accurate reference material.

### User Story
> As a **developer or product manager**, I want the docs to accurately describe the operator's
> full workflow so I can plan future features and onboard new team members.

## Documentation Changes

### 1. `docs/API_SPECIFICATION.md`
Add the following endpoints under an **Operator** section:

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/operator/cases` | List operator's assigned cases (enriched) | operator, admin |
| GET | `/api/operator/cases/:caseId` | Case detail with joins | operator, admin |
| PATCH | `/api/operator/cases/:caseId/status` | Update case status | operator, admin |
| GET | `/api/operator/unassigned` | Unassigned case queue (enriched) | operator, admin |
| POST | `/api/operator/cases/:caseId/request-assignment` | Request assignment | operator |
| GET | `/api/operator/attorneys` | Available attorneys (basic) | operator, admin |
| POST | `/api/operator/batch-ocr` | Batch OCR processing | operator, admin |

Also document the assignment endpoints under **Assignment** if not already there:
| GET | `/api/assignments/cases/:caseId/ranked-attorneys` | Ranked attorneys for case | operator, admin |
| POST | `/api/assignments/cases/:caseId/auto-assign` | Auto-assign attorney | operator, admin |
| POST | `/api/assignments/cases/:caseId/manual-assign` | Manual attorney assignment | operator, admin |

And the admin assignment request endpoints:
| GET | `/api/admin/assignment-requests` | Pending assignment requests | admin |
| POST | `/api/admin/assignment-requests/:id/approve` | Approve request | admin |
| POST | `/api/admin/assignment-requests/:id/reject` | Reject request | admin |

Include request/response shapes for each.

### 2. `docs/02_PERSONAS_AND_JOURNEYS.md`
Update the **Lisa (Operator/Case Manager)** persona journey to include:
- View enriched queue with priority indicators, court dates, fine amounts
- Open case detail → view full case info, driver contact, activity log
- Assign attorney (auto or manual) → review ranked list → confirm
- Batch process ticket images via OCR
- Communicate with drivers using message templates
- Receive real-time notifications for new cases and assignment approvals
- Request assignment to unassigned cases → admin approval flow

### 3. `docs/04_FUNCTIONAL_REQUIREMENTS.md`
Update the **RBAC Matrix** to document operator permissions:

| Resource | Operator | Admin |
|----------|----------|-------|
| View own assigned cases | ✅ | ✅ (all) |
| View unassigned queue | ✅ | ✅ |
| View case detail | ✅ (own) | ✅ (all) |
| Update case status | ✅ (own) | ✅ (all) |
| Request assignment | ✅ | ❌ (assigns directly) |
| Auto-assign attorney | ✅ | ✅ |
| Manual-assign attorney | ✅ | ✅ |
| Batch OCR | ✅ | ✅ |
| View/send messages | ✅ (own cases) | ✅ (all) |
| View templates | ✅ | ✅ |
| Approve/reject assignments | ❌ | ✅ |

### 4. `docs/06_TECHNICAL_REQUIREMENTS.md`
Add under **Real-time Events**:
- Socket.io events for operator: `case:new`, `case:assigned`, `assignment:approved`,
  `assignment:rejected`, `notification:new`

### 5. `docs/HARD_BUGS_REGISTRY.md`
If any new patterns emerge during implementation (e.g., race conditions in assignment approval),
document them here.

## Acceptance Criteria
- [ ] API_SPECIFICATION.md includes all new operator and admin assignment endpoints
- [ ] Each endpoint has documented request/response shapes
- [ ] PERSONAS_AND_JOURNEYS.md has updated Lisa journey
- [ ] FUNCTIONAL_REQUIREMENTS.md has updated RBAC matrix for operator
- [ ] TECHNICAL_REQUIREMENTS.md documents Socket.io events for operator
- [ ] No stale or contradictory information in existing docs
- [ ] All documentation follows existing formatting conventions

## Test Coverage
- Documentation changes are not code — no automated tests needed
- Review checklist: accuracy against implemented endpoints, no broken links
