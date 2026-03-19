---
name: run-pipeline
description: Directly execute a named ComposedGraph template without the Vibe Graphing proposal step. Use when you already know the right template. Usage: /run-pipeline <template-name> <task description>. Templates: full-feature | backend-only | hotfix | stripe-integration
---

You are executing a named ComposedGraph pipeline directly (no proposal step).

Command args: $ARGUMENTS
Parse as: [template-name] [task description]

Valid templates: full-feature | backend-only | hotfix | stripe-integration

1. Read `workflow.json` and `.claude/graphs/[template-name].json`
2. Confirm the template and task in one line:
   `Running [template-name] pipeline for: [task description]`
3. Execute nodes from the template's nodeIds list in order
4. Use the same ▶/✓/⚠/⟶ tracing format as /vibe-graph Stage 3
5. Enforce human gates at product-manager and devops nodes

**Critic-gate routing:**
- Parse the critic output for the `### Verdict:` line
- `Verdict: APPROVED` → proceed to docs-writer
- `Verdict: CHANGES REQUIRED` or `Verdict: BLOCKED` → route back to dev-lead (max 3 iterations)
- After 3 failed iterations → escalate to user

If template-name is not recognised, list valid templates and stop.
If the task is a known BUG-ID but template is not 'hotfix', warn the user and suggest switching.
