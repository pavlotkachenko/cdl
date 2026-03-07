# Manual E2E Test Scenarios — CDL Ticket Management

**Purpose:** End-to-end test scenarios for manual QA across all user roles.
**Environment:** Staging (`https://staging.cdl-ticket.com`) with test data seeded.
**Prerequisites:** Each role section lists the test account credentials and required seed data.

---

## Test Accounts (Staging)

| Role | Email | Password |
|------|-------|----------|
| Driver | `driver@test.com` | `Test1234!` |
| Carrier | `carrier@test.com` | `Test1234!` |
| Attorney | `attorney@test.com` | `Test1234!` |
| Admin | `admin@test.com` | `Test1234!` |
| Operator | `operator@test.com` | `Test1234!` |
| Paralegal | `paralegal@test.com` | `Test1234!` |

---

## TC-AUTH — Authentication Flows

### TC-AUTH-001 — Successful login (all roles)
**Precondition:** Active account for each role.
**Steps:**
1. Navigate to `/login`
2. Enter email and password for role under test
3. Click **Sign In**

**Expected:** Redirected to role-specific dashboard — `/driver/dashboard`, `/carrier/dashboard`, `/attorney/dashboard`, `/admin/dashboard`, `/operator/dashboard`, `/paralegal/dashboard`.

---

### TC-AUTH-002 — Login with wrong password
**Steps:**
1. Navigate to `/login`
2. Enter valid email, wrong password
3. Click **Sign In**

**Expected:** Error message "Invalid credentials" displayed. No navigation. Account not locked.

---

### TC-AUTH-003 — Brute-force lockout (5 wrong attempts)
**Steps:**
1. Enter correct email, wrong password 5 times in a row

**Expected:** After 5th attempt, response is 429. Message "Too many attempts, please try again later." displayed.

---

### TC-AUTH-004 — Forgot password flow
**Steps:**
1. Navigate to `/login`, click **Forgot Password**
2. Enter `driver@test.com`
3. Click **Send Reset Link**
4. Open email inbox, click the reset link
5. Enter new password (`NewPass9!`) and confirm
6. Submit form
7. Log in with new password

**Expected:**
- Step 3: "Check your email" confirmation shown regardless of whether email exists (no account enumeration)
- Step 6: "Password updated" confirmation
- Step 7: Login succeeds, redirected to dashboard

---

### TC-AUTH-005 — Forgot password with non-existent email
**Steps:**
1. Click **Forgot Password**, enter `nobody@fake.com`
2. Submit

**Expected:** Same "Check your email" message shown — no hint whether email is registered.

---

### TC-AUTH-006 — Biometric login (WebAuthn)
**Precondition:** Driver has enrolled biometric via Settings → Biometric Login.
**Steps:**
1. Navigate to `/login`
2. Observe **Sign in with biometrics** button (only visible when enrolled)
3. Click the button
4. Complete device biometric prompt (Touch ID / Face ID)

**Expected:** JWT stored, redirected to `/driver/dashboard`.

---

### TC-AUTH-007 — Biometric login on un-enrolled device
**Steps:**
1. Log in on a new browser / incognito window
2. Observe that **Sign in with biometrics** button is absent

**Expected:** Button absent. Only email/password form visible.

---

### TC-AUTH-008 — JWT expiry mid-session
**Precondition:** Use a JWT manipulation tool or wait for token expiry in staging (set to 15 min).
**Steps:**
1. Log in
2. Expire the access token (or wait)
3. Perform any authenticated action

**Expected:** Automatic token refresh attempted invisibly. If refresh token also expired, redirected to `/login` with `returnUrl` preserved in query params.

---

### TC-AUTH-009 — Role-based route guard
**Steps:**
1. Log in as **Driver**
2. Manually navigate to `/admin/dashboard` in the URL bar

**Expected:** Redirected to `/unauthorized` page.

---

