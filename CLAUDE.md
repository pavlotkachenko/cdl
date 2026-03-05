# CDL Ticket Management System — Project Constitution

> **Owner:** Pavel Tkachenko | **Architecture:** Angular 21 + Node.js/Express 5 + Supabase (PostgreSQL)
> **Mission:** Build the simplest CDL ticket management platform that makes complexity the competitor's liability.

---

## 1. Project Overview

A SaaS platform connecting CDL drivers, fleet carriers, and defense attorneys for traffic ticket management. Mobile-first, 3-click rule, zero training required.

**Tech Stack:**
- **Frontend:** Angular 21 (standalone components, signals, OnPush), Angular Material 21, Tailwind CSS, PWA
- **Backend:** Node.js 18+ LTS, Express 5, JWT auth, bcrypt
- **Database:** Supabase (PostgreSQL 15+) with Row-Level Security (RLS)
- **Real-time:** Socket.io 4.8
- **Payments:** Stripe (PCI DSS Level 1 via tokenization)
- **Notifications:** Twilio (SMS), SendGrid (email), Web Push
- **OCR:** Google Vision / Tesseract.js
- **Testing:** Jest (backend), Angular unit tests (frontend), Cypress (E2E)

**User Roles:** `driver`, `carrier`, `operator`, `attorney`, `admin`, `paralegal`

---

## 2. Quality Gates (Mandatory — No Exceptions)

Every code change MUST pass all four gates sequentially before merge.

### Gate 1: Architecture Alignment

All code must conform to the canonical documentation in `/docs/`:
- `01_COMPETITIVE_ANALYSIS.md` — Market positioning and differentiators
- `02_PERSONAS_AND_JOURNEYS.md` — User personas (Miguel, Sarah, James, Lisa)
- `03_BUSINESS_REQUIREMENTS.md` — Revenue model and business rules
- `04_FUNCTIONAL_REQUIREMENTS.md` — Feature specifications and acceptance criteria
- `05_UX_REQUIREMENTS.md` — Design principles, 3-click rule, mobile-first
- `06_TECHNICAL_REQUIREMENTS.md` — Stack decisions, security, performance targets
- `07_ROADMAP_AND_PRIORITIES.md` — Phase definitions and launch gates
- `HARD_BUGS_REGISTRY.md` — Known issues and their fixes (check before coding)

**Checks:**
- [ ] Feature aligns with a documented requirement or roadmap item
- [ ] Database changes follow `supabase_schema.sql` conventions (enums, RLS, indexes)
- [ ] API endpoints follow patterns in `docs/API_SPECIFICATION.md`
- [ ] UI follows 3-click rule, mobile-first, WCAG 2.1 AA
- [ ] No new external dependencies without explicit justification

### Gate 2: Test Coverage

- **Backend:** Every controller/service function has a Jest test in `backend/src/__tests__/`
- **Frontend:** Every component has a `.spec.ts` co-located test file
- **E2E:** Critical user flows have Cypress tests in `frontend/cypress/e2e/`
- **Database:** RLS policies have integration tests verifying role-based access
- **Target:** 100% feature coverage (every user-facing feature has at least one test)

#### Sprint Testing Mandate (Non-Negotiable)

For every sprint story, **every code file created or modified** MUST have a corresponding test file created or updated **within the same sprint**. This applies to:

- `backend/src/services/*.js` → `backend/src/__tests__/*.test.js`
- `backend/src/controllers/*.js` → `backend/src/__tests__/*.test.js`
- `frontend/src/**/*.component.ts` → co-located `*.component.spec.ts`
- `frontend/src/**/*.service.ts` → co-located `*.service.spec.ts`

**No sprint story is DONE until all files it touches have corresponding tests.** Stories are tracked in `sprints/sprint_XXX/`. Test scope belongs in the sprint's dedicated `story-X.Y-tests.md` file (create one if it doesn't exist). Use the `test-suite` skill to audit coverage before marking any story complete.

**Test Commands:**
```bash
# Backend
cd backend && npm test

# Frontend unit tests
cd frontend && npx ng test --no-watch

# E2E tests
cd frontend && npm run cy:run
```

### Gate 3: Critic Review

Before any PR or merge, the code MUST be reviewed by the critic agent (`.claude/agents/critic.md`) or equivalent human review covering:
- [ ] Security: No SQL injection, XSS, command injection, OWASP Top 10 violations
- [ ] RLS: Supabase policies correctly enforce multi-tenancy (drivers see only their data)
- [ ] DRY: No duplicated logic — extract shared utilities
- [ ] Performance: No N+1 queries, proper indexing, <200ms perceived response
- [ ] Accessibility: WCAG 2.1 AA, screen reader compatible, keyboard navigable
- [ ] Error handling: Graceful degradation, user-friendly messages, no stack traces in responses

### Gate 4: Human-in-the-Loop

