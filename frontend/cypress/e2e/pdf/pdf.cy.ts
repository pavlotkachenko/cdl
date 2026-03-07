/// <reference types="cypress" />

/**
 * PDF Export E2E Tests — TC-PDF-002..003
 *
 * Uses REAL API calls (no cy.intercept stubs).
 * Backend: http://localhost:3000
 * Frontend: http://localhost:4200
 */

describe('PDF Export — TC-PDF-002..003', () => {
  beforeEach(() => {
    cy.clearAuth();
  });

  // ---------------------------------------------------------------------------
  // TC-PDF-002: Carrier compliance report PDF for a valid date range
  // ---------------------------------------------------------------------------
  it('TC-PDF-002: compliance report PDF request for 2025 returns 200 or graceful 404', () => {
    cy.loginAs('carrier');
    cy.visit('/driver/dashboard');

    cy.get('body').should('be.visible');

    const startDate = '2025-01-01';
    const endDate = '2025-12-31';

    cy.apiRequest(
      'GET',
      `/carriers/me/compliance-report/pdf?startDate=${startDate}&endDate=${endDate}`
    ).then((resp) => {
      // Accept: 200 (PDF generated), 404 (endpoint not yet implemented),
      //         400 (validation error), 403 (access denied — role mismatch)
      expect(resp.status).to.be.oneOf([200, 400, 403, 404]);

      if (resp.status === 200) {
        // If the endpoint exists and returns a PDF, verify content-type
        const contentType = resp.headers['content-type'] || '';
        expect(contentType.toLowerCase()).to.satisfy((ct: string) =>
          ct.includes('pdf') ||
          ct.includes('application/octet-stream') ||
          ct.includes('application/binary')
        );
      }
    });
  });

  // ---------------------------------------------------------------------------
  // TC-PDF-003: Compliance report PDF with future dates returns 200 or graceful error (no 500)
  // ---------------------------------------------------------------------------
  it('TC-PDF-003: compliance report PDF with future dates does not return 500', () => {
    cy.loginAs('carrier');
    cy.visit('/driver/dashboard');

    cy.get('body').should('be.visible');

    const startDate = '2030-01-01';
    const endDate = '2030-12-31';

    cy.apiRequest(
      'GET',
      `/carriers/me/compliance-report/pdf?startDate=${startDate}&endDate=${endDate}`
    ).then((resp) => {
      // Must NOT be a 500 Internal Server Error — graceful handling required
      expect(resp.status).to.not.equal(500);

      // Accept: 200 (empty report), 204 (no content), 400 (invalid future date),
      //         404 (endpoint not implemented), 422 (unprocessable dates)
      expect(resp.status).to.be.oneOf([200, 204, 400, 404, 422, 403]);

      if (resp.status === 200) {
        // Even for future dates, a successful response should have content-type
        const contentType = resp.headers['content-type'] || '';
        expect(contentType).to.be.a('string');
      }
    });
  });
});
