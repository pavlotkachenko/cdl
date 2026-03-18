# Story MSG-4: Backend — Seed Test Data

## Status: DONE

## Description
Create a seed script that populates the database with realistic test conversations and messages so the redesigned UI can be visually verified. Uses auth.users IDs for FK constraints.

## Test Data Plan

### Conversations to Create (6 total)

| # | Type | Other Party | Case Link | Status | Unread | Notes |
|---|------|-------------|-----------|--------|--------|-------|
| 1 | `attorney_case` | James Wilson (attorney) | CASE-2026-000847 | Active | 2 | Primary test conversation with most messages |
| 2 | `attorney_case` | Maria Santos (attorney) | CASE-2026-000622 | Active | 1 | Court date confirmation |
| 3 | `attorney_case` | David Park (attorney) | CASE-2026-000715 | Active | 0 | All read, driver sent last |
| 4 | `operator` | Case Coordinator (operator) | None | Active | 1 | Payment plan setup |
| 5 | `support` | CDL Support (operator) | None | Active | 0 | Welcome message |
| 6 | `attorney_case` | Robert Chen (attorney) | CASE-2026-000503 | Closed | 0 | Resolved case |

### Users to Create/Find
Need these users in `public.users` + `auth.users`:
- driver@test.com — existing driver (auth_user_id: c3baee5c)
- Attorney: James Wilson — create or use existing attorney
- Attorney: Maria Santos — create or use existing attorney
- Attorney: David Park — create or use existing attorney
- Attorney: Robert Chen — create or use existing attorney
- Operator: Case Coordinator — create or use existing operator
- Operator: CDL Support — create or use existing operator

### Messages per Conversation

**Conv 1 (James Wilson — 8+ messages):**
- System: "Attorney James Wilson has been assigned to your case."
- JW: "Hello! I've reviewed your ticket. The citation shows 78mph in a 65mph zone on I-35..."
- JW: "My initial strategy is to challenge the radar gun calibration records..."
- Driver: "It was on I-35 North, around mile marker 42. The officer had a handheld radar..."
- Driver: "Also I had my dashcam running. Do you need the footage?"
- JW: "Yes, dashcam footage is excellent evidence — please upload it..."
- JW: (Today) "I've completed the initial case review. Here's a summary of our defense strategy..."
- JW: (Today) "I'm reviewing your driving log — can you also send the ELD data export?" (unread)

**Conv 2 (Maria Santos — 4 messages):**
- System: "Attorney Maria Santos has been assigned to your case."
- MS: "Hello! I'll be handling your case for the overweight violation."
- Driver: "Hi Maria, the scale was at the Texas checkpoint on I-10."
- MS: "Court date confirmed: March 20. Make sure you arrive 30 mins early." (unread)

**Conv 3 (David Park — 3 messages):**
- DP: "Good news — the judge agreed to reduce the charge to a non-moving violation."
- Driver: "That's great! What do I need to do next?"
- Driver: "Thanks for the update. I'll prepare the documents."

**Conv 4 (Case Coordinator — 3 messages):**
- CC: "Welcome! I'm your case coordinator. I'll help you through the process."
- CC: "Your payment plan has been set up. First installment of $75 is due March 25."
- Driver: "Thanks, I'll make the payment."

**Conv 5 (CDL Support — 2 messages):**
- Support: "Welcome to CDL Advisor! We're here to help you 24/7."
- Support: "Quick tip: You can submit a ticket photo and our OCR will auto-fill the details."

**Conv 6 (Robert Chen — closed — 3 messages):**
- RC: "Case dismissed. The calibration records showed the device was overdue for service."
- Driver: "Thank you so much for your help!"
- RC: "You're welcome. Case #0503 is now closed. Drive safe!"

## Implementation
- Create as a Node.js script: `backend/src/scripts/seed-messages.js`
- Run with `node src/scripts/seed-messages.js` from backend directory
- Must create cases if they don't exist (for FK constraints)
- Must use auth.users IDs for conversation and message FKs

## Acceptance Criteria
- [x] Seed script creates 6 conversations with correct types
- [x] At least 20 messages across all conversations
- [x] 4 unread messages (2 in conv 1, 1 in conv 2, 1 in conv 4)
- [x] 1 closed conversation
- [x] Script is idempotent (can be run multiple times without creating duplicates)
- [x] Driver at driver@test.com can see all conversations when logged in

## Files to Create
- `backend/src/scripts/seed-messages.js`
