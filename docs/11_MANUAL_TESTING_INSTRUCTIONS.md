# Manual Testing Instructions

> **Purpose:** Step-by-step guide for QA testers and developers to manually verify CDL Ticket Management features end-to-end across all user roles.
>
> For the full scenario catalogue (all 77 TCs with steps and expected results) see [10_MANUAL_E2E_TEST_SCENARIOS.md](./10_MANUAL_E2E_TEST_SCENARIOS.md).

---

## Table of Contents

1. [Environment Setup](#1-environment-setup)
2. [Test Accounts](#2-test-accounts)
3. [Running the Application Locally](#3-running-the-application-locally)
4. [Test Execution Order](#4-test-execution-order)
5. [Role-by-Role Checklists](#5-role-by-role-checklists)
   - [Auth & Onboarding](#51-auth--onboarding)
   - [Driver](#52-driver)
   - [Carrier](#53-carrier)
   - [Attorney](#54-attorney)
   - [Admin](#55-admin)
   - [Operator](#56-operator)
   - [Paralegal](#57-paralegal)
6. [Non-Functional Checks](#6-non-functional-checks)
   - [Real-time Notifications](#61-real-time-notifications)
   - [PWA](#62-pwa)
   - [Internationalisation](#63-internationalisation)
   - [PDF Export](#64-pdf-export)
7. [Known Test-Environment Limitations](#7-known-test-environment-limitations)
8. [Reporting Defects](#8-reporting-defects)

---

## 1. Environment Setup

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 20 | Backend & Frontend |
| npm | ≥ 10 | Package management |
| PostgreSQL | ≥ 15 | Database |
| Redis | ≥ 7 | Session / queue |
| Browser | Chrome 120+ | Primary test browser |

### Environment Variables

Copy the template and fill in real values:

```bash
cd cdl-ticket-management/backend
cp .env.example .env
```

Key variables required for testing:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/cdl_dev
JWT_SECRET=<any-long-random-string>
STRIPE_SECRET_KEY=sk_test_...          # Stripe test mode key
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG....                # Or leave blank for local email skip
OPENAI_API_KEY=sk-...                  # For OCR feature
```

---

## 2. Test Accounts

The following accounts must exist in the test database before running manual tests. Seed them once with:

```bash
cd backend
npm run seed:test-accounts
```

> If a seed script is not available, register each account manually via the registration page or API.

| Role | Email | Password |
|------|-------|----------|
| Driver | `driver@test.com` | `Test1234!` |
| Carrier | `carrier@test.com` | `Test1234!` |
| Attorney | `attorney@test.com` | `Test1234!` |
| Admin | `admin@test.com` | `Test1234!` |
| Operator | `operator@test.com` | `Test1234!` |
| Paralegal | `paralegal@test.com` | `Test1234!` |

### Stripe Test Cards

Use these card numbers in the Stripe payment form (any future expiry, any CVC):

| Scenario | Card Number |
|----------|-------------|
| Payment succeeds | `4242 4242 4242 4242` |
| Payment declined | `4000 0000 0000 0002` |
| Requires 3DS auth | `4000 0025 0000 3155` |

---

## 3. Running the Application Locally

### Start the Backend

```bash
cd cdl-ticket-management/backend
npm install
npm run dev          # starts on http://localhost:3000
```

### Start the Frontend

```bash
cd cdl-ticket-management/frontend
npm install
npx ng serve         # starts on http://localhost:4200
```

### Verify Both Are Running

```bash
curl -s http://localhost:3000/api/health | jq .
# Expected: { "status": "ok" }

curl -s http://localhost:4200 -o /dev/null -w "%{http_code}"
# Expected: 200
```

---

## 4. Test Execution Order

Execute tests in the following order to avoid data dependency issues:

```
1. Auth & Onboarding   — creates user accounts used by all other tests
2. Driver              — creates cases used by Attorney / Operator tests
3. Carrier             — independent; creates webhooks / bulk drivers
4. Attorney            — requires cases from Driver tests
5. Operator            — requires cases from Driver tests
6. Admin               — reviews/manages data created by all roles
7. Paralegal           — read-only; run last to avoid interference
8. Real-time           — trigger events and verify notifications
9. PWA / i18n / PDF   — can run any time; stateless
```

---

## 5. Role-by-Role Checklists

Mark each item **Pass ✅**, **Fail ❌**, or **Skip ⏭** (with reason).

---

### 5.1 Auth & Onboarding

Open an **incognito window** for each sub-section.

#### Registration (TC-AUTH-001, TC-AUTH-002)

| # | Action | Expected |
|---|--------|----------|
| 1 | Navigate to `/register` | Registration form displayed |
| 2 | Fill all fields with valid data, check Terms checkbox, click **Register** | Redirected to driver dashboard; token in `localStorage` |
| 3 | Try registering with the same email again | Error: "Email already in use" |
| 4 | Leave email blank, click **Register** | Submit button disabled / email validation error |

#### Login & Security (TC-AUTH-003..010)

| # | Action | Expected |
|---|--------|----------|
| 1 | Enter correct credentials for `driver@test.com` → **Sign In** | Redirected to `/driver/dashboard` |
| 2 | Enter wrong password 5 times for a valid account | After 5th attempt: 429 response + "Account locked" or "Too many attempts" message |
| 3 | Navigate to `/forgot-password`, enter valid email, submit | Confirmation message shown ("Check your email…") |
| 4 | Repeat forgot-password with a **non-existent** email | Same confirmation message (no enumeration) |
| 5 | Log in as driver, open DevTools → Application → Local Storage, replace `token` with `expired.jwt.string`, navigate to `/driver/dashboard` | Redirect to `/login` |
| 6 | Log in as driver, navigate to `/admin/dashboard` | Redirect to `/unauthorized` or `/login` |

---

### 5.2 Driver

Log in as `driver@test.com`.

#### Ticket Submission (TC-DRV-001..004)

| # | Action | Expected |
|---|--------|----------|
| 1 | Go to **Submit Ticket**, attach a clear CDL ticket photo (JPG/PNG) | OCR spinner appears; at least one form field pre-populated |
| 2 | Attach a 1×1 pixel white image | OCR confidence warning shown; fields empty or amber |
| 3 | Attach a file larger than 10 MB | Client-side error before upload starts |
| 4 | Attach a `.docx` or `.csv` file | "Only JPG, PNG, PDF, HEIC allowed" error |
| 5 | Fill all required fields, click **Submit** | Redirected to case detail; case status = **New** |

#### Case Management (TC-DRV-005..006)

| # | Action | Expected |
|---|--------|----------|
| 1 | Go to **My Tickets** | List shows at least the case just created with a status badge |
| 2 | Click the case → **Select Attorney** | 3 attorneys listed with a **RECOMMENDED** badge |
| 3 | Click RECOMMENDED attorney | Case status changes to **Attorney Assigned** |

#### Payments (TC-DRV-007..009)

| # | Action | Expected |
|---|--------|----------|
| 1 | Open an assigned case → **Pay in Full** | Stripe payment form appears |
| 2 | Enter `4242 4242 4242 4242`, any future expiry, any CVC → **Pay** | "Payment successful" screen; case status updates |
| 3 | Repeat with **Payment Plan** option selected | Weekly instalment amount shown; plan created |
| 4 | Enter declined card `4000 0000 0000 0002` | "Card declined" error message |

#### Messaging (TC-DRV-010)

| # | Action | Expected |
|---|--------|----------|
| 1 | Go to **Messages**, open a conversation | Message thread visible |
| 2 | Type a message, click **Send** | Message appears in thread immediately |

#### Miscellaneous (TC-DRV-011..015, TC-PDF-001)

| # | Action | Expected |
|---|--------|----------|
| 1 | Open a closed case → rating prompt appears → select 4 stars → **Submit** | "Thank you" confirmation |
| 2 | Go to **Settings → Security** → enable biometric | Confirmation message; `webauthn_enrolled=true` in localStorage |
| 3 | Go to **Settings → Notifications** → toggle SMS off, set quiet hours → **Save** | Settings persist after page reload |
| 4 | Open a closed case with an invoice → click **Download PDF** | PDF downloads to device |
| 5 | Manually enter `/driver/cases/<id-of-another-driver>` in the address bar | 403 error state rendered |

---

### 5.3 Carrier

Log in as `carrier@test.com`.

#### Dashboard & Onboarding (TC-CAR-001..002)

| # | Action | Expected |
|---|--------|----------|
| 1 | Clear `carrier_tour_completed` from localStorage, refresh `/carrier/dashboard` | Onboarding tour overlay visible; clicking through steps dismisses it |
| 2 | View dashboard | CSA score tile, active tickets count, and risk badge all rendered |

#### Driver Management (TC-CAR-003..006)

| # | Action | Expected |
|---|--------|----------|
| 1 | Go to **Drivers → Add Driver**, fill name + CDL, submit | Driver appears in list |
| 2 | Submit without CDL | Validation error shown |
| 3 | Go to **Bulk Import**, attach `drivers.csv` (5 valid rows) | Success summary: 5 imported |
| 4 | Import CSV with 2 invalid rows (missing CDL) | Summary: 3 imported, 2 errors listed |

#### Compliance & Analytics (TC-CAR-007..008)

| # | Action | Expected |
|---|--------|----------|
| 1 | Go to **Compliance Report**, set date range, click **Download PDF** | PDF downloads; no error |
| 2 | Go to **Analytics** | Charts/graphs rendered with data |

#### Webhooks (TC-CAR-009..012)

| # | Action | Expected |
|---|--------|----------|
| 1 | Go to **Webhooks → Add**, enter URL + select events, **Save** | Webhook appears in list; secret shown once |
| 2 | Toggle the webhook **Active** switch OFF | Switch is now OFF; `GET /api/webhooks` returns `active: false` |
| 3 | Click **Delete** on the webhook, confirm | Webhook no longer in list |

#### Internationalisation (TC-CAR-014..015)

| # | Action | Expected |
|---|--------|----------|
| 1 | Click 🇫🇷 FR button | Key UI labels switch to French; setting persists on reload |
| 2 | Click 🇺🇸 EN button | Labels revert to English |

---

### 5.4 Attorney

Log in as `attorney@test.com`.

| # | Action | Expected |
|---|--------|----------|
| 1 | Go to attorney dashboard | Pending case queue shown |
| 2 | Click first pending case → **Accept** | Case moves to Active tab |
| 3 | Return to pending list, click another case → **Decline** | Case removed from pending list |
| 4 | Open accepted case → change status to **Court Scheduled** → add a note → **Save** | Activity log entry appears |
| 5 | Open conversation → type message → **Send** | Message appears in thread |
| 6 | Go to **Profile → Ratings** | Star average and review count displayed |
| 7 | Without a subscription, navigate to case management | Redirect to `/attorney/subscription` |
| 8 | On subscription page, click **Subscribe** | Redirect to Stripe checkout URL |
| 9 | Navigate to `/attorney/cases/<another-attorney-case-id>` | 403 error state or redirect |

---

### 5.5 Admin

Log in as `admin@test.com`.

| # | Action | Expected |
|---|--------|----------|
| 1 | Go to `/admin/dashboard` | KPI tiles visible (total cases, revenue, etc.) |
| 2 | Go to **Cases**, apply filter **In Progress** | Only in-progress cases listed |
| 3 | Open an unassigned case → **Assign Attorney** → select from dropdown → **Save** | Assignment shown in case detail |
| 4 | Go to **User Management → Invite**, enter email + role **Operator** → **Send** | "Invitation sent" message |
| 5 | Find a user in list → **Change Role → Paralegal** | Role updated in table |
| 6 | Click **Suspend** on a test user | Status shows **Suspended** |
| 7 | Click **Unsuspend** on the same user | Status shows **Active** |
| 8 | Try to suspend your own admin account | Error: "Cannot suspend your own account" |
| 9 | Open a case → **Assign Operator** → select operator → **Save** | Operator name shown in case detail |
| 10 | Go to **Reports → Revenue** | Revenue chart/table rendered |

---

### 5.6 Operator

Log in as `operator@test.com`.

| # | Action | Expected |
|---|--------|----------|
| 1 | Go to operator dashboard | Case cards with priority indicators shown |
| 2 | Click **Auto-Assign** on a case | Case moves out of queue; "Assigned" confirmation shown |
| 3 | On a pending case, click **Choose Attorney** → view ranked list → pick 2nd attorney → **Confirm** | Case assigned to selected attorney |
| 4 | In a state with no available attorneys, click **Auto-Assign** | "No attorneys available" message |
| 5 | Go to **Batch OCR** → attach 3 ticket images → **Process** | Per-file extraction results shown |
| 6 | Open a conversation → click **Templates** → select a template | Message text pre-filled in compose box |
| 7 | Open attorney assignment dropdown | Suspended attorneys do NOT appear in list |

---

### 5.7 Paralegal

Log in as `paralegal@test.com`.

| # | Action | Expected |
|---|--------|----------|
| 1 | Go to paralegal dashboard | Case list visible |
| 2 | Open a case → type a note → **Save** | Note appears in activity log |
| 3 | Verify for any case | **Assign Attorney** button is absent from the DOM |
| 4 | Verify for any case | Status field has no editable input or select |
| 5 | Navigate directly to `/admin/reports` | Redirect to `/unauthorized` |

---

## 6. Non-Functional Checks

### 6.1 Real-time Notifications (TC-RT-001..005)

> Use two browser windows simultaneously: one as driver, one as admin/operator.

| # | Action | Expected |
|---|--------|----------|
| 1 | Operator updates case status in window B | Driver window A shows new notification badge |
| 2 | Attorney sends message in window B | Driver window A shows message in thread without reload |
| 3 | Navigate to driver Notifications | All new notifications listed |
| 4 | Set quiet hours via preferences to cover current time | In-app notification still appears; SMS not dispatched |
| 5 | Click **Mark All Read** | All notifications marked read; badge clears |

### 6.2 PWA (TC-PWA-001..003)

| # | Action | Expected |
|---|--------|----------|
| 1 | Open DevTools → Application → Manifest | Manifest loaded; `display: standalone` |
| 2 | Open DevTools → Application → Service Workers | Service worker registered and active |
| 3 | In DevTools Network tab, enable **Offline** mode | App shows offline indicator; cached content still visible |

### 6.3 Internationalisation (TC-I18N-001..004)

| # | Action | Expected |
|---|--------|----------|
| 1 | Clear `localStorage`, reload any page | UI in English (default) |
| 2 | Click 🇫🇷 FR | Labels switch to French; reload preserves language |
| 3 | Click 🇪🇸 ES | Labels switch to Spanish; reload preserves language |
| 4 | Log out and back in | Language preference preserved |

### 6.4 PDF Export (TC-PDF-001..003)

| # | Action | Expected |
|---|--------|----------|
| 1 | Driver: open closed case → **Download PDF** | Invoice PDF downloads; filename contains case number |
| 2 | Carrier: download compliance report for a date range with cases | PDF downloads; contains case rows |
| 3 | Carrier: download compliance report for a future date range (no cases) | PDF downloads (empty); no 500 error |

---

## 7. Known Test-Environment Limitations

| Feature | Limitation |
|---------|------------|
| **WebAuthn biometric** | Hardware key/fingerprint/FaceID prompts cannot be tested on local machines without a physical device or security key. Verify the **Enable Biometrics** button is visible in Settings. |
| **Push notifications** | Browser push requires HTTPS and user permission. Test the in-app notification badge; native push may not fire on `localhost`. |
| **SMS delivery** | SMS provider (Twilio) disabled on staging by default. Verify SMS toggles in UI only. |
| **Email delivery** | Sendgrid may be disabled on local. Check backend logs for `[email mock]` entries instead of inbox. |
| **Stripe 3DS cards** | 3D Secure cards open a redirect in Stripe's hosted iframe; test manually with `4000 0025 0000 3155`. |
| **OCR accuracy** | OCR results depend on image quality. Use a clear CDL ticket photo; low-quality images may return empty fields. |

---

## 8. Reporting Defects

When a test fails, capture:

1. **TC ID** (e.g., `TC-DRV-003`)
2. **Steps to reproduce** — exact user actions
3. **Expected vs. Actual result**
4. **Screenshot or screen recording**
5. **Browser console errors** (DevTools → Console)
6. **Network request/response** (DevTools → Network → relevant request)
7. **Environment** (OS, browser version, backend log snippet)

File the defect in the project issue tracker with label `bug` and severity (`P0` critical / `P1` high / `P2` medium / `P3` low).

---

*Document version: 1.0 — generated 2026-03-06*
