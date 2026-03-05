Great question. Let me give you a practical, step-by-step playbook for how to actually use this system day-to-day.




---



How to Work With Your New Claude Code Agent Team


The Short Version



Every time you want to build something, you follow this pattern:



PLAINTEXT
You → Tell Claude what you want → PM decomposes → You approve stories → Claude builds each one



---



Step-by-Step: Your First Feature Build



Step 1: Open Claude Code in the project directory



BASH
cd /Users/paveltkachenko/prj/cdl-ticket-management
claude



Claude reads CLAUDE.md automatically and knows the entire project constitution, all agents, all skills.




Step 2: Request a feature using the PM agent




Pick a feature from your roadmap. For example, if you're working on MVP completion:



PLAINTEXT
As the product-manager, decompose the "payment plans UI" feature into implementable stories



Claude (as PM) will:

Read all your /docs/ files
Trace the feature to 04_FUNCTIONAL_REQUIREMENTS.md
Identify persona (Miguel — driver, low tech, mobile)
Break it into 3-5 small stories with acceptance criteria
Present the breakdown to you



Step 3: Review and approve the stories




You'll see something like:



PLAINTEXT
Story 1: Create payment_plans table + RLS policies
Story 2: Build POST /api/payments/plans endpoint
Story 3: Build PaymentPlanSelectorComponent (mobile-first)
Story 4: Wire Stripe payment intent with plan selection
Story 5: Add Jest + Cypress tests for payment flow



You say: "Approved, start with Story 1" or "Cut Story 4 for now, we'll do Stripe later"




Step 4: Claude executes the pipeline per story




For each story you approve, Claude runs the full pipeline:



PLAINTEXT
Architect  → designs schema/API
UX Expert  → reviews mobile layout, 3-click rule, accessibility
Dev Lead   → writes backend code, then frontend code
QA Tester  → writes tests
Critic     → reviews for security/DRY/performance
DevOps     → creates branch + PR → waits for YOUR approval



You just watch the progress and approve the PR at the end.




Step 5: Repeat for next story



PLAINTEXT
"Proceed with Story 2"



---



Practical Commands for Common Situations



Starting your day — check project status:

PLAINTEXT
Run all tests and report results



Working on a specific bug:

PLAINTEXT
Fix the auth interceptor hang described in BUG-002 in HARD_BUGS_REGISTRY.md

(No need for the full PM pipeline for bug fixes — Dev Lead handles directly)




Reviewing existing code for issues:

PLAINTEXT
As the critic, review the entire auth flow — controllers, services, middleware, and RLS policies



Improving UX of an existing screen:

PLAINTEXT
As the ux-expert, review the driver ticket submission flow for mobile usability and 3-click compliance



Adding a database table:

PLAINTEXT
Create a migration for adding the court_dates table with RLS policies



Shipping completed work:

PLAINTEXT
Create a PR for this work



---



Recommended Implementation Order



Based on your roadmap (docs/07_ROADMAP_AND_PRIORITIES.md), here's what I'd suggest tackling first:




Phase 1 — MVP Completion (your current focus)




Start with the features marked Must-Have that are not yet complete. Ask the PM to decompose each one:



PLAINTEXT
1. "As the product-manager, decompose the remaining MVP must-haves into stories"



This will audit what's built vs what's missing and produce a prioritized backlog.




Phase 2 — Test Coverage Gap




Your backend has only 2 test files. The QA agent can bulk-generate tests:



PLAINTEXT
2. "As the qa-tester, write Jest tests for all backend services that don't have tests yet"



Phase 3 — Security Hardening




Before any production deployment:



PLAINTEXT
3. "Run a full security audit"



Phase 4 — V1 Revenue Features




Then move into the V1 roadmap items (payment plans, subscription management, analytics dashboard).




---



Key Principles for Working With the Agents


Always start with the PM for new features — it prevents scope creep and ensures traceability


Bug fixes and small changes skip the PM — go directly to the Dev Lead:
PLAINTEXT
   "Fix the carrier registration enum mismatch (BUG-004)"
   


You are Gate 4 — Claude will never merge or deploy without your explicit approval


You can invoke any agent directly when you need focused work:
PLAINTEXT
   "As the architect, ..."
   "As the ux-expert, ..."
   "As the critic, ..."
   


One story = one branch = one PR — keeps changes small and reviewable


If Claude asks a question, answer it — the PM and UX agents are designed to surface ambiguity rather than guess



---



Ready to Start?



My recommendation for your very first command:



PLAINTEXT
As the product-manager, audit the current codebase against docs/07_ROADMAP_AND_PRIORITIES.md 
and tell me what MVP must-haves are complete vs still missing



This gives you a clear picture of where you stand and produces a prioritized list of stories to work through. Want me to run that now?