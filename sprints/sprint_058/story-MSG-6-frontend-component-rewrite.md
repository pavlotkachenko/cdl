# Story MSG-6: Frontend — Rewrite messages.component.ts with Two-Panel Layout

## Status: DONE

## Description
Complete rewrite of the driver messages component to match the provided HTML template design. This is the largest story in the sprint.

## UI Specification (from HTML Template)

### Layout
- **Two-panel grid**: `grid-template-columns: 320px 1fr`
- Left panel: conversation list with search, filter tabs, grouped conversations
- Right panel: active chat with header, case context strip, messages, input area
- Full height: `height: calc(100vh - 60px)` (below topbar)

### Left Panel — Conversation List
1. **Header**: "Messages" title with unread count badge, "+" new conversation button
2. **Search**: Input field to search conversations
3. **Filter tabs**: All | Attorneys | Support | Unread (toggle active state)
4. **Conversation groups**:
   - "Active Cases" — conversations with `conversation_type: 'attorney_case'` and no `closed_at`
   - "Support & Operations" — conversations with `conversation_type: 'operator' | 'support'`
   - "Closed Cases" — conversations with `closed_at` set (dimmed at 65% opacity)
5. **Conversation item**: Avatar (role-colored) + online dot + name + time + preview + case tag + unread badge
   - Active item: teal background + right border
   - Unread item: bold name, colored preview

### Right Panel — Active Chat
1. **Chat header**: Avatar + name + online status + role info + case tag + action buttons (call, view case, more)
2. **Case context strip**: Green bar showing linked case info (case number, violation, status, "View Case" link)
3. **Messages area**: Scrollable, with:
   - Date separators (line + label + line)
   - System messages (centered, gray background)
   - Sender messages (left-aligned, white bubble, sender avatar + name + role badge)
   - My messages (right-aligned, teal gradient bubble)
   - Message footer: time + read status
   - Attachment blocks (file icon + name + size + download icon)
   - Typing indicator (bouncing dots + "X is typing...")
4. **Input area**: Toolbar (attach, upload, emoji, encryption note) + textarea + send button

### Avatar Color Mapping
| Role | Gradient |
|------|----------|
| Attorney | `#3b82f6 → #1d4ed8` (blue) |
| Operator | `#8b5cf6 → #6d28d9` (purple) |
| Support | `#f59e0b → #d97706` (amber) |
| System / Closed | `#6b7280 → #374151` (gray) |

### Case Tag Colors
| Type | Background | Color | Border |
|------|-----------|-------|--------|
| Attorney | `#eff6ff` | `#3b82f6` | `#bfdbfe` |
| Operator | `#f5f3ff` | `#8b5cf6` | — |
| Support | `#fffbeb` | `#f59e0b` | — |
| Closed | `#edf2f6` | `#98a8b4` | — |

## Component Architecture

### Signals
```typescript
conversations = signal<Conversation[]>([]);
messages = signal<Message[]>([]);
selectedConv = signal<Conversation | null>(null);
loadingConvs = signal(true);
loadingMsgs = signal(false);
sending = signal(false);
convError = signal('');
typingIndicator = signal(false);
attachedFile = signal<File | null>(null);
activeTab = signal<'all' | 'attorneys' | 'support' | 'unread'>('all');
searchQuery = signal('');
```

### Computed
```typescript
totalUnread = computed(() => conversations().reduce((sum, c) => sum + (c.unread_count ?? 0), 0));
filteredConversations = computed(() => {
  // Filter by activeTab + searchQuery
  // Group into: activeCases, supportOps, closedCases
});
activeCaseConvs = computed(...);
supportConvs = computed(...);
closedConvs = computed(...);
```

### Key Methods
- `otherParty(conv)` — returns the non-driver participant User object
- `avatarClass(conv)` — returns 'attorney' | 'operator' | 'support' | 'system'
- `caseTagClass(conv)` — returns tag CSS class
- `caseTagLabel(conv)` — returns tag text like "Attorney · #0847"
- `senderName(msg)` — returns sender display name
- `senderRole(msg)` — returns role label for badge
- `senderAvatarClass(msg)` — returns avatar color class for message sender

### Template Structure
```
<div class="messages-layout">
  <!-- Left Panel -->
  <div class="conv-panel">
    <header>...</header>
    <filter-tabs>...</filter-tabs>
    <conv-list>
      @for group of groups
        <group-label>
        @for conv of group.conversations
          <conv-item>
    </conv-list>
  </div>

  <!-- Right Panel -->
  @if (selectedConv()) {
    <div class="chat-panel">
      <chat-header>
      <case-context-strip>
      <chat-messages>
        @for msg of messages()
          <date-sep> / <system-msg> / <msg-group mine|theirs>
      </chat-messages>
      <chat-input-area>
    </div>
  } @else {
    <div class="empty-state">
      Select a conversation to start messaging
    </div>
  }
</div>
```

## Styles
- All styles from the HTML template converted to component CSS
- Use CSS custom properties for design tokens
- Responsive: on mobile (<768px), show only one panel at a time

## Accessibility
- `role="list"` on conversation list
- `role="listitem"` on conversation items with `tabindex="0"` and keyboard handlers
- `role="log" aria-live="polite"` on messages area
- `aria-label` on all interactive elements
- Focus management when switching between panels

## Acceptance Criteria
- [ ] Two-panel layout matches HTML template
- [ ] Conversation list shows grouped conversations (Active Cases, Support, Closed)
- [ ] Filter tabs work (All, Attorneys, Support, Unread)
- [ ] Search filters conversations by name
- [ ] Clicking a conversation opens the chat panel with messages
- [ ] Chat header shows other party info with role-based avatar
- [ ] Case context strip shows for attorney_case conversations
- [ ] Messages render with correct alignment (mine=right, theirs=left)
- [ ] Date separators appear between different days
- [ ] Typing indicator shows bouncing dots
- [ ] Send area has toolbar icons and encryption note
- [ ] Keyboard navigation works throughout
- [ ] No accessibility violations (axe-core)

## Files to Modify
- `frontend/src/app/features/driver/messages/messages.component.ts` (rewrite)
