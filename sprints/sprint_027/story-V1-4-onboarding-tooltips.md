# Story V1-4 — Onboarding Tooltip Overlay

**Sprint:** 027 — V1 First Revenue
**Priority:** HIGH
**Status:** TODO

## User Story

As Lisa (small carrier, not tech-savvy),
I want a step-by-step guide the first time I log in,
so I know exactly where to add drivers and submit tickets without calling support.

## Context

Onboarding tooltips are listed at 0% in the MVP roadmap (`docs/07_ROADMAP_AND_PRIORITIES.md` §MVP should-haves). Lisa's persona (`docs/02_PERSONAS_AND_JOURNEYS.md`) explicitly requires guided onboarding to reduce her tech anxiety.

## Scope

Role-aware, 3-step onboarding overlay shown once on first login per role. Dismissed permanently after completion or skip.

## Behaviour

### Trigger
- Show onboarding overlay when `localStorage.getItem('onboarding_complete_{role}')` is null
- After completion or skip: `localStorage.setItem('onboarding_complete_{role}', 'true')`
- Never shown again after dismissal

### Steps by Role

**Driver (Miguel):**
1. "Submit your first ticket" → highlights the "New Ticket" button
2. "Track your case" → highlights the cases list
3. "Pay securely" → highlights the payment section or first case with `pay_attorney` status

**Carrier (Lisa):**
1. "Add your drivers" → highlights the "Add Driver" button on fleet dashboard
2. "View fleet tickets" → highlights the cases table
3. "Download reports" → highlights the analytics export button

**Attorney (James):**
1. "View assigned cases" → highlights the cases list
2. "Message your client" → highlights the messages button on first case
3. "Upload documents" → highlights the document upload on case detail

**Operator / Admin:**
1. "Review pending cases" → highlights the pending queue
2. "Assign to attorney" → highlights the assign button
3. "Track all cases" → highlights the status filter tabs

### UI Component

New shared component: `frontend/src/app/shared/components/onboarding-overlay/`

```
┌─────────────────────────────────────────────┐
│  💡  Step 2 of 3                             │
│                                              │
│  Track your case                             │
│  See real-time updates on your ticket        │
│  status here.                                │
│                                              │
│  [Skip tour]              [Next →]           │
└─────────────────────────────────────────────┘
  ↑ Positioned relative to highlighted element
```

**Angular implementation:**
- `@if (showOnboarding())` wrapping overlay `<div>`
- `currentStep = signal(0)`
- `steps = input<OnboardingStep[]>()` — role-specific steps passed from parent
- Spotlight effect: semi-transparent backdrop with cutout over highlighted element (CSS `mix-blend-mode: multiply` or `outline` approach)
- `completeOnboarding()` — sets localStorage key, hides overlay
- `skipOnboarding()` — same as complete

## Acceptance Criteria

- [ ] Overlay shown on first login for driver, carrier, attorney, operator, admin roles
- [ ] Overlay NOT shown on second login (localStorage key set)
- [ ] Step indicator shows "Step X of 3"
- [ ] "Skip tour" dismisses permanently
- [ ] Highlighted element has visible spotlight treatment
- [ ] Overlay is keyboard accessible (Tab to Next/Skip, Escape to skip)
- [ ] Mobile: overlay fits within 375px viewport, no horizontal scroll
- [ ] WCAG: `role="dialog"`, `aria-labelledby` on overlay, focus trapped while open

## Files to Create / Modify

- `frontend/src/app/shared/components/onboarding-overlay/onboarding-overlay.component.ts` — CREATE
- `frontend/src/app/shared/components/onboarding-overlay/onboarding-overlay.component.html` — CREATE
- `frontend/src/app/shared/components/onboarding-overlay/onboarding-overlay.component.scss` — CREATE
- `frontend/src/app/features/driver/driver-dashboard/driver-dashboard.component.ts` — UPDATE (add overlay)
- `frontend/src/app/features/carrier/carrier-dashboard/carrier-dashboard.component.ts` — UPDATE
- `frontend/src/app/features/attorney/attorney-dashboard/attorney-dashboard.component.ts` — UPDATE
- `frontend/src/app/features/operator/operator-dashboard/operator-dashboard.component.ts` — UPDATE
- `frontend/src/app/features/admin/admin-dashboard/admin-dashboard.component.ts` — UPDATE
- `frontend/src/app/shared/components/onboarding-overlay/onboarding-overlay.component.spec.ts` — CREATE

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `onboarding-overlay.component.ts` | `onboarding-overlay.component.spec.ts` | ❌ create |
| `driver-dashboard.component.ts` | `driver-dashboard.component.spec.ts` | ❌ update |
| `carrier-dashboard.component.ts` | `carrier-dashboard.component.spec.ts` | ❌ update |
