
================================================================================
PART 4 COMPLETE!
================================================================================


---

# 04_FUNCTIONAL_REQUIREMENTS.md

# CDL Ticket Management Platform - Functional Requirements
**Version:** 1.0  
**Date:** January 2025  
**Philosophy:** If it needs explanation, redesign it.

---

## 1. USER STORIES (Persona-Based)

### 1.1 Miguel (Driver) - 20 Stories

#### Ticket Management
1. **As Miguel**, I want to submit a ticket by taking a photo, so I don't have to type anything
2. **As Miguel**, I want the system to read my ticket automatically, so I don't fill out forms
3. **As Miguel**, I want to see "We got it!" confirmation immediately, so I know it went through
4. **As Miguel**, I want to upload from my phone in under 30 seconds, so I can get back to driving
5. **As Miguel**, I want to take multiple photos if ticket is folded, so nothing is missed

#### Attorney Selection
6. **As Miguel**, I want attorney ratings in stars (⭐⭐⭐⭐⭐), so I choose quickly without reading
7. **As Miguel**, I want to see "Won 89% of cases like yours", so I trust my choice
8. **As Miguel**, I want only 3 attorney options (not 20), so I'm not overwhelmed
9. **As Miguel**, I want one attorney marked "RECOMMENDED", so I don't stress about choosing
10. **As Miguel**, I want to see attorney photo and name, so it feels personal

#### Payment
11. **As Miguel**, I want payment plans shown upfront ($50/week), so I know it's affordable
12. **As Miguel**, I want to pay with debit card (not check), so it's simple
13. **As Miguel**, I want to see total cost immediately, so there are no surprises
14. **As Miguel**, I want "Pay Later" option clearly visible, so I'm not stuck if broke today
15. **As Miguel**, I want automatic payment reminders via SMS, so I don't miss payments

#### Communication
16. **As Miguel**, I want SMS updates (not emails), so I don't miss anything
17. **As Miguel**, I want plain English status ("Attorney working on it"), not legal jargon
18. **As Miguel**, I want to text my attorney directly, so I get quick answers
19. **As Miguel**, I want updates only when something changes, so I'm not annoyed by spam
20. **As Miguel**, I want Spanish language option with one tap, so I understand everything

---

### 1.2 Sarah (Carrier Safety Director) - 20 Stories

#### Dashboard & Monitoring
1. **As Sarah**, I want a dashboard showing CSA impact at a glance, so I report to CEO quickly
2. **As Sarah**, I want red/yellow/green indicators, so I see problems without reading numbers
3. **As Sarah**, I want "Risk Score" in big numbers on homepage, so I know status instantly
4. **As Sarah**, I want automatic alerts when driver gets ticket, so I'm never surprised in audits
5. **As Sarah**, I want to see all open tickets on one screen, so I track everything

#### Reporting
6. **As Sarah**, I want one-click PDF reports for DOT audits, so I don't spend hours in Excel
7. **As Sarah**, I want to export driver records instantly, so I'm ready for any audit
8. **As Sarah**, I want weekly summary emails, so I stay informed without logging in
9. **As Sarah**, I want year-over-year comparison charts, so I show improvement to management
10. **As Sarah**, I want CSA score projection, so I prevent problems before they happen

#### Fleet Management
11. **As Sarah**, I want to add drivers with just name and CDL number, so onboarding is fast
12. **As Sarah**, I want to see which drivers have pending tickets, so I manage workload
13. **As Sarah**, I want to bulk-upload driver list from Excel, so I don't enter 50 names manually
14. **As Sarah**, I want automatic driver notifications, so I don't chase people down
15. **As Sarah**, I want to assign company card for payment, so drivers don't pay out-of-pocket

#### Compliance
16. **As Sarah**, I want automatic DOT compliance alerts, so I'm always prepared
17. **As Sarah**, I want ticket history for each driver, so I make informed decisions
18. **As Sarah**, I want to flag high-risk drivers automatically, so I intervene early
19. **As Sarah**, I want audit trail of all actions, so I prove compliance during inspections
20. **As Sarah**, I want integration with our HR system, so data stays in sync

---

### 1.3 James (Attorney) - 15 Stories

