# Migration Guide: CrewAI → Claude Code Agent Teams

> **From:** CrewAI orchestration (`cdl-pod-center/pod_manager.py`)
> **To:** Native Claude Code with CLAUDE.md + Agents + Skills

---

## Why This Migration

| Dimension | CrewAI (Before) | Claude Code (After) |
|-----------|----------------|---------------------|
| **Setup** | Python venv, pip install crewai, API keys for 5+ services | Zero setup — Claude Code reads CLAUDE.md natively |
| **Context** | Limited to ~4K-8K tokens per agent, lossy task chaining | Full project context — reads entire codebase directly |
| **Tool access** | Custom ShellTool, FileReadTool, FileWriterTool wrappers | Native file read/write/edit, bash, grep, glob — built in |
| **Iteration** | Fixed max_iter (8-12), retry on failure, then give up | Interactive — can ask clarifying questions mid-task |
| **Cost** | Each agent call = separate LLM API call with prompt overhead | Single session, agents are prompt instructions not API calls |
| **Human oversight** | `human_input=True` on one task only | Built-in permission system + Gate 4 for all critical actions |
| **Memory** | `memory=False` (no persistence between runs) | CLAUDE.md persists across every session |
| **Debugging** | Read CrewAI verbose logs, trace agent decisions | Interactive conversation — see what's happening in real time |

---

## What Changed (Mapping Table)

### CrewAI Agents → Claude Code Agents

| CrewAI Agent | Claude Code Agent | File |
|---|---|---|
| `product_manager` | `product-manager` | `.claude/agents/product-manager.md` |
| `roadmap_planner` | `product-manager` | `.claude/agents/product-manager.md` |
| `solution_architect` | `architect` | `.claude/agents/architect.md` |
| `software_engineer` | `dev-lead` | `.claude/agents/dev-lead.md` |
| `db_engineer` | `architect` (design) + `dev-lead` (implement) | Combined |
| `backend_engineer` | `dev-lead` | `.claude/agents/dev-lead.md` |
| `frontend_engineer` | `dev-lead` | `.claude/agents/dev-lead.md` |
| *(new — no CrewAI equivalent)* | `ux-expert` | `.claude/agents/ux-expert.md` |
| `qa_engineer` | `critic` | `.claude/agents/critic.md` |
| `integration_tester` | `qa-tester` | `.claude/agents/qa-tester.md` |
| `devops` | `devops` | `.claude/agents/devops.md` |
| `documentation_specialist` | `docs-writer` | `.claude/agents/docs-writer.md` |

### CrewAI Tools → Claude Code Native Tools

| CrewAI Tool | Claude Code Equivalent |
|---|---|
| `FileReadTool` | Built-in `Read` tool (reads any file, no wrapper needed) |
| `FileWriterTool` | Built-in `Write` / `Edit` tools |
| `CodeInterpreterTool` | Built-in `Bash` tool (runs any command) |
| `ShellTool` (custom) | Built-in `Bash` tool |
| `GithubToolkit` | `gh` CLI via `Bash` tool |
| `Composio` (GitHub) | `gh` CLI via `Bash` tool (simpler, no extra API key) |

### CrewAI Task Sequences → Claude Code Skills

| CrewAI Workflow | Claude Code Skill | File |
|---|---|---|
| Product Manager requirement decomposition | `decompose-requirement` | `.claude/skills/decompose-requirement.md` |
| 5-task feature pipeline (requirements → design → implement → test → deploy) | `implement-feature` | `.claude/skills/implement-feature.md` |
| QA validation task | `security-audit` | `.claude/skills/security-audit.md` |
| Database migration task | `db-migration` | `.claude/skills/db-migration.md` |
| Integration testing task | `test-suite` | `.claude/skills/test-suite.md` |
| Git push + PR task | `pr-workflow` | `.claude/skills/pr-workflow.md` |

---

## How to Use the New System

### Daily Workflow

1. **Open Claude Code** in the `cdl-ticket-management/` directory
2. Claude automatically reads `CLAUDE.md` and understands the entire project
3. Give instructions in natural language:

```
"Build the payment plans feature"
```

Claude will:
- **Decompose** the request into scoped user stories against your docs (product-manager role)
- **Present the breakdown** and wait for your approval
- For each approved story:
  - Design the schema + API + components (architect role)
  - Review UX: interaction flows, mobile layout, 3-click rule, accessibility (ux-expert role)
  - Implement backend then frontend (dev-lead role)
  - Write tests (qa-tester role)
  - Run a critic review (critic role)
  - Create a PR for your approval (devops role)

