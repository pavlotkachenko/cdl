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
  }
}

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

const DEFAULT_PASSWORD = 'Test@1234Secure';

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

Cypress.Commands.add('getFormControl', (name: string) => {
  return cy.get(`input[formControlName="${name}"]`);
});

Cypress.Commands.add('clearAuth', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('token');
    win.localStorage.removeItem('refreshToken');
    win.localStorage.removeItem('currentUser');
  });
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