#### Case Management
1. **As James**, I want full ticket details before accepting, so I don't waste time on bad cases
2. **As James**, I want to see case type immediately (speeding vs. logbook), so I filter by expertise
3. **As James**, I want driver contact info visible, so I reach out when needed
4. **As James**, I want to accept/decline case with one tap, so I move through queue quickly
5. **As James**, I want to see my active caseload at a glance, so I manage capacity

#### Payment & Billing
6. **As James**, I want payment guaranteed upfront, so I never chase collections
7. **As James**, I want automatic invoicing when case closes, so I focus on legal work
8. **As James**, I want payment deposited weekly, so cash flow is predictable
9. **As James**, I want to see earnings dashboard, so I track business performance
10. **As James**, I want platform fee shown clearly, so no surprises at payout

#### Communication
11. **As James**, I want quick case updates (not detailed forms), so I stay efficient
12. **As James**, I want SMS option to contact driver, so communication is fast
13. **As James**, I want document upload from phone, so I work from courthouse
14. **As James**, I want to mark case status with dropdown, so updates take 5 seconds
15. **As James**, I want automatic client notifications when I update case, so I don't send separate messages

---

### 1.4 Lisa (Small Carrier Owner) - 10 Stories

#### Guided Experience
1. **As Lisa**, I want the system to tell me what to do next, so I don't figure it out alone
2. **As Lisa**, I want setup wizard that asks simple questions, so I'm up and running in 10 minutes
3. **As Lisa**, I want big buttons with clear labels, so I never get lost
4. **As Lisa**, I want help chat visible on every screen, so I get unstuck fast
5. **As Lisa**, I want video tutorials under 2 minutes, so I learn without reading manuals

#### Simplified Features
6. **As Lisa**, I want automatic DOT audit reports, so I'm always prepared without expertise
7. **As Lisa**, I want "Print This for Your DOT Audit" button, so I know exactly what to bring
8. **As Lisa**, I want system to warn me about CSA problems, so I fix them before inspection
9. **As Lisa**, I want to manage 1-10 drivers easily, so I'm not paying for enterprise features I don't need
10. **As Lisa**, I want pricing that scales with my fleet size, so I'm not overpaying

---

## 2. FEATURE SPECIFICATIONS WITH SIMPLICITY RATINGS

### Simplicity Rating System:
- ✅ **Simple** (no training needed - passes grandma test)
- ⚠️ **Medium** (some explanation required)
- ❌ **Complex** (requires training - avoid in MVP!)

---

### 2.1 MUST-HAVE (MVP Features)

#### Ticket Submission with OCR ✅
**Simplicity Score:** 10/10
- **Why Simple:** Take photo → Done (2 steps)
- **User Action:** Tap camera icon, take photo, confirm
- **System Action:** OCR extracts all data, pre-fills form
- **Fallback:** Manual entry if OCR fails (system guides: "We couldn't read X, please enter")
- **Grandma Test:** ✅ Anyone with smartphone camera can do this

#### Attorney Matching (3 Options) ✅
**Simplicity Score:** 9/10
- **Why Simple:** System picks best 3, user just taps one
- **Display:** Card layout with photo, star rating, win rate, price
- **Default:** Top attorney pre-selected with "RECOMMENDED" badge
- **User Action:** Review 3 options, tap one, confirm
- **Grandma Test:** ✅ Like choosing a restaurant on Yelp

#### Payment Processing ✅
**Simplicity Score:** 9/10
- **Why Simple:** Standard Stripe interface everyone recognizes
- **Options:** Debit/credit card, payment plan (auto-calculated)
- **Display:** Total cost in huge numbers, payment plan breakdown
- **User Action:** Enter card details OR select "Pay $X/week"
- **Grandma Test:** ✅ Like paying for anything online

#### Status Tracking ✅
**Simplicity Score:** 10/10
- **Why Simple:** Visual progress bar + plain English
- **Stages:** 
  - "Submitted" → "Attorney Assigned" → "Working on It" → "Resolved"
- **Display:** Progress bar, emoji indicators, last update timestamp
- **Notifications:** SMS for each stage change
- **Grandma Test:** ✅ Like tracking a package

