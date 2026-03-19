# Story UP-5 — Messages Emoji Icon Replacement

## Status: DONE

## Description
Add emoji icons to the Messages component's inline template — filter tabs, conversation group labels, chat header roles, and toolbar buttons.

## Files Modified
- `frontend/src/app/features/driver/messages/messages.component.ts` (inline template)

## Key Changes
- Filter tabs: speech bubble (All), scales (Attorneys), target (Support), bell (Unread)
- Group labels: scales (Active Cases), target (Support & Operations), lock (Closed Cases)
- Chat header roles: scales (Defense Attorney), target (Case Coordinator), speech bubble (Support Agent)
- Toolbar buttons: paperclip (attach), document (files), lock (close conversation)

## Acceptance Criteria
- [x] All filter tabs prefixed with relevant emoji
- [x] Conversation group labels include emoji
- [x] Chat header shows role-appropriate emoji
- [x] Toolbar action buttons use emoji instead of mat-icons
- [x] Build compiles cleanly