### TC-AUTH-010 — Suspended account login
**Precondition:** Admin suspends `driver@test.com` account.
**Steps:**
1. Attempt to log in with that account

**Expected:** "Account suspended, contact support" message. No JWT issued.

---

## TC-DRIVER — Driver Flows

### TC-DRV-001 — Submit a new ticket via OCR
**Precondition:** Logged in as Driver.
**Steps:**
1. Click **Submit Ticket** or **New Ticket** from dashboard
2. On the upload screen, upload `test-ticket.jpg` (included in staging test assets)
3. Wait for OCR processing (spinner)
4. Review the pre-filled form: violation type, fine amount, court date, state
5. Correct any wrong field if present
6. Click **Submit**

**Expected:**
- OCR fills most fields automatically within 5 seconds
- Fields with confidence < 70% are highlighted in amber with a manual-entry prompt
- After submit: case created, redirected to case detail page showing status **Submitted**

---

### TC-DRV-002 — Submit ticket with unreadable image
**Steps:**
1. Upload a completely black image or a photo of a wall
2. Wait for OCR

**Expected:** All fields remain empty or show confidence warnings. Form stays open for manual entry. No auto-submit. Can still submit manually.

---

### TC-DRV-003 — Submit ticket — oversized file
**Steps:**
1. Attempt to upload a file > 10 MB

**Expected:** "File too large, max 10 MB" error shown. File rejected before upload.

---

### TC-DRV-004 — Submit ticket — wrong file type
**Steps:**
1. Attempt to upload a `.docx` file

**Expected:** "Only JPG, PNG, PDF, HEIC allowed" error shown.

---

### TC-DRV-005 — View case list and details
**Steps:**
1. Navigate to **My Tickets**
2. Click any case in the list

**Expected:**
- List shows all driver cases with status badges (color-coded)
- Detail page shows: ticket image, violation info, assigned attorney (if any), payment status, activity timeline

---

### TC-DRV-006 — Select attorney
**Precondition:** Case exists with status **Submitted** and 3 attorneys recommended.
**Steps:**
1. Open the case detail
2. Navigate to the attorney selection step
3. Review the 3 recommended attorneys (name, rating, win rate, price)
4. Select the one marked **RECOMMENDED**
5. Confirm selection

**Expected:** Case status changes to **Attorney Assigned**. Driver notified via push/SMS.

---

### TC-DRV-007 — Pay now (full payment)
**Precondition:** Attorney assigned, payment required.
**Steps:**
1. Open case → click **Pay Now**
2. Select **Pay in Full** option
3. Enter test card: `4242 4242 4242 4242`, exp `12/30`, CVC `123`
4. Submit payment

**Expected:** Payment confirmed, case progresses, receipt SMS/email sent. Payment visible in Payment History.

---

### TC-DRV-008 — Payment plan
**Steps:**
1. Open case → click **Pay Now**
2. Select a payment plan (e.g., 4 weeks)
3. Review weekly amount and total
4. Enter test card and submit

**Expected:** Payment plan created. First installment charged. Future charges scheduled. Case shows plan details.

---

### TC-DRV-009 — Payment with declined card
**Steps:**
1. On payment screen, enter declined test card: `4000 0000 0000 0002`
2. Submit

**Expected:** "Card declined, try another card" message. No payment created. Form stays open.

---

### TC-DRV-010 — Message assigned attorney
**Precondition:** Attorney assigned to case.
**Steps:**
1. Navigate to **Messages**
2. Open the conversation with the assigned attorney
3. Type a message and send

**Expected:** Message appears in thread immediately. Attorney receives a push notification.

---

### TC-DRV-011 — Rate attorney after case closed
**Precondition:** Case has status **Closed**.
**Steps:**
1. Open closed case or receive rating prompt notification
2. Select 4 stars
3. (Optional) add a comment
4. Submit rating

**Expected:** Rating submitted. Attorney average rating updated. Rating prompt disappears.

---