#### Messaging ✅
**Simplicity Score:** 10/10
- **Why Simple:** Text message interface everyone knows
- **Interface:** Chat bubbles (driver = blue, attorney = gray)
- **Features:** Text only (no file upload in MVP)
- **Notifications:** Push notification + SMS for new messages
- **Grandma Test:** ✅ Exactly like texting family

---

### 2.2 SHOULD-HAVE (V1 - Post-MVP)

#### Payment Plans ✅
**Simplicity Score:** 9/10
- **Why Simple:** System calculates options, user just picks
- **Options:** 
  - 2 weeks ($X/week)
  - 4 weeks ($Y/week)
  - 8 weeks ($Z/week)
- **Display:** Side-by-side comparison, "Most Popular" badge
- **Auto-Payment:** Automatic charge on chosen day
- **Grandma Test:** ✅ Like financing a TV

#### Dashboard Analytics ⚠️
**Simplicity Score:** 7/10
- **Why Medium:** Requires understanding metrics
- **For Carriers:** CSA score, ticket trends, driver rankings
- **For Attorneys:** Caseload, earnings, win rates
- **Simplification:** 
  - Big number indicators
  - Red/yellow/green color coding
  - "What This Means" tooltips
- **Grandma Test:** ⚠️ Needs 5-minute explanation

#### Push Notifications ✅
**Simplicity Score:** 10/10
- **Why Simple:** Standard phone notifications
- **Triggers:** Status updates, new messages, payment reminders
- **Customization:** Turn on/off by category
- **Grandma Test:** ✅ Like any app notification

#### Document Upload ✅
**Simplicity Score:** 9/10
- **Why Simple:** Take photo or select from gallery
- **Use Cases:** Court documents, proof of payment, additional evidence
- **Interface:** Big "Add Photo" button, thumbnail preview
- **Grandma Test:** ✅ Like attaching photo to email

#### Rating System ✅
**Simplicity Score:** 10/10
- **Why Simple:** Star rating everyone understands
- **Trigger:** After case resolution, prompt "Rate Your Attorney"
- **Options:** 1-5 stars + optional comment (not required)
- **Grandma Test:** ✅ Like rating on Amazon

---

### 2.3 COULD-HAVE (V2 - Future Enhancements)

#### Advanced Filters ⚠️
**Simplicity Score:** 6/10
- **Why Medium:** Multiple options can overwhelm
- **Examples:** 
  - Filter tickets by date, type, status, driver
  - Filter attorneys by specialty, location, win rate
- **Simplification:** Pre-set filter shortcuts ("High Priority", "Due This Week")
- **Grandma Test:** ⚠️ Too many options confuse

#### Fleet Management Tools ⚠️
**Simplicity Score:** 6/10
- **Why Medium:** Designed for power users (Sarah, not Miguel)
- **Features:**
  - Bulk actions (assign tickets, send reminders)
  - Driver groups/tags
  - Custom reporting
- **Simplification:** Templates for common actions
- **Grandma Test:** ⚠️ Not for casual users

#### Multi-Language Support ✅
**Simplicity Score:** 9/10
- **Why Simple:** One-tap language switcher
- **Languages:** English, Spanish (MVP), then expand
- **Placement:** Flag icon in header, persistent across sessions
- **Grandma Test:** ✅ Clear visual indicator

#### Automated Reminders ✅
**Simplicity Score:** 10/10
- **Why Simple:** Happens in background
- **Types:**
  - Payment due reminders
  - Court date reminders
  - Document upload requests
- **Channels:** SMS + push notification + email
- **Grandma Test:** ✅ Invisible to user

---

### 2.4 WON'T-HAVE (Too Complex - Avoid)

#### Full TMS Integration ❌
**Simplicity Score:** 2/10
- **Why Too Complex:** Requires IT department, custom APIs, training
- **Problem:** Every TMS is different, maintenance nightmare
- **Alternative:** Simple CSV export for manual import

#### Custom Workflow Builder ❌
**Simplicity Score:** 1/10
- **Why Too Complex:** Requires understanding of logic/rules
- **Problem:** Creates support burden, confuses users
- **Alternative:** Pre-built workflows that work for 90%

