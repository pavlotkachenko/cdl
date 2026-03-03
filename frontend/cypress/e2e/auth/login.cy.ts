/// <reference types="cypress" />

describe('Login', () => {
  const STRONG_PASSWORD = 'Test@1234Secure';

  beforeEach(() => {
    cy.clearAuth();
    cy.visit('/login');
  });

  // -------------------------------------------------------------------
  // Happy-path: driver login
  // -------------------------------------------------------------------
  it('should log in a driver and redirect to the driver dashboard', () => {
    const uniqueEmail = `login.driver+${Date.now()}@e2etest.com`;

    // Seed a driver
    cy.registerViaApi({
      name: 'Login Driver',
      email: uniqueEmail,
      password: STRONG_PASSWORD,
    }).then((resp) => {
      expect(resp.status).to.equal(201);
    });

    cy.clearAuth();
    cy.visit('/login');

    cy.fillLoginForm(uniqueEmail, STRONG_PASSWORD);

    cy.intercept('POST', '**/api/auth/signin').as('loginRequest');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest').then((interception) => {
      expect(interception.response!.statusCode).to.equal(200);
      expect(interception.response!.body).to.have.property('token');
      expect(interception.response!.body.user.role).to.equal('driver');
    });

    cy.url().should('include', '/driver/dashboard');

    // Verify localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.not.be.null;
      const user = JSON.parse(win.localStorage.getItem('currentUser')!);
      expect(user.email).to.equal(uniqueEmail.toLowerCase());
    });
  });

  // -------------------------------------------------------------------
  // Happy-path: carrier login
  // -------------------------------------------------------------------
  it('should log in a carrier and redirect to the driver dashboard', () => {
    const uniqueEmail = `login.carrier+${Date.now()}@e2etest.com`;

    // Seed a carrier
    cy.registerViaApi({
      name: 'Login Carrier Inc',
      email: uniqueEmail,
      password: STRONG_PASSWORD,
      role: 'carrier',
    }).then((resp) => {
      expect(resp.status).to.equal(201);
    });

    cy.clearAuth();
    cy.visit('/login');

    cy.fillLoginForm(uniqueEmail, STRONG_PASSWORD);

    cy.intercept('POST', '**/api/auth/signin').as('loginRequest');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest').then((interception) => {
      expect(interception.response!.statusCode).to.equal(200);
      expect(interception.response!.body.user.role).to.equal('carrier');
    });

    cy.url().should('include', '/driver/dashboard');
  });

  // -------------------------------------------------------------------
  // Incorrect password
  // -------------------------------------------------------------------
  it('should show error on invalid password', () => {
    const uniqueEmail = `login.wrong+${Date.now()}@e2etest.com`;

    // Seed a driver
    cy.registerViaApi({
      name: 'Wrong Pass Driver',
      email: uniqueEmail,
      password: STRONG_PASSWORD,
    }).then((resp) => {
      expect(resp.status).to.equal(201);
    });

    cy.clearAuth();
    cy.visit('/login');

    cy.intercept('POST', '**/api/auth/signin').as('loginRequest');
    cy.fillLoginForm(uniqueEmail, 'WrongPassword@123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest').its('response.statusCode').should('eq', 401);

    // Wait for Angular to process the error response and update the DOM
    cy.get('.error-alert, .mat-mdc-snack-bar-container', { timeout: 10000 })
      .should('be.visible');

    // Should stay on login page
    cy.url().should('include', '/login');
  });

  // -------------------------------------------------------------------
  // Non-existent email
  // -------------------------------------------------------------------
  it('should show error for non-existent email', () => {
    cy.intercept('POST', '**/api/auth/signin').as('loginRequest');

    cy.fillLoginForm('nonexistent@nowhere.com', STRONG_PASSWORD);
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest').its('response.statusCode').should('eq', 401);

    // Wait for Angular to process the error response and update the DOM
    cy.get('.error-alert, .mat-mdc-snack-bar-container', { timeout: 10000 })
      .should('be.visible');

    // Should stay on login page
    cy.url().should('include', '/login');
  });

  // -------------------------------------------------------------------
  // Validation: empty form
  // -------------------------------------------------------------------
  it('should disable submit button when form is empty', () => {
    cy.get('button[type="submit"]').should('be.disabled');
  });

  // -------------------------------------------------------------------
  // Validation: invalid email format
  // -------------------------------------------------------------------
  it('should show validation error for invalid email format', () => {
    cy.getFormControl('email').type('not-an-email');
    // Move focus to password to trigger email validation
    cy.getFormControl('password').focus();

    // Submit button should be disabled (email invalid)
    cy.get('button[type="submit"]').should('be.disabled');
  });

  // -------------------------------------------------------------------
  // Validation: password too short
  // -------------------------------------------------------------------
  it('should keep submit disabled when password is too short', () => {
    cy.getFormControl('email').type('valid@email.com');
    cy.getFormControl('password').type('abc');
    // Move focus away from password to trigger validation
    cy.getFormControl('email').focus();

    cy.get('button[type="submit"]').should('be.disabled');
  });

  // -------------------------------------------------------------------
  // Navigation: link to register page
  // -------------------------------------------------------------------
  it('should navigate to register page via "Sign up" link', () => {
    cy.get('a[routerLink="/register"]').click();
    cy.url().should('include', '/register');
  });

  // -------------------------------------------------------------------
  // Navigation: link to forgot password page
  // -------------------------------------------------------------------
  it('should navigate to forgot password page', () => {
    cy.get('a[routerLink="/forgot-password"]').click();
    cy.url().should('include', '/forgot-password');
  });

  // -------------------------------------------------------------------
  // Auth state: token persists and user stays logged in
  // -------------------------------------------------------------------
  it('should persist login state across page reload', () => {
    const uniqueEmail = `login.persist+${Date.now()}@e2etest.com`;

    cy.registerViaApi({
      name: 'Persist Driver',
      email: uniqueEmail,
      password: STRONG_PASSWORD,
    }).then((resp) => {
      expect(resp.status).to.equal(201);
    });

    cy.clearAuth();
    cy.visit('/login');

    cy.intercept('POST', '**/api/auth/signin').as('loginRequest');
    cy.fillLoginForm(uniqueEmail, STRONG_PASSWORD);
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    cy.url().should('include', '/driver/dashboard');

    // Reload the page — token should still be in localStorage
    cy.reload();
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.not.be.null;
      expect(win.localStorage.getItem('currentUser')).to.not.be.null;
    });
  });
});