### TC-DRV-012 — Biometric setup
**Steps:**
1. Navigate to **Settings → Biometric Login**
2. Click **Enable Biometric Login**
3. Complete the device biometric prompt
4. Observe confirmation message

**Expected:** "Biometric login enabled" confirmation. `webauthn_enrolled` stored. **Sign in with biometrics** button appears on next login page load.

---

### TC-DRV-013 — Notification preferences (quiet hours)
**Steps:**
1. Navigate to **Settings → Notifications**
2. Toggle SMS off for "Marketing"
3. Set quiet hours to 10pm – 9am
4. Save

**Expected:** Preferences saved. SMS not sent for marketing during quiet hours. In-app notifications still appear.

---

### TC-DRV-014 — Download invoice PDF
**Precondition:** Case closed and invoice generated.
**Steps:**
1. Open the closed case
2. Click **Download PDF** in the invoice section

**Expected:** PDF downloads with filename `invoice-<INV#>.pdf`. PDF contains invoice number, driver name, attorney name, amount.

---

### TC-DRV-015 — Access another driver's case (negative)
**Steps:**
1. Log in as Driver A
2. Obtain the case ID of Driver B (e.g., from staging URL)
3. Navigate directly to `/driver/cases/<driver-B-case-id>`

**Expected:** 403 Forbidden response. Error page shown. Case data not exposed.

---

## TC-CARRIER — Carrier (Fleet Manager) Flows

### TC-CAR-001 — Carrier onboarding
**Precondition:** New carrier account, not yet onboarded.
**Steps:**
1. Log in as Carrier
2. Observe the onboarding tour overlay (step 1 of N)
3. Complete each tour step using **Next**
4. On final step, click **Done**

**Expected:** Tour completes. Overlay dismissed. Marked complete in localStorage (tour does not reappear on next login).

---

### TC-CAR-002 — View fleet dashboard
**Steps:**
1. Log in as Carrier
2. Observe dashboard

**Expected:** Shows CSA Risk Score (numeric, color-coded), Active Tickets count, Resolved This Month count, high-risk drivers list.

---

### TC-CAR-003 — Add a single driver
**Steps:**
1. Navigate to **Drivers**
2. Click **Add Driver**
3. Enter name: `Test Driver`, CDL: `CDL-999999`
4. Submit

**Expected:** Driver appears in fleet list with status **Pending**.

---

### TC-CAR-004 — Add driver — missing CDL number (negative)
**Steps:**
1. Click **Add Driver**, enter name only, leave CDL blank
2. Submit

**Expected:** Validation error: "CDL number is required." Driver not created.

---

### TC-CAR-005 — Bulk import drivers via CSV
**Steps:**
1. Navigate to **Bulk Import**
2. Download the CSV template
3. Fill in 5 driver rows (name, CDL, email)
4. Upload the CSV
5. Click **Import**

**Expected:** All 5 drivers imported. Success summary shown (5 added, 0 errors).

---

### TC-CAR-006 — Bulk import — invalid CSV rows (negative)
**Steps:**
1. Upload a CSV with 3 valid rows and 2 rows missing CDL
2. Import

**Expected:** 3 drivers created. Error report shows 2 rows failed with "CDL number required". Partial import succeeds.

---

### TC-CAR-007 — Download compliance report PDF
**Steps:**
1. Navigate to **Compliance Report**
2. Set date range (e.g., last 90 days)
3. Click **Download PDF**

**Expected:** PDF downloads (`compliance-<date>.pdf`). Contains: case list with driver, CDL, violation, state, status, attorney, date. Header shows date range and USDOT.

---

### TC-CAR-008 — View analytics
**Steps:**
1. Navigate to **Analytics**
2. Observe charts

**Expected:** 6-month trend chart, violation type breakdown, year-over-year comparison visible and populated with data.

---