#### Advanced Role Permissions ❌
**Simplicity Score:** 3/10
- **Why Too Complex:** Matrix of permissions is confusing
- **Problem:** "Why can't I see X?" support tickets
- **Alternative:** Simple roles (Admin, Manager, Driver)

#### AI-Powered Predictions ❌
**Simplicity Score:** 4/10
- **Why Too Complex:** Black box creates distrust
- **Problem:** Users don't understand how/why recommendations made
- **Alternative:** Simple rule-based matching with clear logic

---

## 3. USER FLOWS (Click Count Analysis)

### 3.1 Driver: Submit Ticket (Goal: 3 clicks)

**Optimal Flow:**
1. **Click 1:** Tap "Submit Ticket" button on home screen
2. **Click 2:** Tap camera icon → Take photo (or select from gallery)
3. **Click 3:** Review AI-filled form → Tap "Submit"

**Total: 3 clicks** ✅

**Screen Flow:**
```
Home Screen
   ↓ [Submit Ticket]
Camera/Gallery
   ↓ [Capture/Select]
Review & Confirm Screen
   - Ticket #: [Auto-filled]
   - Date: [Auto-filled]
   - Violation: [Auto-filled]
   - Location: [Auto-filled]
   - Court Date: [Auto-filled]
   - Fine Amount: [Auto-filled]
   ↓ [Submit]
Success Screen
   "We got it! You'll hear from us soon."
```

**Edge Cases:**
- OCR fails: System highlights missing fields, user fills 2-3 fields manually (still < 5 clicks)
- Multiple pages: "Add Another Photo" button appears, user taps, takes photo (adds 2 clicks)

---

### 3.2 Driver: Select Attorney (Goal: 4 clicks)

**Optimal Flow:**
1. **Click 1:** Receive notification "3 attorneys available"
2. **Click 2:** Tap notification → Opens attorney selection screen
3. **Click 3:** Review 3 options → Tap "Choose" on recommended attorney
4. **Click 4:** Confirm selection

**Total: 4 clicks** ✅

**Screen Flow:**
```
Notification
   ↓ [Tap]
Attorney Selection Screen
   [RECOMMENDED badge]
   ⭐⭐⭐⭐⭐ James Smith
   "Won 89% of cases like yours"
   $299 or $75/week
   [Choose Attorney] ← Pre-selected
   
   ⭐⭐⭐⭐ Maria Garcia
   "Won 85% of cases like yours"
   $349 or $87/week
   [Choose Attorney]
   
   ⭐⭐⭐⭐ Robert Johnson
   "Won 82% of cases like yours"
   $279 or $70/week
   [Choose Attorney]
   
   ↓ [Choose Attorney]
Confirmation Screen
   "You selected James Smith"
   "Next: Payment"
   [Confirm & Continue]
   ↓
Payment Screen
```

---

### 3.3 Driver: Make Payment (Goal: 5 clicks)

**Optimal Flow:**
1. **Click 1:** On payment screen, choose "Pay Now" or "Payment Plan"
2. **Click 2:** If payment plan, select term (2/4/8 weeks)
3. **Click 3:** Enter card details (counts as one action)
4. **Click 4:** Tap "Pay $X" button
5. **Click 5:** Confirm payment

**Total: 5 clicks** ✅

**Screen Flow:**
```
Payment Screen
   Total: $299 [big numbers]
   
   ○ Pay Now - $299
   ● Payment Plan [pre-selected]
   
   Choose Plan:
   ○ 2 weeks - $149.50/week
   ● 4 weeks - $74.75/week [Most Popular]
   ○ 8 weeks - $37.38/week
   
   [Card Entry Fields - Stripe UI]
   
   [Pay $74.75/week]
   ↓
Confirmation
   "First payment: $74.75 on [date]"
   [Confirm Payment]
   ↓
Success Screen
   "Payment confirmed!"
   "Your attorney is working on your case"
```

---

### 3.4 Carrier: View Dashboard (Goal: 1 click)

**Optimal Flow:**
1. **Click 1:** Login → Automatically lands on dashboard

**Total: 1 click** ✅

