# Story OC-10: E2E Test Coverage (TC-OPR-001 through TC-OPR-007)

## Status: DONE

## Priority: P0

## Depends On: OC-1, OC-2, OC-3, OC-4, OC-5, OC-7, OC-8 (all features must be implemented)

## Description
Write Cypress E2E tests covering all 7 operator test scenarios from
`docs/10_MANUAL_E2E_TEST_SCENARIOS.md`. Tests hit the real backend (no `cy.intercept()` stubs)
following the project's E2E testing strategy established in the Cypress plan.

### User Story
> As a **QA engineer**, I want automated E2E tests for every operator scenario so regressions
> are caught before deployment.

## Test File
**Path:** `frontend/cypress/e2e/operator/operator.cy.ts`

## Prerequisites
- Backend running at `http://localhost:3000`
- Frontend served at `http://localhost:4200`
- Staging test account: `operator@test.com / Test1234!`
- Admin test account: `admin@test.com / Test1234!` (for setup/verification)
- At least one unseeded case exists (or seed via `cy.apiRequest()`)

## Helper Commands Required
From existing `cypress/support/commands.ts` or new additions:
- `cy.loginAs('operator')` — log in as operator via API
- `cy.loginAs('admin')` — log in as admin for setup steps
- `cy.apiRequest(method, path, body?)` — authenticated API call
- `cy.createCase(fields?)` — create a test case via API

## Test Specifications

### TC-OPR-001 — View Case Queue
```
describe('TC-OPR-001 — View case queue', () => {
  beforeEach(() => {
    cy.loginAs('operator');
  });

  it('displays operator dashboard with case queue', () => {
    cy.visit('/operator/dashboard');
    // Verify queue section exists
    cy.contains('Unassigned Queue').should('be.visible');
    // Verify case cards show required fields
    cy.get('[data-cy="queue-card"]').first().within(() => {
      cy.get('[data-cy="violation-type"]').should('exist');
      cy.get('[data-cy="state"]').should('exist');
      cy.get('[data-cy="court-date"]').should('exist');
      cy.get('[data-cy="fine-amount"]').should('exist');
      cy.get('[data-cy="priority-indicator"]').should('exist');
    });
    // Verify priority is color-coded
    cy.get('[data-cy="priority-indicator"]')
      .should('have.css', 'background-color');
  });
});
```

### TC-OPR-002 — Auto-assign Attorney
```
describe('TC-OPR-002 — Auto-assign attorney', () => {
  let caseId: string;

  beforeEach(() => {
    cy.loginAs('operator');
    // Seed an unassigned case
    cy.apiRequest('POST', '/api/cases', { ... }).then(res => {
      caseId = res.body.case.id;
    });
  });

  it('auto-assigns the highest-ranked attorney', () => {
    cy.visit(`/operator/cases/${caseId}`);
    cy.contains('Assign Attorney').click();
    // Dialog opens
    cy.get('[data-cy="auto-assign-btn"]').click();
    // Verify success
    cy.contains('assigned').should('be.visible');
    // Verify case no longer in unassigned queue
    cy.visit('/operator/dashboard');
    cy.contains(caseId).should('not.exist'); // or case number
  });
});
```

### TC-OPR-003 — Manual Attorney Assignment
```
describe('TC-OPR-003 — Manual attorney assignment', () => {
  it('shows ranked list and allows manual selection', () => {
    cy.loginAs('operator');
    cy.visit(`/operator/cases/${caseId}`);
    cy.contains('Assign Attorney').click();
    // Verify ranked list
    cy.get('[data-cy="attorney-row"]').should('have.length.gte', 1);
    cy.get('[data-cy="attorney-row"]').first().within(() => {
      cy.get('[data-cy="attorney-score"]').should('exist');
      cy.get('[data-cy="attorney-name"]').should('exist');
    });
    // Select second attorney
    cy.get('[data-cy="attorney-row"]').eq(1).click();
    cy.get('[data-cy="confirm-assign-btn"]').click();
    // Verify assignment
    cy.contains('assigned').should('be.visible');
  });
});
```

### TC-OPR-004 — No Attorneys Available (Negative)
```
describe('TC-OPR-004 — No attorneys available', () => {
  it('shows no-attorneys message on auto-assign', () => {
    // Setup: suspend all attorneys via admin API
    cy.loginAs('admin');
    cy.apiRequest('GET', '/api/admin/users?role=attorney').then(res => {
      res.body.users.forEach(attorney => {
        cy.apiRequest('PATCH', `/api/admin/users/${attorney.id}/suspend`);
      });
    });

    cy.loginAs('operator');
    cy.visit(`/operator/cases/${caseId}`);
    cy.contains('Assign Attorney').click();
    cy.get('[data-cy="auto-assign-btn"]').click();
    // Verify message
    cy.contains('No attorneys available').should('be.visible');
    // Cleanup: unsuspend attorneys
    cy.loginAs('admin');
    cy.apiRequest('GET', '/api/admin/users?role=attorney&status=suspended').then(res => {
      res.body.users.forEach(attorney => {
        cy.apiRequest('PATCH', `/api/admin/users/${attorney.id}/unsuspend`);
      });
    });
  });
});
```

