# Skill: Decompose Requirement

Break a high-level feature request into scoped, prioritized, traceable user stories ready for the Architect. This is the entry point for all new work.

## Trigger

Use when:
- User requests a new feature ("build fleet management", "add payment plans")
- User references a roadmap phase ("implement V1 features")
- User provides a vague or broad request that needs scoping
- Before starting the implement-feature pipeline — this skill runs FIRST

## Pipeline Steps

### Step 1: Read All Requirement Documents

Read these files to build full context:

```
docs/02_PERSONAS_AND_JOURNEYS.md
docs/03_BUSINESS_REQUIREMENTS.md
docs/04_FUNCTIONAL_REQUIREMENTS.md
docs/05_UX_REQUIREMENTS.md
docs/07_ROADMAP_AND_PRIORITIES.md
docs/HARD_BUGS_REGISTRY.md
```

### Step 2: Trace the Request

Answer:
1. Which doc(s) define this feature?
2. Which persona(s) does it serve?
3. Which roadmap phase is it in?
4. What's the MoSCoW priority?
5. What existing features does it depend on?

**If the request can't be traced to any doc:** Stop and flag it to the user. Ask whether to add it to the requirements or defer it.

### Step 3: Check What Already Exists

Before decomposing, scan the codebase:

- Check `backend/src/routes/` for existing API endpoints
- Check `frontend/src/app/features/` for existing components
- Check `backend/src/migrations/` for existing schema
- Check `supabase_schema.sql` for existing tables

Don't write stories for things that are already built.

### Step 4: Decompose into Stories

Using the Product Manager agent's story template, break the feature into the smallest independently deliverable pieces. Each story should:

- Be completable in one branch/PR
- Touch no more than 5 files
- Have 2+ acceptance criteria
- Map to a named persona
- Reference a specific doc section
- Include technical scope (DB/Backend/Frontend/Tests)

### Step 5: Order by Dependencies

Produce a batched implementation order:
- Batch 1: Stories with no dependencies (can start immediately)
- Batch 2: Stories that depend on Batch 1
- Batch 3: Stories that depend on Batch 2

### Step 6: Present for Approval

Show the full product brief to the user and ask:
1. Is the scope correct? Anything missing or out of scope?
2. Is the priority order correct?
3. Are there any stories you want to defer or cut?
4. Any open questions that need answering before the Architect starts?

**Wait for user approval before passing to the Architect.**

## Output

A complete Product Brief following the format defined in `.claude/agents/product-manager.md`, containing:
- Requirement tracing
- Numbered user stories with acceptance criteria
- Implementation order (batched by dependencies)
- Out-of-scope list
- Risks and open questions

## Connection to Other Skills

This skill feeds into the `implement-feature` pipeline:

```
decompose-requirement  →  implement-feature (per story)
       ↑                        ↓
   User request         Architect → Dev Lead → QA → Critic → DevOps
```

For large features with multiple stories, run `implement-feature` once per story in dependency order.
