# Story 23.1 — Landing Page Completion

**Epic:** Launch Gate Sprint
**Sprint:** 019
**Priority:** CRITICAL
**Status:** TODO

## User Story

As a first-time visitor,
I want to understand the platform's value in under 5 seconds,
so I can decide to sign up without confusion.

## Scope

Complete the landing page to meet Launch Gate 1: 5/5 new users understand the product without explanation.

## Acceptance Criteria

### Hero Section
- [ ] Clear headline communicates value prop in ≤ 8 words (e.g., "Fight CDL Tickets. Keep Your License.")
- [ ] Subheadline explains who it's for and what they get
- [ ] Primary CTA "Submit a Ticket" and secondary CTA "Learn More" visible above the fold
- [ ] Hero image or illustration relevant to CDL drivers

### Social Proof Section
- [ ] At least 3 driver testimonials with name, role, and quote
- [ ] Key stats (e.g., "500+ tickets handled", "93% success rate", "< 24hr attorney match")
- [ ] Trust badges (Stripe-secured, SSL, etc.)

### How It Works Section
- [ ] 3-step visual flow: Upload Ticket → Get Matched → Pay & Win
- [ ] Each step has icon, short headline, 1-sentence description
- [ ] Mobile: stacked vertically; Desktop: horizontal timeline

### FAQ Section
- [ ] Minimum 6 questions covering: pricing, attorney quality, timeline, CDL impact, privacy, cancellation
- [ ] Accordion expand/collapse interaction
- [ ] Keyboard accessible (Enter/Space to toggle)

### Footer CTAs
- [ ] "Get Started" button links to `/auth/register`
- [ ] Links to: Privacy Policy, Terms of Service, Contact

## Files to Create / Modify

- `frontend/src/app/features/landing/` — landing page component (create if not exists)
- `frontend/src/app/app.routes.ts` — ensure `/` routes to landing
- Test file: `landing.component.spec.ts`

## Test Cases (Story 23.7-tests.md)

- Hero section renders with headline and both CTAs
- FAQ accordion opens/closes on click
- "Get Started" CTA navigates to `/auth/register`
- Component renders without errors on mobile viewport (375px)
