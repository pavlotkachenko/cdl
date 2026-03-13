# Story OC-4: Operator Messaging & Template System

## Status: DONE

## Priority: P1

## Depends On: OC-1 (case detail provides navigation context)

## Description
Enable operators to communicate with drivers through the existing messaging infrastructure.
Operators need to open a conversation from a case, use pre-built message templates (TC-OPR-006),
customize template variables, and send messages. The backend already has `conversation.service.js`,
`message.service.js`, and `template.service.js` — this story builds the frontend UI and wires
it to those existing APIs.

### User Stories
> As an **operator**, I want to open a conversation with a driver from a case detail page so
> I can communicate about their ticket status, required documents, or court dates.

> As an **operator**, I want to select a message template (e.g., "Court Date Reminder"),
> customize the variable fields (date, time, courthouse), and send it so I can work
> efficiently without typing repetitive messages.

## Backend Changes

### Verify Existing Endpoints
Confirm these endpoints exist and are accessible to the `operator` role:

| Endpoint | Controller | Expected |
|----------|-----------|----------|
| `GET /api/conversations?caseId=X` | conversation.controller | Get/create conversation for case |
| `POST /api/conversations` | conversation.controller | Create conversation (operator + driver) |
| `GET /api/conversations/:id/messages` | message.controller | List messages in conversation |
| `POST /api/conversations/:id/messages` | message.controller | Send a message |
| `GET /api/templates?category=operator` | template.controller | List operator templates |
| `GET /api/templates/:id` | template.controller | Get single template with variables |

**If any endpoint restricts to roles that exclude `operator`:** Update the `authorize()` call
to include `operator`.

### Template Seed Data
Ensure the `message_templates` table has operator-relevant templates seeded (or create a
migration/seed script):

| Name | Category | Body | Variables |
|------|----------|------|-----------|
| Court Date Reminder | operator | "Your court date for case {{case_number}} is scheduled for {{court_date}} at {{courthouse}}. Please ensure you have all required documents." | case_number, court_date, courthouse |
| Document Request | operator | "We need additional documentation for your case {{case_number}}: {{document_list}}. Please upload via your driver portal." | case_number, document_list |
| Status Update | operator | "Your case {{case_number}} status has been updated to: {{new_status}}. {{additional_info}}" | case_number, new_status, additional_info |
| Attorney Assigned | operator | "Attorney {{attorney_name}} has been assigned to your case {{case_number}}. They will contact you within {{timeframe}}." | attorney_name, case_number, timeframe |
| Payment Reminder | operator | "A payment of {{amount}} is due for case {{case_number}} by {{due_date}}. Visit your portal to make a payment." | amount, case_number, due_date |

## Frontend Changes

### New Component: `OperatorMessagingComponent`
**Path:** `frontend/src/app/features/operator/messaging/operator-messaging.component.ts`

Can be either a route (`/operator/cases/:id/messages`) or a panel within the case detail page.
**Recommendation:** Dedicated route — messaging needs screen real estate.

**Signals:**
- `messages = signal<Message[]>([])` — conversation messages
- `conversationId = signal<string | null>(null)`
- `loading = signal(true)`
- `sending = signal(false)`
- `messageText = signal('')` — current draft
- `templates = signal<Template[]>([])` — available templates
- `showTemplatePanel = signal(false)` — toggle template picker

**Template layout:**
1. **Message thread** — scrollable container, messages aligned left (driver) / right (operator),
   with avatar, timestamp, read status
2. **Template picker** — slide-in panel or dropdown triggered by "Templates" button:
   - List of template names grouped by category
   - Click to preview template body with variable placeholders highlighted
   - "Use Template" button fills the message composer with the template text
   - Variable fields shown as inline editable spans or a small form
3. **Composer** — textarea at bottom with "Templates" button and "Send" button
   - Auto-resize textarea
   - Send on Ctrl+Enter / Cmd+Enter
   - Character count indicator

**Template variable substitution:**
When a template is selected, extract `{{variable}}` patterns, render a small form with one
input per variable pre-filled with known values (case number, court date from case data),
and let the operator edit. On "Insert", substitute variables and place text in composer.

### New Service: `TemplateService`
**Path:** `frontend/src/app/core/services/template.service.ts`
```typescript
getTemplates(category?: string): Observable<Template[]>
getTemplate(id: string): Observable<Template>
```

### Routing Update
In `operator-routing.module.ts`:
```typescript
{
  path: 'cases/:id/messages',
  loadComponent: () => import('./messaging/operator-messaging.component')
    .then(m => m.OperatorMessagingComponent)
}
```

### Case Detail Integration (OC-1)
Add a "Message Driver" button in the case detail that navigates to
`/operator/cases/:id/messages`.

## Acceptance Criteria
- [ ] Operator can open a conversation from case detail via "Message Driver" button
- [ ] Messages load from existing conversation API, displayed in a chat thread
- [ ] Operator can type and send messages; new messages appear immediately
- [ ] "Templates" button opens template picker showing available operator templates
- [ ] Selecting a template shows preview with highlighted `{{variable}}` placeholders
- [ ] "Use Template" fills the composer with template text, variables substituted where known
- [ ] Unknown variables show as editable inline fields for operator to fill
- [ ] Template "Court Date Reminder" works end-to-end: select → fill date → send (TC-OPR-006)
- [ ] Messages sent via template are indistinguishable from manually typed messages to the driver
- [ ] Ctrl+Enter / Cmd+Enter sends the message
- [ ] All text uses TranslateModule with `OPR.MSG.*` keys
- [ ] Component is standalone, OnPush, signals-based
- [ ] WCAG 2.1 AA: keyboard navigable, screen reader announces new messages
- [ ] Build succeeds with no errors

## Test Coverage

### Backend Tests
- Verify operator role has access to conversation endpoints
- Verify operator role has access to template endpoints
- Template seed data exists in test database (or is mocked)

### Frontend Tests (`operator-messaging.component.spec.ts`)
- Renders loading state initially
- Displays messages after load, driver messages on left, operator on right
- Send button calls message API with composer text
- Composer clears after successful send
- Templates button toggles template panel visibility
- Selecting a template fills composer with substituted text
- Template variables pre-filled from case data (case_number, court_date)
- Empty conversation shows "No messages yet" placeholder
- Error state shown on send failure

### Frontend Tests (`template.service.spec.ts`)
- `getTemplates()` calls correct endpoint
- `getTemplates('operator')` passes category query param
- `getTemplate(id)` calls correct endpoint