**Screen Flow:**
```
Login
   ↓ [automatic redirect]
Dashboard
   [Hero Metrics - Big Numbers]
   CSA Risk Score: 67 [YELLOW indicator]
   Active Tickets: 12
   Resolved This Month: 8
   
   [Visual Charts]
   - Ticket trend (last 6 months)
   - Top violation types
   - Driver risk ranking
   
   [Action Items]
   ⚠ 3 drivers need attention
   ⚠ 2 court dates this week
   
   [Quick Actions]
   [Export Report] [Add Driver] [View All Tickets]
```

---

### 3.5 Carrier: Generate DOT Audit Report (Goal: 2 clicks)

**Optimal Flow:**
1. **Click 1:** Tap "Export Report" on dashboard
2. **Click 2:** Select "DOT Audit Report" → Auto-downloads PDF

**Total: 2 clicks** ✅

**Screen Flow:**
```
Dashboard
   ↓ [Export Report]
Report Selection Modal
   ○ DOT Audit Report [recommended]
   ○ Driver Performance Report
   ○ Ticket History Report
   ○ Custom Date Range Report
   
   Date Range: [Last 12 months ▼]
   
   [Generate PDF]
   ↓
Download Confirmation
   "DOT_Audit_Report_2025.pdf downloaded"
   [Open] [Email] [Close]
```

---

### 3.6 Attorney: Accept Case (Goal: 2 clicks)

**Optimal Flow:**
1. **Click 1:** Receive notification → Tap to view case details
2. **Click 2:** Review details → Tap "Accept Case"

**Total: 2 clicks** ✅

**Screen Flow:**
```
Notification
   "New Case Available: Speeding - $299"
   ↓ [Tap]
Case Details Screen
   Driver: Miguel Rodriguez
   Violation: Speeding (15 over)
   Location: I-40, Nashville, TN
   Court Date: Feb 15, 2025
   Fee: $299 (you receive $269)
   
   [Case Documents]
   - Ticket photo
   - Driver CDL
   
   [Accept Case] [Decline]
   ↓
Confirmation
   "Case accepted!"
   "Miguel will be notified"
   [View My Cases]
```

---

### 3.7 Attorney: Update Case Status (Goal: 3 clicks)

**Optimal Flow:**
1. **Click 1:** Tap on active case from case list
2. **Click 2:** Tap "Update Status" button
3. **Click 3:** Select new status from dropdown → Auto-saves

**Total: 3 clicks** ✅

**Screen Flow:**
```
My Cases List
   ↓ [Tap Case]
Case Detail Screen
   Miguel Rodriguez - Speeding
   Current Status: Attorney Assigned
   
   [Update Status]
   ↓
Status Update Modal
   New Status:
   ○ Submitted
   ● In Progress
   ○ Court Appearance Scheduled
   ○ Resolved - Dismissed
   ○ Resolved - Reduced
   ○ Resolved - Paid
   
   Optional Note: [text field]
   
   [Save Update] ← Auto-selects on status tap
   ↓
Confirmation
   "Status updated to: In Progress"
   "Miguel notified via SMS"
```

---

### 3.8 Small Carrier: Setup Account (Goal: 10 clicks in 10 minutes)

**Optimal Flow:**
1. **Click 1:** Sign up with email
2. **Click 2:** Enter company name
3. **Click 3:** Enter DOT number
4. **Click 4:** Select fleet size (dropdown)
5. **Click 5:** Add first driver name
6. **Click 6:** Add driver CDL number
7. **Click 7:** Enter payment card for driver tickets
8. **Click 8:** Confirm billing
9. **Click 9:** Complete setup
10. **Click 10:** Skip tutorial (or watch 2-min video)

**Total: 10 clicks** ✅

**Screen Flow:**
```
Signup
   [Email] [Password]
   [Create Account]
   ↓
Setup Wizard (Step 1 of 4)
   "Tell us about your company"
   Company Name: [___]
   DOT Number: [___]
   Fleet Size: [1-10 ▼]
   [Next]
   ↓
Setup Wizard (Step 2 of 4)
   "Add your first driver"
   Driver Name: [___]
   CDL Number: [___]
   [+ Add Another Driver] [Next]
   ↓
Setup Wizard (Step 3 of 4)
   "Payment method for driver tickets"
   [Credit Card Fields]
   "We'll charge this card when drivers get tickets"
   [Next]
   ↓
Setup Wizard (Step 4 of 4)
   "You're all set!"
   ✓ Company profile created
   ✓ 1 driver added
   ✓ Payment method saved
   
   [Watch 2-min Tutorial] [Skip to Dashboard]
```

