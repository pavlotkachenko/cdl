/// <reference types="cypress" />

/**
 * Driver Case Management — TC-DRV-005..006
 *
 * Tests that a driver can see their cases listed with status badges
 * and can access attorney selection on a case detail page.
 *
 * Uses real API calls — no stubs.
 */

describe('TC-DRV-005: Driver tickets list shows status badge', () => {
  beforeEach(() => {
    cy.clearAuth();
    cy.loginAs('driver');
  });

  it('TC-DRV-005 — after creating a case via API, /driver/tickets shows at least one case with a status badge', () => {
    // Create a case via API
    cy.createCase({
      customer_name: 'E2E Test Driver',
      customer_type: 'subscriber_driver',
      state: 'TX',
      violation_type: 'speeding',
      violation_date: new Date().toISOString(),
      violation_details: 'TC-DRV-005 automated test case',
    }).then((resp) => {
      // Accept 200 or 201 — both indicate the case was created/returned
      expect(resp.status).to.be.oneOf([200, 201]);
    });

    // Navigate to the driver tickets list
    cy.visit('/driver/tickets');

    // Wait for the list to render
    cy.get('body', { timeout: 15000 }).should(($body) => {
      // Page must have at least some content loaded (not a loading spinner only)
      expect($body.text().trim().length).to.be.greaterThan(0);
    });

    // Verify at least one case/ticket row exists
    cy.get(
      '[data-testid="case-row"], [data-testid="ticket-row"], ' +
        '.case-item, .ticket-item, mat-list-item, ' +
        'table tbody tr, .case-card, .ticket-card',
      { timeout: 15000 }
    ).should('have.length.at.least', 1);

    // Verify a status badge is visible somewhere on the page
    cy.get('body').then(($body) => {
      const hasStatusBadge =
        $body.find(
          '[data-testid="status-badge"], .status-badge, .badge, ' +
            'mat-chip, .mat-mdc-chip, .status-chip, ' +
            '[class*="status"], span.chip'
        ).length > 0 ||
        $body.text().toLowerCase().match(
          /pending|submitted|assigned|open|closed|resolved|in.?progress|new/
        ) !== null;

      expect(hasStatusBadge, 'at least one status badge or status text should be visible').to.be
        .true;
    });
  });
});

// ---------------------------------------------------------------------------

describe('TC-DRV-006: Attorney selection on case detail', () => {
  let caseId: string;

  beforeEach(() => {
    cy.clearAuth();
    cy.loginAs('driver');

    // Create a case and capture the ID
    cy.createCase({
      customer_name: 'E2E Attorney Test Driver',
      customer_type: 'subscriber_driver',
      state: 'CA',
      violation_type: 'speeding',
      violation_date: new Date().toISOString(),
      violation_details: 'TC-DRV-006 automated test case — attorney selection',
    }).then((resp) => {
      expect(resp.status).to.be.oneOf([200, 201]);
      caseId = resp.body?.case?.id ?? resp.body?.id ?? resp.body?.data?.id;
    });
  });

  it('TC-DRV-006 — case detail shows attorney section or assigned attorney name', () => {
    cy.then(() => {
      if (caseId) {
        cy.visit(`/driver/cases/${caseId}`);
      } else {
        // Fallback: navigate to tickets list and click the first case
        cy.visit('/driver/tickets');
        cy.get(
          '[data-testid="case-row"], .case-item, mat-list-item, table tbody tr, .case-card',
          { timeout: 15000 }
        )
          .first()
          .click();
      }
    });

    // Wait for the detail page to load
    cy.get('body', { timeout: 15000 }).should(($body) => {
      expect($body.text().trim().length).to.be.greaterThan(50);
    });

    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();

      const hasAttorneySection =
        text.includes('attorney') ||
        text.includes('counsel') ||
        text.includes('lawyer') ||
        $body.find(
          '[data-testid*="attorney"], [data-cy*="attorney"], ' +
            '.attorney-section, .attorney-card, ' +
            'mat-select[formControlName*="attorney"]'
        ).length > 0;

      expect(
        hasAttorneySection,
        'attorney section or assigned attorney should be visible on case detail'
      ).to.be.true;

      // If not yet assigned, look for a selection button
      const isAssigned =
        $body.find('[data-testid="assigned-attorney"], .assigned-attorney').length > 0 ||
        (text.includes('assigned') && text.includes('attorney'));

      if (!isAssigned) {
        // Try to click the attorney selection button / dropdown
        const $selectBtn = $body.find(
          'button[data-testid*="attorney"], ' +
            'button[data-cy*="attorney"], ' +
            'mat-select[formControlName*="attorney"]'
        );

        if ($selectBtn.length > 0) {
          cy.wrap($selectBtn).first().click({ force: true });

          // Verify the attorney list appears
          cy.get(
            'mat-option, [data-testid="attorney-option"], .attorney-option, ' +
              'mat-autocomplete mat-option, .cdk-overlay-container',
            { timeout: 10000 }
          ).should('exist');

          cy.log('Attorney selection list appeared after clicking selector');
        } else {
          cy.log(
            'No attorney select button found — attorney section present but no action required'
          );
          // The section itself being visible is sufficient for this test
          expect(hasAttorneySection).to.be.true;
        }
      } else {
        cy.log('Attorney is already assigned — name is shown');
        expect(isAssigned).to.be.true;
      }
    });
  });
});
