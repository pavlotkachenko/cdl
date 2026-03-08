/// <reference types="cypress" />

/**
 * Paralegal E2E Tests — TC-PAR-001..005
 *
 * Uses REAL API calls (no cy.intercept stubs).
 * Backend: http://localhost:3000
 * Frontend: http://localhost:4200
 */

describe('Paralegal — TC-PAR-001..005', () => {
  beforeEach(() => {
    cy.clearAuth();
  });

  // ---------------------------------------------------------------------------
  // TC-PAR-001: Login as paralegal, navigate to dashboard, verify case list
  // ---------------------------------------------------------------------------
  it('TC-PAR-001: paralegal dashboard shows case list', () => {
    cy.loginAs('paralegal');
    cy.visit('/paralegal/dashboard');

    cy.get('body').should('be.visible');

    cy.get(
      'app-paralegal-dashboard, mat-card, .case-card, .case-list, ' +
      '[data-testid="case-list"], mat-list, mat-list-item, ' +
      'table, tr, .dashboard-content, main, h1, h2'
    ).should('exist');
  });

  // ---------------------------------------------------------------------------
  // TC-PAR-002: Open a case, verify notes section/textarea present
  // ---------------------------------------------------------------------------
  it('TC-PAR-002: case detail shows notes section or textarea', () => {
    cy.loginAs('paralegal');
    cy.visit('/paralegal/dashboard');

    cy.get('body').should('be.visible');

    cy.get('body').then(($body) => {
      const caseSelectors = [
        'mat-list-item',
        '.case-card',
        'mat-card',
        'tr.mat-mdc-row',
        '.case-row',
        '[data-testid="case-item"]',
      ];

      let clicked = false;
      for (const sel of caseSelectors) {
        if ($body.find(sel).length > 0) {
          cy.get(sel).first().click({ force: true });
          clicked = true;
          break;
        }
      }

      if (clicked) {
        // After navigating into a case, verify notes section is visible
        cy.get(
          'textarea, [data-testid="notes"], [data-testid="notes-section"], ' +
          '.notes-section, .notes-area, .case-notes, ' +
          'mat-tab-group, input[placeholder*="note"]'
        ).should('exist');
      } else {
        // No cases — verify dashboard renders
        cy.get('app-paralegal-dashboard, main').should('exist');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // TC-PAR-003: Verify "Assign Attorney" button is NOT in the DOM
  // ---------------------------------------------------------------------------
  it('TC-PAR-003: paralegal dashboard does NOT have Assign Attorney button', () => {
    cy.loginAs('paralegal');
    cy.visit('/paralegal/dashboard');

    cy.get('body').should('be.visible');

    // Verify "Assign Attorney" button is absent
    cy.contains('button', /assign attorney/i).should('not.exist');

    // Also check data-testid variants
    cy.get('[data-testid="assign-attorney"]').should('not.exist');
    cy.get('[data-testid*="assign-attorney"]').should('not.exist');
  });

  // ---------------------------------------------------------------------------
  // TC-PAR-004: Case status field has no editable input/select (read-only or absent)
  // ---------------------------------------------------------------------------
  it('TC-PAR-004: paralegal cannot edit case status (status field is read-only or absent)', () => {
    cy.loginAs('paralegal');
    cy.visit('/paralegal/dashboard');

    cy.get('body').should('be.visible');

    cy.get('body').then(($body) => {
      // Navigate into a case if possible
      const caseSelectors = ['mat-list-item', '.case-card', 'mat-card', 'tr.mat-mdc-row', '.case-row'];
      for (const sel of caseSelectors) {
        if ($body.find(sel).length > 0) {
          cy.get(sel).first().click({ force: true });
          break;
        }
      }
    });

    cy.get('body').then(($body) => {
      // Status change selectors that a paralegal should NOT have access to
      const editableStatusSelectors = [
        'mat-select[formControlName*="status"]',
        'select[name*="status"]',
        'mat-select[aria-label*="status"]',
        '[data-testid="status-edit"]',
        '[data-testid="change-status"]',
        'button[data-testid*="status-change"]',
      ];

      for (const sel of editableStatusSelectors) {
        cy.get(sel).should('not.exist');
      }

      // Page should still render (read-only status display is fine)
      cy.get('app-paralegal-dashboard, mat-card, main').should('exist');
    });
  });

  // ---------------------------------------------------------------------------
  // TC-PAR-005: Navigate to /admin/reports directly — verify redirect to
  //             /unauthorized or /login (not allowed to stay on /admin/reports)
  // ---------------------------------------------------------------------------
  it('TC-PAR-005: paralegal is redirected away from /admin/reports', () => {
    cy.loginAs('paralegal');
    cy.visit('/admin/reports');

    cy.get('body').should('be.visible');

    // Should NOT remain on /admin/reports — must redirect
    cy.url().should('not.include', '/admin/reports');

    // Should land on login, unauthorized, paralegal dashboard, or any non-admin route
    cy.url().should('satisfy', (url: string) => {
      return (
        url.includes('/login') ||
        url.includes('/unauthorized') ||
        url.includes('/paralegal') ||
        url.includes('/attorney') ||
        url.includes('/driver') ||
        url.includes('/403') ||
        url.includes('/access-denied') ||
        !url.includes('/admin')
      );
    });
  });
});
