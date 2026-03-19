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

### Step 3b: Hidden Requirements Analysis

Before decomposing into stories, perform a **hidden requirements audit** on any provided design templates, mockups, or HTML prototypes:

#### Data Layer Gaps
- Compare every form field in the template against the DB schema (`supabase_schema.sql`)
- Flag fields that exist in the UI but have **no corresponding DB column**
- Flag fields that exist in the UI but are **not accepted by the backend API**
- Check enum values in the template against DB enum definitions — flag mismatches
- Identify **conditional fields** (fields shown/hidden based on other field values) and their backend implications

#### API Contract Gaps
- Compare the template's form submission to the backend `createX` / `updateX` endpoint
- Flag payload fields the backend doesn't accept or validate
- Identify **field name mismatches** (camelCase vs snake_case, `description` vs `violation_details`)
- Check if the template implies new API capabilities not yet built

#### Asset & Icon Inventory
- Catalog every icon used in the template (SVG inline, emoji, icon font references)
- Check which icons exist in `frontend/src/assets/icons/` — flag missing ones
- For templates using inline SVGs, create a story to extract them into reusable Angular components or the project icon system
- Flag any images, logos, or illustrations referenced but not in the codebase

#### Integration Points
- Does the template assume data from services not yet connected? (e.g., OCR results populating fields)
- Does the template show real-time updates that require Socket.io integration?
- Does the template reference third-party services (Stripe, maps, autocomplete)?

#### Stale File Detection
- Check if the component has both inline template (in `.ts`) and external template (`.html`) — flag the stale one
- Check for `.backup`, `.bak`, or duplicate files in the same directory

**Output:** A "Hidden Requirements" section in the Product Brief listing every gap found, with each gap assigned to a story.

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

### Step 7: Write Sprint Files (Mandatory — do this immediately after approval)

Once the user approves the product brief:

1. **Determine the next sprint number:**
   ```bash
   ls sprints/ | sort | tail -1
   # Increment by 1 → sprint_XXX
   ```

2. **Create the sprint folder and files:**
   - `sprints/sprint_XXX/story-sprint-overview.md` — sprint goal, story index table, Definition of Done, dependencies
   - One `sprints/sprint_XXX/story-<PREFIX>-<N>-<title>.md` per story in the product brief

   **File naming rules:**
   - Sprint prefix: 2–3 uppercase letters that abbreviate the feature (e.g., `PP` for Payment Plans, `LH` for Launch Hardening, `CA` for Carrier Analytics)
   - Story file name: `story-<PREFIX>-<N>-<short-title>.md` (e.g., `story-PP-1-backend.md`)

3. **Each story file MUST contain:**
   - Story title, sprint number, priority, status (`TODO`)
   - User story (As / I want / So that)
   - Scope: what files to create or modify (specific paths)
   - Acceptance criteria (checkboxes)
   - Test Coverage Matrix (source file → expected test file, `❌ create` or `❌ update`)

**This step is not optional.** A sprint with no story files on disk is incomplete. The `implement-feature` pipeline requires the story file to exist before work begins.

## Output

1. A Product Brief presented to the user (in conversation)
2. **Physical files written to disk:**
   - `sprints/sprint_XXX/story-sprint-overview.md`
   - `sprints/sprint_XXX/story-<PREFIX>-<N>-<title>.md` (one per story)

## Connection to Other Skills

This skill feeds into the `implement-feature` pipeline:

```
decompose-requirement  →  implement-feature (per story)
       ↑                        ↓
   User request         Architect → Dev Lead → QA → Critic → DevOps
```

For large features with multiple stories, run `implement-feature` once per story in dependency order.