### TC-OPR-005 — Process Batch OCR Tickets
```
describe('TC-OPR-005 — Batch OCR processing', () => {
  it('uploads and processes multiple ticket images', () => {
    cy.loginAs('operator');
    cy.visit('/operator/batch-ocr');
    // Upload 3 images
    cy.get('[data-cy="file-input"]').selectFile([
      'cypress/fixtures/ticket-image-1.jpg',
      'cypress/fixtures/ticket-image-2.jpg',
      'cypress/fixtures/ticket-image-3.jpg',
    ], { force: true });
    // Verify files listed
    cy.get('[data-cy="file-item"]').should('have.length', 3);
    // Process
    cy.get('[data-cy="process-all-btn"]').click();
    // Wait for results
    cy.get('[data-cy="ocr-result"]', { timeout: 30000 }).should('have.length', 3);
    // Verify per-file results
    cy.get('[data-cy="ocr-result"]').each($result => {
      cy.wrap($result).find('[data-cy="result-status"]').should('exist');
    });
    // Verify summary
    cy.get('[data-cy="ocr-summary"]').should('contain', '3');
  });
});
```

### TC-OPR-006 — Use Message Template
```
describe('TC-OPR-006 — Use message template', () => {
  it('selects template, customizes, and sends', () => {
    cy.loginAs('operator');
    // Need a case with a conversation
    cy.visit(`/operator/cases/${caseId}/messages`);
    // Open templates
    cy.get('[data-cy="templates-btn"]').click();
    // Select "Court Date Reminder"
    cy.contains('Court Date Reminder').click();
    cy.get('[data-cy="use-template-btn"]').click();
    // Verify composer has template text
    cy.get('[data-cy="message-composer"]')
      .invoke('val')
      .should('contain', 'court date');
    // Customize variable (if editable fields shown)
    // Send
    cy.get('[data-cy="send-btn"]').click();
    // Verify message appears in thread
    cy.get('[data-cy="message-bubble"]').last()
      .should('contain', 'court date');
  });
});
```

### TC-OPR-007 — Attempt to Assign to Suspended Attorney (Negative)
```
describe('TC-OPR-007 — Suspended attorney filtered', () => {
  it('does not show suspended attorneys in assignment list', () => {
    // Setup: suspend one attorney
    cy.loginAs('admin');
    cy.apiRequest('GET', '/api/admin/users?role=attorney').then(res => {
      const attorney = res.body.users[0];
      cy.apiRequest('PATCH', `/api/admin/users/${attorney.id}/suspend`);
      cy.wrap(attorney).as('suspendedAttorney');
    });

    cy.loginAs('operator');
    cy.visit(`/operator/cases/${caseId}`);
    cy.contains('Assign Attorney').click();
    // Verify suspended attorney is NOT in the list
    cy.get('@suspendedAttorney').then(attorney => {
      cy.get('[data-cy="attorney-row"]').each($row => {
        cy.wrap($row).should('not.contain', attorney.full_name);
      });
    });

    // Cleanup: unsuspend
    cy.loginAs('admin');
    cy.get('@suspendedAttorney').then(attorney => {
      cy.apiRequest('PATCH', `/api/admin/users/${attorney.id}/unsuspend`);
    });
  });
});
```

## Test Data Requirements
- `cypress/fixtures/ticket-image-1.jpg` — real ticket photo for OCR (can reuse existing fixture)
- `cypress/fixtures/ticket-image-2.jpg` — second ticket
- `cypress/fixtures/ticket-image-3.jpg` — third ticket (or use same image 3 times)
- Test accounts seeded in staging database

## `data-cy` Attributes Required
The following `data-cy` attributes must be added to component templates during OC-1 through OC-8:

| Component | Attribute | Element |
|-----------|-----------|---------|
| Dashboard | `data-cy="queue-card"` | Each unassigned case card |
| Dashboard | `data-cy="violation-type"` | Violation type text |
| Dashboard | `data-cy="state"` | State text |
| Dashboard | `data-cy="court-date"` | Court date text |
| Dashboard | `data-cy="fine-amount"` | Fine amount text |
| Dashboard | `data-cy="priority-indicator"` | Priority color element |
| Case Detail | `data-cy="assign-attorney-btn"` | Assign Attorney button |
| Attorney Assignment | `data-cy="auto-assign-btn"` | Auto-Assign button |
| Attorney Assignment | `data-cy="attorney-row"` | Each attorney in ranked list |
| Attorney Assignment | `data-cy="attorney-score"` | Score display |
| Attorney Assignment | `data-cy="attorney-name"` | Attorney name |
| Attorney Assignment | `data-cy="confirm-assign-btn"` | Confirm assignment button |
| Batch OCR | `data-cy="file-input"` | File input element |
| Batch OCR | `data-cy="file-item"` | Each file in list |
| Batch OCR | `data-cy="process-all-btn"` | Process All button |
| Batch OCR | `data-cy="ocr-result"` | Each result card |
| Batch OCR | `data-cy="result-status"` | Success/fail indicator |
| Batch OCR | `data-cy="ocr-summary"` | Summary bar |
| Messaging | `data-cy="templates-btn"` | Templates button |
| Messaging | `data-cy="use-template-btn"` | Use Template button |
| Messaging | `data-cy="message-composer"` | Message textarea |
| Messaging | `data-cy="send-btn"` | Send button |
| Messaging | `data-cy="message-bubble"` | Each message in thread |

## Acceptance Criteria
- [ ] All 7 TC-OPR tests pass against real backend (no intercept stubs)
- [ ] Tests seed their own data via `cy.apiRequest()` and clean up after
- [ ] Each test is independent — can run in isolation or as part of full suite
- [ ] Tests complete within 60 seconds each (adjust timeouts for OCR)
- [ ] All `data-cy` attributes present in component templates
- [ ] Tests use `cy.loginAs('operator')` helper (not manual form fill)
- [ ] No flaky tests — assertions wait for DOM state with `should()`
- [ ] `npx cypress run --spec 'cypress/e2e/operator/**'` passes
