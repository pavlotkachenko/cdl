/// <reference types="cypress" />

describe('Carrier Registration', () => {
  const STRONG_PASSWORD = 'Test@1234Secure';

  beforeEach(() => {
    cy.clearAuth();
    cy.visit('/register');
  });

  // -------------------------------------------------------------------
  // Happy-path: register a carrier via API and verify login
  // The current UI register form defaults to driver role.
  // Carriers register through the API with role: 'carrier'.
  // -------------------------------------------------------------------
  it('should register a carrier via API and allow login', () => {
    const uniqueEmail = `carrier+${Date.now()}@e2etest.com`;

    // Register a carrier via the API
    cy.registerViaApi({
      name: 'E2E Test Carrier LLC',
      email: uniqueEmail,
      password: STRONG_PASSWORD,
      phone: '+13105551234',
      role: 'carrier',
    }).then((resp) => {
      expect(resp.status).to.equal(201);
      expect(resp.body.user).to.have.property('role', 'carrier');
      expect(resp.body.user).to.have.property('name', 'E2E Test Carrier LLC');
      expect(resp.body).to.have.property('token');
    });

    // Now log in as the carrier through the UI
    cy.clearAuth();
    cy.visit('/login');

    cy.fillLoginForm(uniqueEmail, STRONG_PASSWORD);

    cy.intercept('POST', '**/api/auth/signin').as('loginRequest');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest').then((interception) => {
      expect(interception.response!.statusCode).to.equal(200);
      expect(interception.response!.body.user).to.have.property('role', 'carrier');
      expect(interception.response!.body.user).to.have.property('name', 'E2E Test Carrier LLC');
    });

    // Carrier is redirected to driver dashboard (carriers share the driver layout)
    cy.url().should('include', '/driver/dashboard');

    // Verify auth state in localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.a('string').and.not.be.empty;
      const storedUser = JSON.parse(win.localStorage.getItem('currentUser')!);
      expect(storedUser.role).to.equal('carrier');
      expect(storedUser.email).to.equal(uniqueEmail.toLowerCase());
    });
  });

  // -------------------------------------------------------------------
  // Carrier: duplicate email prevention
  // -------------------------------------------------------------------
  it('should prevent carrier registration with an existing email', () => {
    const uniqueEmail = `carrier.dup+${Date.now()}@e2etest.com`;

    // Register the first carrier
    cy.registerViaApi({
      name: 'First Carrier',
      email: uniqueEmail,
      password: STRONG_PASSWORD,
      role: 'carrier',
    }).then((resp) => {
      expect(resp.status).to.equal(201);
    });

    // Try to register a second carrier with the same email
    cy.registerViaApi({
      name: 'Duplicate Carrier',
      email: uniqueEmail,
      password: STRONG_PASSWORD,
      role: 'carrier',
    }).then((resp) => {
      expect(resp.status).to.equal(409);
      expect(resp.body).to.have.property('error', 'Email already exists');
    });
  });

  // -------------------------------------------------------------------
  // Carrier: cross-table duplicate prevention (driver email used for carrier)
  // -------------------------------------------------------------------
  it('should prevent carrier registration if email is already used by a driver', () => {
    const uniqueEmail = `cross.dup+${Date.now()}@e2etest.com`;

    // Register as a driver first
    cy.registerViaApi({
      name: 'Cross-Table Driver',
      email: uniqueEmail,
      password: STRONG_PASSWORD,
      role: 'driver',
    }).then((resp) => {
      expect(resp.status).to.equal(201);
    });

    // Try to register as a carrier with the same email
    cy.registerViaApi({
      name: 'Cross-Table Carrier',
      email: uniqueEmail,
      password: STRONG_PASSWORD,
      role: 'carrier',
    }).then((resp) => {
      expect(resp.status).to.equal(409);
      expect(resp.body).to.have.property('error', 'Email already exists');
    });
  });

  // -------------------------------------------------------------------
  // Carrier login: verify correct role-specific fields returned
  // -------------------------------------------------------------------
  it('should return carrier-specific fields on login', () => {
    const uniqueEmail = `carrier.fields+${Date.now()}@e2etest.com`;

    cy.registerViaApi({
      name: 'Fields Test Carrier',
      email: uniqueEmail,
      password: STRONG_PASSWORD,
      phone: '+14155559876',
      role: 'carrier',
    }).then((resp) => {
      expect(resp.status).to.equal(201);
    });

    // Login via API and check the response shape
    const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3000';
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/auth/signin`,
      body: { email: uniqueEmail, password: STRONG_PASSWORD },
    }).then((resp) => {
      expect(resp.status).to.equal(200);
      expect(resp.body.user).to.include({
        role: 'carrier',
        name: 'Fields Test Carrier',
      });
      expect(resp.body.user).to.have.property('phone');
    });
  });
});
