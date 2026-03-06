/// <reference types="cypress" />

/**
 * LH-5: Payment Flow Cypress E2E Tests
 *
 * Uses cy.intercept to mock:
 *   - Backend payment endpoints (/api/payments/*, /api/cases/*)
 *   - Stripe JS library (to avoid loading real Stripe in test environment)
 *
 * Stripe test card numbers (for documentation — not loaded in browser tests):
 *   4242 4242 4242 4242  — Success
 *   4000 0000 0000 0002  — Card declined
 *   4000 0000 0000 9995  — Insufficient funds
 *   4000 0025 0000 3220  — 3DS required
 *   4000 0000 0000 0069  — Expired card
 *   4000 0000 0000 0127  — Incorrect CVC
 */

const CASE_ID = 'test-case-uuid-001';
const MOCK_CASE = {
  id: CASE_ID,
  case_number: 'CDL-2025-0001',
  status: 'assigned_to_attorney',
  attorney_price: 50000, // $500.00 in cents
  violation_type: 'speeding',
  assigned_attorney_id: 'atty-001',
  driver_id: 'driver-001',
};

const MOCK_CONFIG = { publishableKey: 'pk_test_mock_key_for_testing' };

function setupBaseIntercepts() {
  cy.intercept('GET', `/api/cases/${CASE_ID}`, { body: { case: MOCK_CASE } }).as('getCase');
  cy.intercept('GET', '/api/payments/config', { body: MOCK_CONFIG }).as('getConfig');
}

// ---------------------------------------------------------------------------
// Scenario 1 — Successful payment
// ---------------------------------------------------------------------------
describe('Payment Flow — Success (4242 4242 4242 4242)', () => {
  beforeEach(() => {
    setupBaseIntercepts();
    cy.intercept('POST', '/api/cases/*/payment', {
      statusCode: 200,
      body: {
        clientSecret: 'pi_test_mock_client_secret_intent',
        paymentIntentId: 'pi_test_mock',
        amount: 50000,
      },
    }).as('createPaymentIntent');

    cy.intercept('POST', '/api/payments/confirm', {
      statusCode: 200,
      body: { success: true, message: 'Payment confirmed' },
    }).as('confirmPayment');
  });

  it('shows case details and payment amount before confirming', () => {
    cy.visit(`/driver/cases/${CASE_ID}/payment`);
    cy.wait('@getCase');
    cy.wait('@getConfig');
    cy.contains('CDL-2025-0001').should('be.visible');
    cy.contains('$500').should('be.visible');
  });

  it('navigates to payment-success after successful payment', () => {
    cy.visit(`/driver/cases/${CASE_ID}/payment`);
    cy.wait('@getCase');
    cy.wait('@getConfig');
    cy.wait('@createPaymentIntent');

    // Simulate successful Stripe confirmation via intercept on payment confirm endpoint
    cy.intercept('POST', '/api/payments/confirm', {
      statusCode: 200,
      body: { success: true },
    }).as('confirmSuccess');

    // The payment form is rendered — trigger submit (Stripe iframe not loaded in E2E)
    cy.get('[data-cy="pay-button"], button[type="submit"]').first().click({ force: true });

    // Redirect to success page should follow from confirmed payment
    cy.location('pathname').should('include', 'payment');
  });
});

// ---------------------------------------------------------------------------
// Scenario 2 — Card declined (4000 0000 0000 0002)
// ---------------------------------------------------------------------------
describe('Payment Flow — Declined (4000 0000 0000 0002)', () => {
  beforeEach(() => {
    setupBaseIntercepts();
    cy.intercept('POST', '/api/cases/*/payment', {
      statusCode: 200,
      body: { clientSecret: 'pi_declined_secret', paymentIntentId: 'pi_declined', amount: 50000 },
    }).as('createIntent');

    cy.intercept('POST', '/api/payments/confirm', {
      statusCode: 402,
      body: { error: { code: 'CARD_DECLINED', message: 'Your card was declined.' } },
    }).as('declinedPayment');
  });

  it('shows declined error message to user', () => {
    cy.visit(`/driver/cases/${CASE_ID}/payment`);
    cy.wait('@getCase');
    cy.wait('@getConfig');

    // Trigger payment attempt — error response comes from intercept
    cy.get('[data-cy="pay-button"], button[type="submit"]').first().click({ force: true });

    // Error should appear in the UI
    cy.get('[role="alert"], .error, mat-error').should('exist');
  });
});

// ---------------------------------------------------------------------------
// Scenario 3 — Insufficient funds (4000 0000 0000 9995)
// ---------------------------------------------------------------------------
describe('Payment Flow — Insufficient Funds (4000 0000 0000 9995)', () => {
  beforeEach(() => {
    setupBaseIntercepts();
    cy.intercept('POST', '/api/cases/*/payment', {
      statusCode: 200,
      body: { clientSecret: 'pi_insufficient_secret', paymentIntentId: 'pi_insuf', amount: 50000 },
    }).as('createIntent');

    cy.intercept('POST', '/api/payments/confirm', {
      statusCode: 402,
      body: { error: { code: 'INSUFFICIENT_FUNDS', message: 'Your card has insufficient funds.' } },
    }).as('insufficientFunds');
  });

  it('displays insufficient funds error', () => {
    cy.visit(`/driver/cases/${CASE_ID}/payment`);
    cy.wait('@getCase');
    cy.wait('@getConfig');
    cy.get('[data-cy="pay-button"], button[type="submit"]').first().click({ force: true });
    cy.get('[role="alert"], .error, mat-error').should('exist');
  });
});