### TC-CAR-009 — Create outbound webhook
**Steps:**
1. Navigate to **Webhooks**
2. Click **Add Webhook**
3. Enter URL: `https://webhook.site/<your-id>` (use webhook.site for testing)
4. Select events: `case.created`, `case.status_changed`
5. Click **Save**

**Expected:** Webhook appears in list with active toggle ON. Secret shown once (copy it).

---

### TC-CAR-010 — Webhook delivery verification
**Precondition:** TC-CAR-009 completed; a driver submits a new ticket for this carrier's fleet.
**Steps:**
1. Have a driver submit a ticket
2. Check webhook.site (or your endpoint) for the incoming POST

**Expected:** POST received within 5 seconds. Body contains event `case.created` and case data. `X-CDL-Signature` header present. Verify signature with the secret using HMAC-SHA256.

---

### TC-CAR-011 — Toggle webhook inactive
**Steps:**
1. On the Webhooks page, click the active toggle for an existing webhook

**Expected:** Toggle turns off. No further events delivered to that URL.

---

### TC-CAR-012 — Delete webhook
**Steps:**
1. Click **Delete** on a webhook entry

**Expected:** Webhook removed from list. No further events delivered.

---

### TC-CAR-013 — Access another carrier's data (negative)
**Steps:**
1. Log in as Carrier A
2. Navigate to `/carrier/dashboard` (your own)
3. Modify the request headers to include Carrier B's JWT (or manually craft request)

**Expected:** Supabase RLS blocks access. Only Carrier A's data returned.

---

### TC-CAR-014 — Language switcher — switch to French
**Steps:**
1. Log in as Carrier
2. Locate the language switcher (header or sidebar)
3. Click **🇫🇷 FR**

**Expected:** All visible UI strings switch to French. Language preference persisted (reloading keeps French).

---

### TC-CAR-015 — Language switcher — switch back to English
**Steps:**
1. With FR active, click **🇺🇸 EN**

**Expected:** UI reverts to English.

---

## TC-ATT — Attorney Flows

### TC-ATT-001 — View case queue
**Precondition:** Logged in as Attorney with active subscription.
**Steps:**
1. Navigate to Attorney Dashboard
2. View **Pending** tab

**Expected:** List of cases waiting for acceptance, each showing: case type, violation, driver location, court date, offered price.

---

### TC-ATT-002 — Accept a case
**Steps:**
1. Click on a pending case to review details
2. Click **Accept**

**Expected:** Case moves from Pending to Active. Driver notified "Attorney [Name] has accepted your case." Case appears in attorney's Active tab.

---

### TC-ATT-003 — Decline a case
**Steps:**
1. Click on a pending case
2. Click **Decline**
3. (Optional) enter a reason

**Expected:** Case returned to the queue for re-assignment. Attorney's pending list updates. Driver auto-notified.

---

### TC-ATT-004 — Update case status
**Steps:**
1. Open an accepted case
2. Change status from **In Progress** → **Court Scheduled**
3. Add a note: "Hearing on March 15 at 9am"
4. Save

**Expected:** Status updated. Note appears in case activity timeline. Driver notified via SMS/push.

---

### TC-ATT-005 — Message driver
**Steps:**
1. Open an active case
2. Navigate to the Messages tab
3. Type "I've reviewed your ticket and will represent you at the hearing." and send

**Expected:** Message sent. Driver receives push notification. Message visible in driver's Messages screen.

---

### TC-ATT-006 — View ratings
**Steps:**
1. Navigate to profile or ratings section
2. Observe rating summary

**Expected:** Average star rating, number of reviews, and individual feedback comments displayed.

---

### TC-ATT-007 — Attorney without subscription (negative)
**Precondition:** Use an attorney account with no active subscription (`attorney-nosub@test.com`).
**Steps:**
1. Log in
2. Observe dashboard or attempt to accept a case

**Expected:** Redirected to `/attorney/subscription`. Cannot accept cases without active subscription.

---