### Using Specific Agents

When you want focused work from a specific agent's perspective:

```
"As the architect, design the database schema for the fleet management feature"
```

```
"As the ux-expert, review the ticket submission flow for mobile usability"
```

```
"As the critic, review the auth controller for security issues"
```

```
"As the qa-tester, write Jest tests for the payment service"
```

### Using Skills

Skills are multi-step workflows you can invoke:

```
"Run the implement-feature skill for ticket OCR"
→ Executes the full 7-step pipeline

"Run a security audit"
→ Executes the security-audit skill

"Create a migration for adding the court_dates table"
→ Executes the db-migration skill

"Write tests for the messaging feature"
→ Executes the test-suite skill

"Ship this — create a PR"
→ Executes the pr-workflow skill
```

### Quality Gates in Practice

Every feature automatically passes through 4 gates:

```
Gate 1 (Architecture): "Does this align with the docs?"
  → Claude checks /docs/ before writing code

Gate 2 (Tests): "Do all tests pass?"
  → Claude runs jest, ng test, cypress

Gate 3 (Critic): "Is this secure, DRY, performant, accessible?"
  → Claude reviews its own code with the critic checklist

Gate 4 (Human): "Do you approve this PR?"
  → Claude stops and asks YOU before merge/deploy
```

---

## What You Can Retire

### Services No Longer Needed

| Service | Why Not Needed |
|---|---|
| **Composio** | Claude Code has native `gh` CLI access — no wrapper needed |
| **E2B Sandbox** | Claude Code runs in your local environment directly |
| **LangChain** | No chain orchestration needed — Claude handles sequencing natively |
| **Ollama embeddings** | No RAG needed — Claude reads source files directly |
| **DeepSeek API** | Claude handles all roles — model routing is via agent definitions |
| **OpenAI API** | Not needed as fallback |

### API Keys You Can Remove

From your workflow (keep in project `.env` for runtime features):
- `COMPOSIO_API_KEY` / `COMPOSIO_API_KEY2`
- `E2B_API_KEY`
- `LANGCHAIN_PROJECT_API_KEY`
- `DEEPSEEK_API_KEY`
- `OPENAI_API_KEY`
- `RAG_EMBEDDER_*` settings

**Keep:**
- `ANTHROPIC_API_KEY` (for Claude Code)
- `GITHUB_TOKEN` / `GITHUB_PERSONAL_ACCESS_TOKEN` (for `gh` CLI)
- All Supabase, Stripe, Twilio, SendGrid keys (runtime dependencies)

### Files You Can Archive

The entire `cdl-pod-center/` directory can be archived. It's fully replaced by:
- `CLAUDE.md` (project constitution)
- `.claude/agents/` (agent definitions)
- `.claude/skills/` (workflow templates)

---

## Cost Comparison

### Before (CrewAI)

A typical 5-agent feature pipeline:
- 5 separate LLM API calls with full prompt + context per agent
- Each agent re-reads project context (~2K-4K input tokens overhead)
- Tool calls (file read, shell) add roundtrips
- Estimated: ~50K-100K tokens per feature pipeline
- Plus: Composio, E2B, LangChain subscription costs

### After (Claude Code)

Same feature pipeline:
- 1 session with persistent context
- CLAUDE.md loaded once (~4K tokens)
- Agent definitions referenced as needed (~1K tokens each)
- No tool-call overhead (native access)
- Estimated: ~30K-60K tokens per feature pipeline
- No additional service subscriptions

**Estimated savings: 40-50% on LLM costs + elimination of ancillary service fees.**

---

## Quick Reference: Your New Commands

| What You Want | What to Say |
|---|---|
| Scope and plan a feature | "As the product-manager, decompose [feature] into stories" |
| Build a feature end-to-end | "Implement [feature] following the full pipeline" |
| Design before building | "As the architect, design [feature]" |
| Review UX/mobile usability | "As the ux-expert, review [feature/flow] for mobile usability" |
| Just write code | "As the dev-lead, implement [specific change]" |
| Write tests | "Write tests for [feature/component/service]" |
| Security review | "Run a security audit on [scope]" |
| Code review | "As the critic, review [files/feature]" |
| Create database migration | "Create a migration for [change]" |
| Ship to GitHub | "Create a PR for this work" |
| Check project health | "Run all tests and report results" |
| Update docs | "Update the API docs for the new [endpoints]" |