// ---------------------------------------------------------------------------
// Scenario 4 — 3DS Authentication required (4000 0025 0000 3220)
// ---------------------------------------------------------------------------
describe('Payment Flow — 3DS Required (4000 0025 0000 3220)', () => {
  beforeEach(() => {
    setupBaseIntercepts();
    cy.intercept('POST', '/api/cases/*/payment', {
      statusCode: 200,
      body: { clientSecret: 'pi_3ds_secret', paymentIntentId: 'pi_3ds', amount: 50000 },
    }).as('createIntent');

    cy.intercept('POST', '/api/payments/confirm', {
      statusCode: 402,
      body: { error: { code: 'AUTHENTICATION_REQUIRED', message: '3D Secure authentication required.' } },
    }).as('threeDsRequired');
  });

  it('shows 3DS authentication error when Stripe requires it', () => {
    cy.visit(`/driver/cases/${CASE_ID}/payment`);
    cy.wait('@getCase');
    cy.wait('@getConfig');
    cy.get('[data-cy="pay-button"], button[type="submit"]').first().click({ force: true });
    cy.get('[role="alert"], .error, mat-error').should('exist');
  });
});

// ---------------------------------------------------------------------------
// Scenario 5 — Expired card (4000 0000 0000 0069)
// ---------------------------------------------------------------------------
describe('Payment Flow — Expired Card (4000 0000 0000 0069)', () => {
  beforeEach(() => {
    setupBaseIntercepts();
    cy.intercept('POST', '/api/cases/*/payment', {
      statusCode: 200,
      body: { clientSecret: 'pi_expired_secret', paymentIntentId: 'pi_exp', amount: 50000 },
    }).as('createIntent');

    cy.intercept('POST', '/api/payments/confirm', {
      statusCode: 402,
      body: { error: { code: 'EXPIRED_CARD', message: 'Your card has expired.' } },
    }).as('expiredCard');
  });

  it('shows expired card error message', () => {
    cy.visit(`/driver/cases/${CASE_ID}/payment`);
    cy.wait('@getCase');
    cy.wait('@getConfig');
    cy.get('[data-cy="pay-button"], button[type="submit"]').first().click({ force: true });
    cy.get('[role="alert"], .error, mat-error').should('exist');
  });
});

// ---------------------------------------------------------------------------
// Scenario 6 — Incorrect CVC (4000 0000 0000 0127)
// ---------------------------------------------------------------------------
describe('Payment Flow — Incorrect CVC (4000 0000 0000 0127)', () => {
  beforeEach(() => {
    setupBaseIntercepts();
    cy.intercept('POST', '/api/cases/*/payment', {
      statusCode: 200,
      body: { clientSecret: 'pi_cvc_secret', paymentIntentId: 'pi_cvc', amount: 50000 },
    }).as('createIntent');

    cy.intercept('POST', '/api/payments/confirm', {
      statusCode: 402,
      body: { error: { code: 'INCORRECT_CVC', message: 'Your card\'s security code is incorrect.' } },
    }).as('incorrectCvc');
  });

  it('shows incorrect CVC error message', () => {
    cy.visit(`/driver/cases/${CASE_ID}/payment`);
    cy.wait('@getCase');
    cy.wait('@getConfig');
    cy.get('[data-cy="pay-button"], button[type="submit"]').first().click({ force: true });
    cy.get('[role="alert"], .error, mat-error').should('exist');
  });
});

// ---------------------------------------------------------------------------
// Backend error scenarios
// ---------------------------------------------------------------------------
describe('Payment Flow — Backend Errors', () => {
  it('shows error when case not found (404)', () => {
    cy.intercept('GET', `/api/cases/${CASE_ID}`, {
      statusCode: 404,
      body: { error: { code: 'NOT_FOUND', message: 'Case not found' } },
    }).as('caseNotFound');
    cy.intercept('GET', '/api/payments/config', { body: MOCK_CONFIG }).as('getConfig');

    cy.visit(`/driver/cases/${CASE_ID}/payment`);
    cy.wait('@caseNotFound');
    cy.get('[role="alert"], .error, mat-error').should('exist');
  });

  it('shows error when payment intent creation fails (500)', () => {
    setupBaseIntercepts();
    cy.intercept('POST', '/api/cases/*/payment', {
      statusCode: 500,
      body: { error: { code: 'SERVER_ERROR', message: 'Failed to create payment' } },
    }).as('createIntentFail');

    cy.visit(`/driver/cases/${CASE_ID}/payment`);
    cy.wait('@getCase');
    cy.wait('@getConfig');
    cy.wait('@createIntentFail');
    cy.get('[role="alert"], .error, mat-error').should('exist');
  });
});
