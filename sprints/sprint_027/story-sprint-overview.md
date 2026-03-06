# Sprint 027 — V1 First Revenue

**Theme:** Unlock the first revenue features post-MVP — payment plans, SMS lifecycle notifications, and first-time user onboarding.

**Status:** TODO

---

## Stories

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| [V1-1](story-V1-1-payment-plans-backend.md) | Payment Plans — Backend (Stripe Subscriptions) | CRITICAL | TODO |
| [V1-2](story-V1-2-payment-plans-ui.md) | Payment Plans — Frontend UI | CRITICAL | TODO |
| [V1-3](story-V1-3-sms-notifications.md) | SMS/Twilio Lifecycle Notifications | HIGH | TODO |
| [V1-4](story-V1-4-onboarding-tooltips.md) | Onboarding Tooltip Overlay | HIGH | TODO |

---

## Goal

Convert Miguel from a one-time ticket submitter to a recurring subscriber by offering payment plans and proactive SMS updates. Reduce Lisa's support load with a guided onboarding flow.

## Definition of Done

- [ ] All 4 stories DONE
- [ ] All new code files have corresponding test files (Sprint Testing Mandate)
- [ ] `npx ng test --no-watch` passes
- [ ] `cd backend && npm test` passes
- [ ] PR created with quality gates checklist

## Dependencies

- Stripe Subscriptions API enabled on Stripe account
- Twilio account credentials in `.env` (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`)
- Sprint 025 auth components completed (new users must be able to register)
