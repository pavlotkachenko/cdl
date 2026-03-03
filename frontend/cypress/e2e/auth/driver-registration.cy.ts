/// <reference types="cypress" />

describe('Driver Registration', () => {
  const STRONG_PASSWORD = 'Test@1234Secure';

  beforeEach(() => {
    cy.clearAuth();
    cy.visit('/register');
  });

  // -------------------------------------------------------------------
  // Happy-path: full registration + auto-login redirect
  // -------------------------------------------------------------------
  it('should register a new driver and redirect to the driver dashboard', () => {
    const uniqueEmail = `driver+${Date.now()}@e2etest.com`;

    cy.fillRegistrationForm({
      name: 'E2E Test Driver',
      email: uniqueEmail,
      phone: '+12025559999',
      cdlNumber: 'CDL-E2E-001',
      password: STRONG_PASSWORD,
      confirmPassword: STRONG_PASSWORD,
    });

    // Intercept the register API call
    cy.intercept('POST', '**/api/auth/register').as('registerRequest');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Wait for the API call and verify it succeeds
    cy.wait('@registerRequest').then((interception) => {
      expect(interception.response!.statusCode).to.equal(201);
      expect(interception.response!.body).to.have.property('token');
      expect(interception.response!.body.user).to.have.property('role', 'driver');
      expect(interception.response!.body.user).to.have.property('email', uniqueEmail.toLowerCase());
    });

    // Should redirect to driver dashboard after registration
    cy.url().should('include', '/driver/dashboard');

    // Auth token should be stored in localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.a('string').and.not.be.empty;
      const storedUser = JSON.parse(win.localStorage.getItem('currentUser')!);
      expect(storedUser.role).to.equal('driver');
      expect(storedUser.name).to.equal('E2E Test Driver');
    });
  });

  // -------------------------------------------------------------------
  // Post-registration login: register then logout then login again
  // -------------------------------------------------------------------
  it('should allow a newly registered driver to log in with their credentials', () => {
    const uniqueEmail = `driver+${Date.now()}@e2etest.com`;

    // Step 1: Register via the API to get a known user
    cy.registerViaApi({
      name: 'Login Test Driver',
      email: uniqueEmail,
      password: STRONG_PASSWORD,
    }).then((resp) => {
      expect(resp.status).to.equal(201);
    });

    // Step 2: Go to the login page and sign in
    cy.clearAuth();
    cy.visit('/login');

    cy.fillLoginForm(uniqueEmail, STRONG_PASSWORD);

    cy.intercept('POST', '**/api/auth/signin').as('loginRequest');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest').then((interception) => {
      expect(interception.response!.statusCode).to.equal(200);
      expect(interception.response!.body.user).to.have.property('role', 'driver');
    });

    // Should redirect to driver dashboard
    cy.url().should('include', '/driver/dashboard');

    // Verify auth state
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.a('string').and.not.be.empty;
      const storedUser = JSON.parse(win.localStorage.getItem('currentUser')!);
      expect(storedUser.email).to.equal(uniqueEmail.toLowerCase());
      expect(storedUser.role).to.equal('driver');
    });
  });

  // -------------------------------------------------------------------
  // Validation: empty form submission
  // -------------------------------------------------------------------
  it('should show validation errors when submitting an empty form', () => {
    // The submit button should be disabled when the form is invalid
    cy.get('button[type="submit"]').should('be.disabled');
  });

  // -------------------------------------------------------------------
  // Validation: weak password
  // -------------------------------------------------------------------
  it('should show password strength indicator and reject weak passwords', () => {
    cy.getFormControl('password').type('abc');

    // Password strength should show "Weak"
    cy.get('.password-strength').should('be.visible');
    cy.get('.password-strength').should('contain.text', 'Weak');

    // Submit button should still be disabled (form invalid)
    cy.get('button[type="submit"]').should('be.disabled');
  });

  // -------------------------------------------------------------------
  // Validation: mismatched passwords
  // -------------------------------------------------------------------
  it('should show error when passwords do not match', () => {
    cy.fillRegistrationForm({
      password: STRONG_PASSWORD,
      confirmPassword: 'DifferentPassword@1',
    });

    // Trigger validation by focusing another field (blur won't work if element lost focus)
    cy.getFormControl('name').focus();

    // Submit should be disabled due to mismatch
    cy.get('button[type="submit"]').should('be.disabled');
  });

  // -------------------------------------------------------------------
  // Duplicate email
  // -------------------------------------------------------------------
  it('should show error when registering with an existing email', () => {
    const uniqueEmail = `dup+${Date.now()}@e2etest.com`;

    // Register the first user via API
    cy.registerViaApi({
      name: 'First Driver',
      email: uniqueEmail,
      password: STRONG_PASSWORD,
    }).then((resp) => {
      expect(resp.status).to.equal(201);
    });

    // Try to register again with the same email via UI
    cy.fillRegistrationForm({
      name: 'Duplicate Driver',
      email: uniqueEmail,
      password: STRONG_PASSWORD,
      confirmPassword: STRONG_PASSWORD,
    });

    cy.intercept('POST', '**/api/auth/register').as('dupRegister');
    cy.get('button[type="submit"]').click();

    cy.wait('@dupRegister').its('response.statusCode').should('eq', 409);

    // Error message should be visible (in .error-alert or snackbar)
    cy.get('.error-alert, .mat-mdc-snack-bar-container', { timeout: 10000 }).should('be.visible');
    cy.contains('Email already exists').should('be.visible');
  });

  // -------------------------------------------------------------------
  // Navigation: link to login page
  // -------------------------------------------------------------------
  it('should navigate to login page via "Sign in" link', () => {
    cy.get('a[routerLink="/login"]').click();
    cy.url().should('include', '/login');
  });
});