The following actions REQUIRE explicit human approval — never automate silently:
- **Destructive operations:** `DROP TABLE`, `DELETE FROM` without WHERE, schema migrations
- **Deployments:** Any push to `main` branch, any production deployment
- **External API changes:** New third-party service integrations, API key rotations
- **Financial logic:** Payment processing changes, subscription pricing modifications
- **Data migrations:** Bulk data transformations, backfill scripts
- **Security changes:** RLS policy modifications, auth flow changes, CORS configuration
- **Git operations:** Force push, branch deletion, rebase of shared branches

---

## 3. Directory Structure

```
cdl-ticket-management/
├── CLAUDE.md                    # THIS FILE — project constitution
├── .claude/
│   ├── agents/                  # Specialized subagent definitions
│   │   ├── product-manager.md   # Requirement decomposition, prioritization, scoping
│   │   ├── architect.md         # System design, DB schema, architecture
│   │   ├── ux-expert.md         # UI/UX design, interaction flows, accessibility
│   │   ├── dev-lead.md          # Core implementation (Angular + Node.js)
│   │   ├── critic.md            # Security audit, code review, DRY enforcement
│   │   ├── qa-tester.md         # Automated test writing (Jest/Jasmine/Cypress)
│   │   ├── devops.md            # CI/CD, deployment, git workflow
│   │   └── docs-writer.md       # Documentation and requirement updates
│   ├── skills/                  # Reusable task sequences
│   │   ├── decompose-requirement.md # Break features into scoped user stories
│   │   ├── implement-feature.md # Full feature implementation pipeline
│   │   ├── security-audit.md    # Security review checklist
│   │   ├── db-migration.md      # Database migration workflow
│   │   ├── test-suite.md        # Test generation and execution
│   │   └── pr-workflow.md       # Branch, commit, PR creation
│   └── settings.local.json
├── frontend/                    # Angular 21 application
│   ├── src/app/
│   │   ├── core/                # Singleton services, interceptors, guards
│   │   ├── features/            # Role-based feature modules
│   │   │   ├── driver/          # Driver-facing features
│   │   │   ├── carrier/         # Fleet management features
│   │   │   ├── attorney/        # Attorney case management
│   │   │   ├── admin/           # Admin dashboard
│   │   │   ├── operator/        # Case manager features
│   │   │   └── shared/          # Cross-role components
│   │   ├── shared/              # Reusable components, pipes, directives
│   │   └── services/            # API communication services
│   ├── cypress/                 # E2E test specifications
│   └── .claude/CLAUDE.md        # Frontend-specific conventions
├── backend/
│   ├── src/
│   │   ├── controllers/         # Route handlers (thin — delegate to services)
│   │   ├── services/            # Business logic layer
│   │   ├── routes/              # Express route definitions
│   │   ├── middleware/          # Auth, error handling, validation
│   │   ├── migrations/         # Database migration files
│   │   ├── __tests__/          # Jest test files
│   │   ├── config/             # Database and app configuration
│   │   ├── socket/             # Socket.io event handlers
│   │   └── utils/              # Shared helpers
│   └── jest.config.js
├── supabase/                    # Supabase project configuration
│   └── migrations/              # Supabase migration files
├── docs/                        # Canonical project documentation
└── supabase_schema.sql          # Database schema reference
```

---

## 4. Code Conventions

### Frontend (Angular 21)

Refer to `frontend/.claude/CLAUDE.md` for detailed Angular conventions. Key rules:

- **Standalone components only** — no NgModules. Do NOT set `standalone: true` (default in Angular 21).
- **Signals for state** — use `signal()`, `computed()`, `effect()`. Use `update()` or `set()`, never `mutate`.
- **OnPush change detection** — always set `changeDetection: ChangeDetectionStrategy.OnPush`.
- **Native control flow** — use `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`).
- **Reactive forms** — never template-driven forms.
- **`input()` / `output()`** — not `@Input()` / `@Output()` decorators.
- **`inject()`** — not constructor injection.
- **`host` object** — not `@HostBinding` / `@HostListener`.
- **Lazy loading** — all feature routes are lazy-loaded.
- **WCAG 2.1 AA** — must pass all AXE checks. 44x44px touch targets. Keyboard navigable.
- **Mobile-first** — design for 4-inch screens first. Primary actions in bottom thumb zone.
- **NgOptimizedImage** — for all static images (not for inline base64).

### Backend (Node.js / Express 5)

- **Controllers are thin** — extract business logic into service files.
- **Consistent error responses:** `{ error: { code: 'ERROR_CODE', message: 'Human-readable message' } }`
- **Never expose stack traces** in production responses.
- **Validate at boundaries** — validate all request inputs in controllers/middleware.
- **Supabase client usage:**
  - `supabaseAdmin` (service role) for server-side operations
  - `supabaseAnon` for auth operations (prevents BUG-003: auth state pollution)
  - NEVER share a single client for both auth and data queries
- **JWT tokens** — 7-day expiry, include `role` claim. Verify with middleware.
- **Password hashing** — bcrypt with 10 salt rounds.
- **Generic auth errors** — never reveal if email exists ("Invalid credentials").