### TC-ATT-008 — Subscription checkout
**Steps:**
1. From `/attorney/subscription`, click **Subscribe**
2. Choose a plan
3. Complete Stripe checkout with test card `4242 4242 4242 4242`

**Expected:** Subscription activated. Redirected back to dashboard. Cases are now accessible.

---

### TC-ATT-009 — Access another attorney's case (negative)
**Steps:**
1. Log in as Attorney A
2. Navigate to a case URL belonging to Attorney B

**Expected:** 403 Forbidden. Case data not exposed.

---

### TC-ATT-010 — Rate limit on case operations
**Steps:**
1. Script rapid Accept/Decline calls (or click very rapidly) — 60+ per minute

**Expected:** After limit hit, 429 response returned. "Too many requests, slow down" message shown.

---

## TC-ADMIN — Admin Flows

### TC-ADM-001 — View admin dashboard
**Precondition:** Logged in as Admin.
**Steps:**
1. Navigate to `/admin/dashboard`

**Expected:** KPI tiles: total users, active cases, total revenue, fees collected. Recent activity log visible.

---

### TC-ADM-002 — View all cases
**Steps:**
1. Navigate to **Cases**
2. Filter by status: **In Progress**
3. Filter by violation type: **Speeding**

**Expected:** Case list filtered correctly. Each entry shows driver, carrier, attorney, status, court date.

---

### TC-ADM-003 — Manually assign attorney to case
**Steps:**
1. Open a case that has no attorney assigned
2. Click **Assign Attorney**
3. Select an attorney from the list
4. Save

**Expected:** Case assigned. Attorney notified. Activity log shows "Manually assigned by Admin."

---

### TC-ADM-004 — Invite new staff member
**Steps:**
1. Navigate to **User Management**
2. Click **Invite User**
3. Enter email `newstaff@test.com`, role **Operator**
4. Send invite

**Expected:** Invitation email sent (check staging email). New user appears in list with status **Pending**.

---

### TC-ADM-005 — Change user role
**Steps:**
1. Find a user in **User Management**
2. Click **Change Role**
3. Change from **Operator** to **Paralegal**
4. Confirm

**Expected:** Role updated. User's access changes on next page load.

---

### TC-ADM-006 — Suspend user
**Steps:**
1. Find `driver@test.com` in **User Management**
2. Click **Suspend**
3. Confirm suspension

**Expected:** User status changes to **Suspended**. User can no longer log in (TC-AUTH-010 verifies this).

---

### TC-ADM-007 — Unsuspend user
**Steps:**
1. Find suspended user
2. Click **Unsuspend**

**Expected:** Status returns to **Active**. User can log in again.

---

### TC-ADM-008 — Admin attempts to suspend own account (negative)
**Steps:**
1. Log in as Admin
2. Find own account in User Management
3. Click **Suspend**

**Expected:** Action blocked. Error: "You cannot suspend your own account."

---

### TC-ADM-009 — Assign operator to case
**Steps:**
1. Open a case in the case management view
2. Click **Assign Operator**
3. Select an active operator
4. Save

**Expected:** Case assigned to operator. Operator's queue updates. Activity log records the assignment.

---

### TC-ADM-010 — Access revenue reports
**Steps:**
1. Navigate to **Reports → Revenue**
2. Select date range: last 30 days

**Expected:** Revenue breakdown by attorney, by carrier, total platform fees collected visible.

---

## TC-OPR — Operator (Case Manager) Flows

### TC-OPR-001 — View case queue
**Precondition:** Logged in as Operator.
**Steps:**
1. Navigate to Operator Dashboard

**Expected:** Queue of new unassigned cases. Each card shows: ticket type, driver location, court date, fine amount. Priority color-coded.

---

### TC-OPR-002 — Auto-assign attorney
**Steps:**
1. Click on a case in the queue
2. Click **Auto-Assign**

**Expected:** System selects the highest-ranked attorney (by win rate, then response time, then price). Case assigned. Attorney notified. Case removed from queue.

---