---

## 4. ACCEPTANCE CRITERIA

### 4.1 Ticket Submission

**Feature:** OCR Ticket Scanning

**Acceptance Criteria:**

**AC1: Image Capture**
- ✅ User can access camera from submit ticket screen
- ✅ User can select existing photo from gallery
- ✅ System accepts JPG, PNG, HEIC formats
- ✅ System accepts image sizes up to 10MB
- ✅ User receives immediate feedback "Processing..."

**AC2: OCR Accuracy**
- ✅ System extracts ticket number with 95%+ accuracy
- ✅ System extracts date with 90%+ accuracy
- ✅ System extracts violation type with 85%+ accuracy
- ✅ System extracts location with 85%+ accuracy
- ✅ System extracts fine amount with 95%+ accuracy
- ✅ System extracts court date with 90%+ accuracy

**AC3: Data Validation**
- ✅ System validates ticket number format (state-specific)
- ✅ System validates date is in past or today
- ✅ System validates court date is in future
- ✅ System flags invalid data with clear message
- ✅ User can override OCR data if incorrect

**AC4: Manual Fallback**
- ✅ If OCR confidence < 70%, system prompts manual entry
- ✅ Manual entry form only shows unrecognized fields
- ✅ Hybrid form (OCR + manual) completes in < 2 minutes

**AC5: Confirmation**
- ✅ User sees success message within 2 seconds
- ✅ System sends confirmation SMS within 30 seconds
- ✅ Ticket appears in user's ticket list immediately

---

### 4.2 Attorney Matching

**Feature:** Three-Attorney Recommendation System

**Acceptance Criteria:**

**AC1: Attorney Selection Algorithm**
- ✅ System identifies 3 attorneys licensed in ticket jurisdiction
- ✅ System prioritizes by: (1) Win rate, (2) Response time, (3) Price
- ✅ Top attorney gets "RECOMMENDED" badge
- ✅ All 3 attorneys must have 4+ star rating
- ✅ If < 3 qualified attorneys, system shows available number

**AC2: Attorney Profile Display**
- ✅ Each attorney card shows: Photo, Name, Star Rating, Win Rate, Price
- ✅ Win rate displays as percentage: "Won 89% of cases like yours"
- ✅ Price shows both one-time and payment plan: "$299 or $75/week"
- ✅ Star rating displays visually: ⭐⭐⭐⭐⭐ (not just number)
- ✅ Cards are equal size, clear hierarchy (recommended on top)

**AC3: User Interaction**
- ✅ User can tap any attorney card to see full profile
- ✅ User can select attorney with one tap on "Choose" button
- ✅ Selected attorney highlights visually
- ✅ User can change selection before confirming
- ✅ Confirmation screen summarizes selection clearly

**AC4: Attorney Notification**
- ✅ Selected attorney receives case notification within 1 minute
- ✅ Notification includes: Case type, Location, Fee, Court date
- ✅ Attorney can accept/decline within 24 hours
- ✅ If attorney declines, system auto-offers to next attorney

**AC5: Performance Tracking**
- ✅ System tracks: Acceptance rate, Response time, Case outcomes
- ✅ Attorney rating updates after each case resolution
- ✅ Attorneys with < 4 stars removed from recommendations
- ✅ Win rate calculated from last 50 cases (rolling)

---

### 4.3 Payment Processing

**Feature:** Flexible Payment with Stripe Integration

**Acceptance Criteria:**

**AC1: Payment Options Display**
- ✅ User sees total amount in large, bold font (48px+)
- ✅ "Pay Now" and "Payment Plan" options clearly labeled
- ✅ Payment plan shows 3 term options: 2/4/8 weeks
- ✅ Each plan displays weekly amount prominently
- ✅ "Most Popular" badge on 4-week plan

