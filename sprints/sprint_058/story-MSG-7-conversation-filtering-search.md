# Story MSG-7: Frontend — Conversation Filtering & Search

## Status: DONE

## Description
Implement the filter tabs (All, Attorneys, Support, Unread) and the search input to narrow down the conversation list in the left panel. This logic is driven by computed signals in the component.

## Dependencies
- MSG-5 (updated types with `conversation_type`, `unread_count`)
- MSG-6 (two-panel layout with filter tab UI)

## Implementation

### Filter Tabs
The `activeTab` signal controls which conversations are shown:

| Tab | Filter Logic |
|-----|-------------|
| `all` | Show all conversations (no filter) |
| `attorneys` | `conversation_type === 'attorney_case'` |
| `support` | `conversation_type === 'operator' \|\| conversation_type === 'support'` |
| `unread` | `unread_count > 0` |

### Search
The `searchQuery` signal filters by the other party's `full_name` (case-insensitive substring match). Search is combined with the active tab filter (AND logic).

### Grouping
After filtering, conversations are grouped into three sections:

1. **Active Cases** — `conversation_type === 'attorney_case'` AND `closed_at` is null
2. **Support & Operations** — `conversation_type === 'operator'` OR `conversation_type === 'support'`
3. **Closed Cases** — `closed_at` is not null

Each group only renders if it has conversations after filtering.

### Computed Signals
```typescript
filteredConversations = computed(() => {
  let convs = this.conversations();
  const tab = this.activeTab();
  const query = this.searchQuery().toLowerCase();

  // Apply tab filter
  if (tab === 'attorneys') convs = convs.filter(c => c.conversation_type === 'attorney_case');
  else if (tab === 'support') convs = convs.filter(c => c.conversation_type === 'operator' || c.conversation_type === 'support');
  else if (tab === 'unread') convs = convs.filter(c => (c.unread_count ?? 0) > 0);

  // Apply search filter
  if (query) {
    convs = convs.filter(c => {
      const other = this.otherParty(c);
      return other?.full_name?.toLowerCase().includes(query);
    });
  }

  return convs;
});

activeCaseConvs = computed(() =>
  this.filteredConversations().filter(c => c.conversation_type === 'attorney_case' && !c.closed_at)
);

supportConvs = computed(() =>
  this.filteredConversations().filter(c => c.conversation_type === 'operator' || c.conversation_type === 'support')
);

closedConvs = computed(() =>
  this.filteredConversations().filter(c => !!c.closed_at)
);
```

### Debounced Search
Use a 300ms debounce on the search input to avoid excessive re-computation:
```typescript
onSearchInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  clearTimeout(this._searchDebounce);
  this._searchDebounce = setTimeout(() => this.searchQuery.set(value), 300);
}
```

## Accessibility
- Filter tabs use `role="tablist"` with `role="tab"` on each tab
- Active tab has `aria-selected="true"`
- Search input has `aria-label="Search conversations"`
- Group headers use `role="heading" aria-level="3"`
- Results change announced via `aria-live="polite"` region

## Acceptance Criteria
- [ ] Clicking "All" tab shows all conversations
- [ ] Clicking "Attorneys" tab shows only attorney_case conversations
- [ ] Clicking "Support" tab shows only operator/support conversations
- [ ] Clicking "Unread" tab shows only conversations with unread_count > 0
- [ ] Active tab is visually highlighted
- [ ] Typing in search filters conversations by other party name
- [ ] Search is debounced (300ms)
- [ ] Search + tab filter work together (AND logic)
- [ ] Empty state shown when no conversations match filter/search
- [ ] Filter tabs have proper ARIA tablist/tab roles
- [ ] Search input has aria-label

## Files to Modify
- `frontend/src/app/features/driver/messages/messages.component.ts` (computed signals + event handlers)
