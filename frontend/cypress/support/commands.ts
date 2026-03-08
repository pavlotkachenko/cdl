/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Fill in the registration form and submit.
     * Accepts partial overrides — defaults are a valid driver registration.
     */
    fillRegistrationForm(overrides?: Partial<RegistrationFormData>): Chainable<void>;

    /**
     * Fill in the login form and submit.
     */
    fillLoginForm(email: string, password: string): Chainable<void>;

    /**
     * Get a Material form field input by its formControlName attribute.
     */
    getFormControl(name: string): Chainable<JQuery<HTMLInputElement>>;

    /**
     * Register a user via the API directly (bypasses the UI).
     */
    registerViaApi(data: ApiRegisterData): Chainable<Cypress.Response<any>>;

    /**
     * Clear all auth state from localStorage.
     */
    clearAuth(): Chainable<void>;

    /**
     * Log in via the real API and write tokens to localStorage.
     */
    loginViaApi(email: string, password: string): Chainable<void>;

    /**
     * Log in as a fixed staging account for the given role.
     * Roles: driver | carrier | attorney | admin | operator | paralegal
     */
    loginAs(role: StagingRole): Chainable<void>;

    /**
     * Make an authenticated API request using the token stored in localStorage.
     */
    apiRequest(method: string, path: string, body?: object): Chainable<Cypress.Response<any>>;

    /**
     * Create a case via the API and return the case object.
     */
    createCase(fields?: Partial<CreateCaseData>): Chainable<Cypress.Response<any>>;

    /**
     * Create a webhook via the API and return the webhook record.
     */
    createWebhook(url: string, events: string[]): Chainable<Cypress.Response<any>>;

    /**
     * Read the JWT token from localStorage.
     */
    getToken(): Chainable<string>;
  }
}

type StagingRole = 'driver' | 'carrier' | 'attorney' | 'admin' | 'operator' | 'paralegal';

interface RegistrationFormData {
  name: string;
  email: string;
  phone: string;
  cdlNumber: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface ApiRegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'driver' | 'carrier';
}

interface CreateCaseData {
  customer_name: string;
  customer_type: string;
  state: string;
  violation_type: string;
  violation_date: string;
  violation_details: string;
}

const DEFAULT_PASSWORD = 'Test@1234Secure';

const STAGING_CREDENTIALS: Record<StagingRole, string> = {
  driver: 'driver@test.com',
  carrier: 'carrier@test.com',
  attorney: 'attorney@test.com',
  admin: 'admin@test.com',
  operator: 'operator@test.com',
  paralegal: 'paralegal@test.com',
};

const STAGING_PASSWORD = 'Test1234!';

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

Cypress.Commands.add('getFormControl', (name: string) => {
  return cy.get(`input[formControlName="${name}"]`);
});

Cypress.Commands.add('clearAuth', () => {
  // Clear any cached Cypress sessions so the next loginAs() re-establishes auth
  cy.clearAllSessionStorage();
  cy.clearLocalStorage();
  cy.clearCookies();
});

Cypress.Commands.add('fillRegistrationForm', (overrides: Partial<RegistrationFormData> = {}) => {
  const data: RegistrationFormData = {
    name: 'Test Driver',
    email: `test.driver+${Date.now()}@example.com`,
    phone: '+12025551234',
    cdlNumber: 'CDL123456',
    password: DEFAULT_PASSWORD,
    confirmPassword: DEFAULT_PASSWORD,
    acceptTerms: true,
    ...overrides,
  };

  cy.getFormControl('name').clear().type(data.name);
  cy.getFormControl('email').clear().type(data.email);

  if (data.phone) {
    cy.getFormControl('phone').clear().type(data.phone);
  }
  if (data.cdlNumber) {
    cy.getFormControl('cdlNumber').clear().type(data.cdlNumber);
  }

  cy.getFormControl('password').clear().type(data.password);
  cy.getFormControl('confirmPassword').clear().type(data.confirmPassword);

  if (data.acceptTerms) {
    // Angular Material checkbox: force-check the underlying input
    cy.get('mat-checkbox[formControlName="acceptTerms"] input[type="checkbox"]').check({ force: true });
  }
});

Cypress.Commands.add('fillLoginForm', (email: string, password: string) => {
  cy.getFormControl('email').clear().type(email);
  cy.getFormControl('password').clear().type(password);
});

Cypress.Commands.add('registerViaApi', (data: ApiRegisterData) => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3000';
  return cy.request({
    method: 'POST',
    url: `${apiUrl}/api/auth/register`,
    body: data,
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('loginViaApi', (email: string, password: string) => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3000';
  // Retry up to 3 times with a wait on 429 (rate-limited) responses
  const attemptLogin = (attemptsLeft: number): void => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/auth/signin`,
      body: { email, password },
      failOnStatusCode: false,
    }).then((resp) => {
      if (resp.status === 429 && attemptsLeft > 0) {
        cy.log(`loginViaApi(${email}): rate limited (429), waiting 10s before retry (${attemptsLeft} attempts left)`);
        cy.wait(10000);
        attemptLogin(attemptsLeft - 1);
        return;
      }
      expect(resp.status, `loginViaApi(${email}) should succeed`).to.equal(200);
      cy.window().then((win) => {
        win.localStorage.setItem('token', resp.body.token);
        if (resp.body.refreshToken) {
          win.localStorage.setItem('refreshToken', resp.body.refreshToken);
        }
        win.localStorage.setItem('currentUser', JSON.stringify(resp.body.user));
      });
    });
  };
  attemptLogin(3);
});

Cypress.Commands.add('loginAs', (role: StagingRole) => {
  const email = STAGING_CREDENTIALS[role];
  // cy.session() handles localStorage origin correctly: it captures the
  // storage state after setup and restores it before each test that needs it.
  cy.session(
    `role-${role}`,
    () => {
      // Visit the app root first to establish the correct storage origin
      cy.visit('/');
      cy.loginViaApi(email, STAGING_PASSWORD);
    },
    {
      validate() {
        // Confirm the token is still present (re-login if expired/cleared)
        cy.window()
          .its('localStorage')
          .invoke('getItem', 'token')
          .should('exist');
      },
      cacheAcrossSpecs: false,
    }
  );
});

Cypress.Commands.add('getToken', () => {
  return cy.window().then((win) => win.localStorage.getItem('token') as string);
});

Cypress.Commands.add('apiRequest', (method: string, path: string, body?: object) => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3000';
  return cy.getToken().then((token) => {
    return cy.request({
      method,
      url: `${apiUrl}/api${path}`,
      body,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    });
  });
});

Cypress.Commands.add('createCase', (fields: Partial<CreateCaseData> = {}) => {
  const defaults: CreateCaseData = {
    customer_name: 'Test Driver',
    customer_type: 'subscriber_driver',
    state: 'TX',
    violation_type: 'speeding',
    violation_date: new Date().toISOString(),
    violation_details: 'Automated test case',
  };
  return cy.apiRequest('POST', '/cases', { ...defaults, ...fields });
});

Cypress.Commands.add('createWebhook', (url: string, events: string[]) => {
  return cy.apiRequest('POST', '/webhooks', { url, events });
});
