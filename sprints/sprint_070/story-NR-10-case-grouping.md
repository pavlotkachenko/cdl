# Story: NR-10 — Case Grouping

**Sprint:** sprint_070
**Priority:** P1
**Status:** DONE

## User Story

As a driver,
I want multiple notifications about the same case collapsed into a single stacked card,
so that my notification list is not cluttered with repeated case updates.

## Acceptance Criteria

- [x] Notifications sharing the same `related_case_id` are collapsed into a single stacked card
- [x] The stacked card shows an "N updates" badge (e.g., "3 updates")
- [x] The most recent notification in the group is displayed as the primary/visible notification
- [x] Clicking the stacked card expands to show all individual notification items in the group
- [x] Clicking again collapses the group back to the stacked view
- [x] Grouped items share the case's left-bar color (based on the most recent notification's type)
- [x] Expand/collapse state is tracked per group
- [x] Notifications without a `related_case_id` (or with unique case IDs) are displayed as individual items
- [x] Grouping works within each date section (a case can have groups in "Today" and "Yesterday" separately)

## Technical Notes

- Add an `expandedGroups` signal of type `signal<Set<string>>` to track which case groups are expanded
- Toggle expand: `expandedGroups.update(set => { const next = new Set(set); next.has(id) ? next.delete(id) : next.add(id); return next; })`
- Grouping logic runs after date grouping — within each date group, further group by `related_case_id`
- The stacked card visual can use a subtle layered shadow effect to indicate multiple items
- The "N updates" badge uses the same pill styling as other badges in the design system
- Expanded items should animate in with the `slideIn` animation from NR-7