### TC-OPR-003 — Manual attorney assignment
**Steps:**
1. On a case, click **Choose Attorney**
2. View the ranked list of available attorneys
3. Select a specific attorney
4. Confirm

**Expected:** Case assigned to chosen attorney. Activity log shows manual assignment.

---

### TC-OPR-004 — No attorneys available (negative)
**Precondition:** All attorneys have no availability (staged environment with availability set to 0).
**Steps:**
1. Open a case, click **Auto-Assign**

**Expected:** "No attorneys available at this time. Case queued for later assignment." message. Case status unchanged.

---

### TC-OPR-005 — Process batch OCR tickets
**Steps:**
1. Navigate to **Batch OCR** (if available in operator tools)
2. Upload 3 ticket images
3. Click **Process All**

**Expected:** Each ticket analyzed. Extracted data shown per ticket. Errors/warnings flagged per image.

---

### TC-OPR-006 — Use message template
**Steps:**
1. Open a case conversation with a driver
2. Click **Templates**
3. Select "Court Date Reminder" template
4. Customize date/time in the template
5. Send

**Expected:** Pre-filled message sent. Driver receives notification.

---

### TC-OPR-007 — Attempt to assign to suspended attorney (negative)
**Precondition:** An attorney account is suspended.
**Steps:**
1. Open a case, click **Choose Attorney**
2. Find the suspended attorney in the list (should be filtered out or marked unavailable)

**Expected:** Suspended attorney either absent from list OR shown as unavailable/greyed out. Cannot select them.

---

## TC-PAR — Paralegal Flows

### TC-PAR-001 — View assigned cases
**Precondition:** Logged in as Paralegal.
**Steps:**
1. Navigate to Paralegal Dashboard

**Expected:** List of cases assigned for review. Can see: case details, documents, activity timeline.

---

### TC-PAR-002 — Add a case note
**Steps:**
1. Open a case
2. Add note: "Documents incomplete — awaiting court notice"
3. Save

**Expected:** Note appears in activity timeline with timestamp.

---

### TC-PAR-003 — Attempt to assign attorney (negative)
**Steps:**
1. Open a case
2. Look for **Assign Attorney** button

**Expected:** Button absent. No attorney assignment option available. API call returns 403 if attempted directly.

---

### TC-PAR-004 — Attempt to update case status (negative)
**Steps:**
1. Open a case
2. Look for status dropdown

**Expected:** Status is read-only. No dropdown or edit option available for Paralegal role.

---

### TC-PAR-005 — Access admin reports (negative)
**Steps:**
1. Navigate manually to `/admin/reports`

**Expected:** Redirected to `/unauthorized` page.

---

## TC-REALTIME — Real-Time & Notifications

### TC-RT-001 — New message push notification
**Precondition:** Driver and attorney both logged in (different browsers/devices).
**Steps:**
1. Attorney sends a message to driver
2. Observe driver's browser

**Expected:** Push notification appears within 3 seconds. Notification bell in header shows badge. Clicking opens the message thread.

---

### TC-RT-002 — Typing indicator
**Steps:**
1. Driver and attorney both in the same conversation
2. Driver starts typing (but does not send)

**Expected:** Attorney sees "Driver is typing…" indicator. Indicator disappears within 3 seconds of stopping.

---

### TC-RT-003 — Case status update notification
**Steps:**
1. Operator or attorney updates a case status
2. Check driver's notification feed

**Expected:** In-app notification appears. SMS sent to driver's phone (if SMS preferences enabled).

---

### TC-RT-004 — Quiet hours — no SMS
**Precondition:** Driver has quiet hours set to 10pm–9am.
**Steps:**
1. At 11pm staging time, trigger a case status update

**Expected:** In-app notification created. SMS NOT sent. SMS queued and delivered after 9am.

---

### TC-RT-005 — Mark all notifications read
**Steps:**
1. Open Notifications page with several unread items
2. Click **Mark All Read**