### Database (Supabase / PostgreSQL)

- **RLS on every table** — no exceptions. Test with different role contexts.
- **Enums for constrained values** — `user_role`, `case_status`, `violation_type`, `customer_type`.
- **UUID primary keys** — `gen_random_uuid()` default.
- **Timestamps** — `created_at` and `updated_at` with timezone on every table.
- **Indexes** — on all foreign keys and frequently-queried columns.
- **Naming:** snake_case for tables/columns, descriptive policy names in quotes.
- **Migrations** — sequential, never modify existing migrations, only add new ones.

---

## 5. Known Bugs & Pitfalls

Before writing any code, check `docs/HARD_BUGS_REGISTRY.md`. Critical patterns to avoid:

| Bug ID | Pattern to Avoid | Correct Approach |
|--------|-----------------|-------------------|
| BUG-001 | Missing public endpoint in auth interceptor | Always add unauthenticated endpoints to the allowlist |
| BUG-002 | `refreshTokenSubject.filter()` with no timeout | Add timeout + direct logout on failed refresh |
| BUG-003 | Shared Supabase client for auth + data | Use separate `supabaseAnon` for auth operations |
| BUG-004 | DB enum mismatch with API role values | Use role mapping function, keep enums in sync |
| BUG-005 | `/app/` prefix in navigation paths | Routes are `/driver/dashboard`, not `/app/driver/dashboard` |

---

## 6. Agent Orchestration Model

This project uses a **sequential pipeline with product management and critic review**, replacing the former CrewAI orchestration.

**Pipeline for any feature:**
```
0. Product Mgr → Decompose (trace to docs, break into stories, prioritize, get human sign-off)
1. Architect   → Design (schema + API contract + component tree per story)
2. UX Expert   → UX Review (interaction flows, mobile layout, accessibility, design tokens)
3. Dev Lead    → Implement (backend services + frontend components)
4. QA Tester   → Test (unit + integration + E2E tests)
5. Critic      → Review (security + DRY + performance + accessibility)
6. DevOps      → Ship (branch + commit + PR with human approval)
```

**Step 0 is mandatory.** No work begins until the Product Manager has decomposed the request into traceable, scoped user stories with acceptance criteria and the user has approved the breakdown.

**Step 2 is mandatory for any feature with UI.** The UX Expert reviews the Architect's design and produces screen specifications, component mappings, and accessibility checklists before the Dev Lead writes code. For backend-only changes, Step 2 can be skipped.

**Model Budget Assignments:**
| Agent | Model | Rationale |
|-------|-------|-----------|
| Product Mgr | sonnet | Requirement analysis across multiple docs needs strong reasoning |
| Architect | opus | Complex system design needs strongest reasoning |
| UX Expert | sonnet | Design reasoning against persona constraints and design system |
| Dev Lead | sonnet | Best balance of code quality and cost |
| Critic | sonnet | Deep analysis needed for security review |
| QA Tester | haiku | High-volume test generation, cost-effective |
| DevOps | haiku | Scripted workflows, low reasoning overhead |
| Docs Writer | haiku | Structured writing, templates available |

---

## 7. Performance Targets

| Metric | Target | How to Verify |
|--------|--------|---------------|
| First Contentful Paint | <1.5s on 4G | Lighthouse |
| Time to Interactive | <3s on 4G | Lighthouse |
| Lighthouse Mobile Score | >90 | `npx lighthouse` |
| API Response Time (p95) | <200ms | Load testing |
| Bundle Size (initial) | <300KB gzipped | `ng build --stats-json` |
| Accessibility Score | 100 | Lighthouse / AXE |

---

## 8. Security Checklist

Every code change must be evaluated against:

- [ ] **Input validation:** All user inputs sanitized and validated
- [ ] **SQL injection:** Use parameterized queries only (Supabase handles this)
- [ ] **XSS:** No `innerHTML` binding, sanitize user-generated content
- [ ] **CSRF:** Token validation on state-changing requests
- [ ] **Auth:** JWT verified on all protected routes, role checked
- [ ] **RLS:** New tables have RLS enabled with appropriate policies
- [ ] **Secrets:** No hardcoded API keys, tokens, or credentials in code
- [ ] **CORS:** Whitelist specific origins, no wildcard in production
- [ ] **Rate limiting:** Applied to auth endpoints and public APIs
- [ ] **File uploads:** Validate file types and sizes, scan for malware
- [ ] **Error messages:** Generic errors to users, detailed logs server-side

---

## 9. Git Workflow

- **Main branch:** `main` — production-ready code only
- **Feature branches:** `feat/<feature-name>` — one feature per branch
- **Bug fix branches:** `fix/<bug-description>`
- **Commit format:** Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`)
- **PR requirements:** All 4 quality gates passed, description includes what/why/how
- **Never force-push to main**
- **Never commit `.env` files, `node_modules/`, or build artifacts**