**AC2: Payment Plan Calculation**
- ✅ Weekly amount = (Total ÷ Weeks) rounded to nearest $0.25
- ✅ System shows first payment date (7 days from today)
- ✅ System shows total number of payments
- ✅ No hidden fees - final total equals original quote
- ✅ User sees full payment schedule before confirming

**AC3: Stripe Integration**
- ✅ Payment form uses Stripe Elements (PCI compliant)
- ✅ Card entry supports all major cards (Visa, MC, Amex, Discover)
- ✅ Real-time validation of card number as user types
- ✅ System handles 3D Secure authentication when required
- ✅ Payment processes within 5 seconds

**AC4: Payment Confirmation**
- ✅ User receives on-screen confirmation immediately
- ✅ User receives confirmation email within 2 minutes
- ✅ User receives confirmation SMS within 2 minutes
- ✅ Confirmation includes: Amount, Date, Last 4 of card, Receipt number
- ✅ Attorney receives payment notification

**AC5: Payment Plan Management**
- ✅ System charges card automatically on schedule
- ✅ User receives reminder SMS 2 days before charge
- ✅ User receives receipt after each successful charge
- ✅ If payment fails, user receives SMS with "Update Card" link
- ✅ System retries failed payment 2 times (24 hours apart)

**AC6: Security & Compliance**
- ✅ No card numbers stored in platform database
- ✅ Stripe tokens used for recurring payments
- ✅ SSL/TLS encryption for all payment pages
- ✅ System logs all payment attempts (for disputes)
- ✅ Refund process available within 30 days

---

### 4.4 Status Tracking

**Feature:** Real-Time Case Status Updates

**Acceptance Criteria:**

**AC1: Status Stages**
- ✅ System defines 6 clear stages:
  1. Submitted
  2. Attorney Assigned
  3. In Progress
  4. Court Scheduled
  5. Resolved
  6. Closed
- ✅ Each stage has plain-English description (no jargon)
- ✅ Progress bar shows stages visually (filled circles)

**AC2: Visual Display**
- ✅ Current stage highlighted in brand color
- ✅ Completed stages show checkmark ✓
- ✅ Future stages shown in gray
- ✅ Estimated time for next stage displayed
- ✅ Last update timestamp visible: "Updated 2 hours ago"

**AC3: Automatic Updates**
- ✅ System updates status when attorney takes action
- ✅ Status changes trigger immediate notification (push + SMS)
- ✅ Dashboard reflects new status within 10 seconds
- ✅ User can refresh manually with pull-to-refresh gesture

**AC4: Notification Content**
- ✅ Notification uses plain English: "James is working on your case"
- ✅ Notification includes emoji for visual cue: 📋 ⚖️ ✅
- ✅ Notification includes next step if applicable
- ✅ User can tap notification to view full details
- ✅ Notification respects user's quiet hours (9pm-8am)

**AC5: Status History**
- ✅ User can view full status history (timeline view)
- ✅ Each entry shows: Date, Time, Stage, Note (if added)
- ✅ Timeline shows who made update (system vs. attorney)
- ✅ User can export status history as PDF

---

### 4.5 Messaging System

**Feature:** In-App Chat Between Driver and Attorney

**Acceptance Criteria:**

**AC1: Chat Interface**
- ✅ Chat displays in familiar bubble format
- ✅ Driver messages aligned right (blue bubbles)
- ✅ Attorney messages aligned left (gray bubbles)
- ✅ Timestamps shown for each message
- ✅ "Typing..." indicator when other party is typing

**AC2: Message Delivery**
- ✅ Message sends within 2 seconds
- ✅ Sent messages show checkmark ✓
- ✅ Read messages show double checkmark ✓✓
- ✅ Failed messages show retry option
- ✅ Messages sync across devices

**AC3: Notifications**
- ✅ New message triggers push notification
- ✅ New message triggers SMS (if app not open)
- ✅ Notification includes sender name and message preview
- ✅ User can reply directly from notification (iOS/Android)
- ✅ Badge count shows un

✅ Functional Requirements created!

📁 Saved to: /Users/paveltkachenko/prj/cdl-ticket-management/docs/04_FUNCTIONAL_REQUIREMENTS.md