**Expected:** All badges cleared. All notifications show as read (no bold/unread styling).

---

## TC-PWA — PWA / Offline

### TC-PWA-001 — Install PWA
**Steps:**
1. Open the app in Chrome on mobile
2. Accept the "Add to Home Screen" prompt (or use browser menu)

**Expected:** App icon added to home screen. Opens in standalone mode (no browser chrome).

---

### TC-PWA-002 — Offline handling
**Steps:**
1. Log in successfully
2. Disconnect network (Airplane mode)
3. Navigate to a previously visited page

**Expected:** Offline page shown with friendly message. Previously cached content may still be visible.

---

### TC-PWA-003 — Service worker cache
**Steps:**
1. Load app with network
2. Disconnect network
3. Refresh the page

**Expected:** Shell UI (Angular) loads from service worker cache. API data shows stale data or offline state (depending on cache strategy).

---

## TC-I18N — Internationalisation

### TC-I18N-001 — English (default)
**Steps:**
1. Load the app fresh (no saved language preference)

**Expected:** All UI strings in English.

---

### TC-I18N-002 — Switch to Spanish
**Steps:**
1. Click language switcher → **ES**

**Expected:** All UI strings switch to Spanish. Preference saved (survives page reload).

---

### TC-I18N-003 — Switch to French
**Steps:**
1. Click language switcher → **🇫🇷 FR**

**Expected:** All UI strings switch to French. Preference saved.

---

### TC-I18N-004 — Persist language across sessions
**Steps:**
1. Select French
2. Log out and log back in

**Expected:** Language remains French after re-login.

---

## TC-PDF — PDF Export

### TC-PDF-001 — Driver invoice PDF (client-side)
**Steps:**
1. Log in as Driver, open a closed case
2. Locate the Invoice section
3. Click **Download PDF**

**Expected:** File `invoice-INV-CDL-XXX.pdf` downloads. PDF contains: invoice number, case number, issued date, attorney name, amount. Company header "CDL Ticket Management — Invoice" at top.

---

### TC-PDF-002 — Carrier compliance report PDF (server-side)
**Steps:**
1. Log in as Carrier
2. Navigate to **Compliance Report**
3. Set date range and click **Download PDF**

**Expected:** File `compliance-<date>.pdf` downloads. PDF contains: landscape A4, table with Case #, Driver, CDL, Violation, State, Status, Date, Attorney. Footer with page numbers and generated timestamp.

---

### TC-PDF-003 — Compliance report — no data in range (negative)
**Steps:**
1. Set date range to far future (no cases)
2. Download PDF

**Expected:** PDF downloads but contains "No cases in this period" message (or empty table with headers). Does not error.

---

## Summary Checklist

