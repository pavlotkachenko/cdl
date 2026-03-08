# Definition of Done — Checklist

> Machine-enforced by `.claude/scripts/verify-story.sh`.
> Human-readable reference for sprint story completion.

## Per-Story Checks

| # | Check | How It's Verified |
|---|-------|-------------------|
| 1 | All acceptance criteria checked | No `- [ ]` lines remain in story file |
| 2 | Story status is DONE | `**Status:** DONE` present in story file |
| 3 | Test coverage file complete | No `TODO` entries in `story-*-tests.md` |
| 4 | Backend tests pass | `cd backend && npm test` exits 0 |
| 5 | Frontend tests pass | `cd frontend && npx ng test --no-watch` exits 0 |
| 6 | Changes committed | No uncommitted tracked changes (warning only) |

## When to Run

- **Before marking a story DONE** — run manually:
  ```bash
  bash .claude/scripts/verify-story.sh sprints/sprint_XXX/story-ID-slug.md
  ```

- **Automatically on Stop** — the `.claude/hooks/verify-before-stop.sh` hook
  calls this logic when it detects active sprint work.

## Exit Codes

- `0` — All checks passed. Story is DONE.
- `1` — One or more checks failed. Fix and re-run.

## Notes

- Warnings (e.g., missing test file, no checkbox lines) do NOT cause failure
  but should be investigated.
- The Stop hook uses a guard to prevent infinite loops — it runs verification
  once per session. If it fails, Claude sees the message and can act, but
  subsequent stops pass through.
