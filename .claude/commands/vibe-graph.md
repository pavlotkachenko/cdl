---
name: vibe-graph
description: Compile a plain-English task into a workflow graph using the CDL project pipeline, review it with the user, then execute node-by-node. Usage: /vibe-graph <task description>
---

You are executing **Vibe Graphing** for the CDL ticket attorney management system.

User intent: $ARGUMENTS

---

## Stage 1 — Analyse (read before generating any output)

Read silently:
1. `CLAUDE.md` — Section 2 (Quality Gates), Section 6 (Pipeline), Section 5 (Bug Registry)
2. `workflow.json` — all node definitions, escalation loops, ComposedGraphs
3. `claude-progress.txt` — what was last worked on and current branch
4. `sprints/` — latest sprint overview to understand current priorities

Then determine the right ComposedGraph:

| Condition | Template |
|---|---|
| Angular UI + Node.js/Supabase | `full-feature` |
| Node.js/Supabase only, no UI | `backend-only` |
| Known BUG-ID in HARD_BUGS_REGISTRY.md, < 50 lines | `hotfix` |
| Stripe/payments/webhooks | `stripe-integration` |
| None of the above | Describe custom node selection |

---

## Stage 2 — Show Proposed Workflow (before executing ANYTHING)

Present this exact format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VIBE GRAPH PROPOSAL: [Feature Name]
Template: [full-feature | backend-only | hotfix | stripe-integration | custom]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NODES (execution order):
  ⬡  Step 0 · product-manager  ⚠ HUMAN GATE
             → [what stories it will decompose, which docs/ files it will trace]
  ⬡  Step 1 · architect
             → [schema changes, API endpoints, component tree]
  ⬡  Step 2 · ux-expert        (or SKIPPED — backend-only)
             → [screen specs, accessibility checklist]
  ⬡  Step 3 · dev-lead
             → [files to create/modify: backend/src/..., frontend/src/...]
  ⬡  Step 4 · qa-tester
             → [Jest tests, .spec.ts files, Cypress flows to write]
  ⬡  Step 5 · critic
             → [security focus: RLS isolation, OWASP, Stripe webhooks if applicable]
  ◈  Switch · critic-gate
             → PASS (Verdict: APPROVED) → docs-writer | FAIL → dev-lead (max 3 loops)
  ⬡  Step 6 · docs-writer
             → [docs/ files to update: API_SPECIFICATION.md, sprint stories, bug registry]
  ⬡  Step 7 · devops           ⚠ HUMAN GATE
             → branch: feat/[name], commit: feat: [description]

QUALITY GATES:
  ✓ Gate 1: Architecture alignment (docs/ + supabase_schema.sql conventions)
  ✓ Gate 2: Sprint Testing Mandate (every modified file gets a test)
  ✓ Gate 3: Critic Verdict: APPROVED (max 3 iterations before user escalation)
  ✓ Gate 4: Human approval at product-manager (Step 0) and devops (Step 7)

ESCALATION LOOPS:
  critic-gate FAIL → dev-lead → qa-tester → critic → critic-gate (max 3x)
  [Add others if relevant: ux_rejection, test_failure]

EDGE MESSAGES:
  product-manager → architect:  [one-line instruction payload]
  architect → ux-expert:        [design handoff]  (or SKIPPED)
  ux-expert → dev-lead:         [screen specs + component mappings]
  dev-lead → qa-tester:         [list of modified files]
  qa-tester → critic:           [test coverage summary]
  critic → critic-gate:         [Verdict: APPROVED | CHANGES REQUIRED | BLOCKED]
  critic-gate → docs-writer:    [feature summary for docs update]
  docs-writer → devops:         [ready signal + branch/commit spec]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then ask: **"Does this look right? Say 'run it', or describe what to change."**

---

## Stage 3 — Execute (ONLY after explicit user confirmation)

For each node in order:

**Standard nodes:**
```
▶  [step] · [node-id]  starting...
✓  [step] · [node-id]  done → [one-line summary of output]
```

**Human Gate nodes (product-manager, devops):**
```
⚠  HUMAN GATE · [node-id]
   [Show full output from the node]
   Reply 'approved' to continue, or describe changes needed.
```
→ WAIT for explicit 'approved' before proceeding.

**Switch nodes (critic-gate):**
- Parse the critic output for the `### Verdict:` line
- **APPROVED:**  `   ⟶  PASS (Verdict: APPROVED) → docs-writer`
- **CHANGES REQUIRED:**  `   ⟶  FAIL (Verdict: CHANGES REQUIRED, iteration: N/3) → dev-lead`
- **BLOCKED:**  `   ⟶  FAIL (Verdict: BLOCKED, iteration: N/3) → dev-lead`
- Iteration 3 fail:  `   ⟶  Max iterations reached — escalating to user`

**On completion:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WORKFLOW COMPLETE: [Feature Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Steps executed: [✓ or ⚠ for each]
Files created:  [list]
Files modified: [list]
Tests added:    [list]
Docs updated:   [list]
Branch:         feat/[name]
Critic verdict: [APPROVED]
PR ready:       [yes | pending human approval]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then update `claude-progress.txt` with current state.
Run `.claude/scripts/verify-story.sh` on the relevant sprint story file.
