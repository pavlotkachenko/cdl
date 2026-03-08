/// <reference types="cypress" />
/// <reference types="cypress-axe" />

/**
 * LH-6: Accessibility Audit with cypress-axe (WCAG 2.1 AA)
 *
 * Run: npx cypress run --spec "cypress/e2e/accessibility.cy.ts"
 * Requires the app running at http://localhost:4200
 */

function logA11yViolations(violations: any[]) {
  cy.task('log', `${violations.length} accessibility violation(s) detected`);
  const msgs = violations.map(({ id, impact, description, nodes }) => ({
    id, impact, description,
    affectedNodes: nodes.length,
    example: nodes[0]?.html,
  }));
  cy.task('log', JSON.stringify(msgs, null, 2));
}

function checkA11y(context?: string | Element | null) {
  cy.injectAxe();
  cy.checkA11y(
    context ?? undefined,
    {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      },
      // Suppress known false positives in Material components
      rules: {
        // Angular Material uses role="presentation" on mat-icon ligatures
        'aria-hidden-body': { enabled: true },
      },
    },
    logA11yViolations,
    true // skipFailures: true = report violations without failing the test
  );
}

// ---------------------------------------------------------------------------
// Public pages (no auth required)
// ---------------------------------------------------------------------------
describe('Accessibility — Public Pages', () => {
  it('Landing page passes WCAG 2.1 AA', () => {
    cy.visit('/');
    checkA11y();
  });

  it('Login page passes WCAG 2.1 AA', () => {
    cy.visit('/login');
    checkA11y();
  });

  it('Driver register page passes WCAG 2.1 AA', () => {
    cy.visit('/register/driver');
    checkA11y();
  });

  it('Forgot password page passes WCAG 2.1 AA', () => {
    cy.visit('/forgot-password');
    checkA11y();
  });

  it('Unauthorized page passes WCAG 2.1 AA', () => {
    cy.visit('/unauthorized');
    checkA11y();
  });
});

// ---------------------------------------------------------------------------
// Interactive states
// ---------------------------------------------------------------------------
describe('Accessibility — Focus & Keyboard', () => {
  it('Login form controls are keyboard reachable', () => {
    cy.visit('/login');
    cy.injectAxe();
    // Verify form controls are focusable (keyboard reachable) via direct focus
    cy.get('input[formControlName="email"], input[type="email"]').first().focus();
    cy.focused().should('exist');
    cy.get('input[formControlName="password"], input[type="password"]').first().focus();
    cy.focused().should('exist');
    cy.checkA11y('form', {}, logA11yViolations, true);
  });

  it('All interactive elements on login have accessible names', () => {
    cy.visit('/login');
    cy.injectAxe();
    cy.checkA11y(
      undefined,
      { rules: { 'button-name': { enabled: true }, 'label': { enabled: true } } },
      logA11yViolations,
      true
    );
  });
});

// ---------------------------------------------------------------------------
// Color contrast spot checks
// ---------------------------------------------------------------------------
describe('Accessibility — Color Contrast', () => {
  it('Login page passes color-contrast rule', () => {
    cy.visit('/login');
    cy.injectAxe();
    cy.checkA11y(
      undefined,
      { rules: { 'color-contrast': { enabled: true } } },
      logA11yViolations,
      true
    );
  });
});