Use this checklist to track test execution:

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| TC-AUTH-001 | Successful login (all roles) | | |
| TC-AUTH-002 | Login with wrong password | | |
| TC-AUTH-003 | Brute-force lockout | | |
| TC-AUTH-004 | Forgot password flow | | |
| TC-AUTH-005 | Forgot password — non-existent email | | |
| TC-AUTH-006 | Biometric login | | |
| TC-AUTH-007 | Biometric on un-enrolled device | | |
| TC-AUTH-008 | JWT expiry mid-session | | |
| TC-AUTH-009 | Role-based route guard | | |
| TC-AUTH-010 | Suspended account login | | |
| TC-DRV-001 | Submit ticket via OCR | | |
| TC-DRV-002 | Submit ticket — unreadable image | | |
| TC-DRV-003 | Submit ticket — oversized file | | |
| TC-DRV-004 | Submit ticket — wrong file type | | |
| TC-DRV-005 | View case list and details | | |
| TC-DRV-006 | Select attorney | | |
| TC-DRV-007 | Pay now (full payment) | | |
| TC-DRV-008 | Payment plan | | |
| TC-DRV-009 | Payment with declined card | | |
| TC-DRV-010 | Message assigned attorney | | |
| TC-DRV-011 | Rate attorney after case closed | | |
| TC-DRV-012 | Biometric setup | | |
| TC-DRV-013 | Notification preferences / quiet hours | | |
| TC-DRV-014 | Download invoice PDF | | |
| TC-DRV-015 | Access another driver's case | | |
| TC-CAR-001 | Carrier onboarding tour | | |
| TC-CAR-002 | View fleet dashboard | | |
| TC-CAR-003 | Add single driver | | |
| TC-CAR-004 | Add driver — missing CDL (negative) | | |
| TC-CAR-005 | Bulk import drivers | | |
| TC-CAR-006 | Bulk import — invalid rows (negative) | | |
| TC-CAR-007 | Download compliance report PDF | | |
| TC-CAR-008 | View analytics | | |
| TC-CAR-009 | Create outbound webhook | | |
| TC-CAR-010 | Webhook delivery verification | | |
| TC-CAR-011 | Toggle webhook inactive | | |
| TC-CAR-012 | Delete webhook | | |
| TC-CAR-013 | Access another carrier's data (negative) | | |
| TC-CAR-014 | Switch language to French | | |
| TC-CAR-015 | Switch language back to English | | |
| TC-ATT-001 | View case queue | | |
| TC-ATT-002 | Accept a case | | |
| TC-ATT-003 | Decline a case | | |
| TC-ATT-004 | Update case status | | |
| TC-ATT-005 | Message driver | | |
| TC-ATT-006 | View ratings | | |
| TC-ATT-007 | Attorney without subscription (negative) | | |
| TC-ATT-008 | Subscription checkout | | |
| TC-ATT-009 | Access another attorney's case (negative) | | |
| TC-ATT-010 | Rate limit on case operations | | |
| TC-ADM-001 | View admin dashboard | | |
| TC-ADM-002 | View and filter all cases | | |
| TC-ADM-003 | Manually assign attorney | | |
| TC-ADM-004 | Invite new staff member | | |
| TC-ADM-005 | Change user role | | |
| TC-ADM-006 | Suspend user | | |
| TC-ADM-007 | Unsuspend user | | |
| TC-ADM-008 | Admin suspends own account (negative) | | |
| TC-ADM-009 | Assign operator to case | | |
| TC-ADM-010 | Access revenue reports | | |
| TC-OPR-001 | View case queue | | |
| TC-OPR-002 | Auto-assign attorney | | |
| TC-OPR-003 | Manual attorney assignment | | |
| TC-OPR-004 | No attorneys available (negative) | | |
| TC-OPR-005 | Batch OCR processing | | |
| TC-OPR-006 | Use message template | | |
| TC-OPR-007 | Assign to suspended attorney (negative) | | |
| TC-PAR-001 | View assigned cases | | |
| TC-PAR-002 | Add case note | | |
| TC-PAR-003 | Attempt attorney assignment (negative) | | |
| TC-PAR-004 | Attempt status update (negative) | | |
| TC-PAR-005 | Access admin reports (negative) | | |
| TC-RT-001 | New message push notification | | |
| TC-RT-002 | Typing indicator | | |
| TC-RT-003 | Case status update notification | | |
| TC-RT-004 | Quiet hours — no SMS | | |
| TC-RT-005 | Mark all notifications read | | |
| TC-PWA-001 | Install PWA | | |
| TC-PWA-002 | Offline handling | | |
| TC-PWA-003 | Service worker cache | | |
| TC-I18N-001 | English default | | |
| TC-I18N-002 | Switch to Spanish | | |
| TC-I18N-003 | Switch to French | | |
| TC-I18N-004 | Persist language across sessions | | |
| TC-PDF-001 | Driver invoice PDF | | |
| TC-PDF-002 | Carrier compliance report PDF | | |
| TC-PDF-003 | Compliance report — no data (negative) | | |

**Total: 77 test cases** | Positive: 52 | Negative: 25
