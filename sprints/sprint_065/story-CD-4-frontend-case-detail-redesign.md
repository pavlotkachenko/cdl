# Story CD-4: Frontend — Case Detail Component Redesign (Core)

## Meta

- **Sprint:** 065
- **Priority:** P0
- **Status:** DONE
- **Batch:** 2 (depends on CD-1, CD-2, CD-3)

## User Story

**As** Miguel (Driver),
**I want** a polished, modern case detail page with clear case info, my attorney's stats, a visual status timeline, and easy access to documents and actions,
**So that** I can understand my case status at a glance and trust that my case is being handled professionally.

## Scope

### Files to modify

| File | Action |
|------|--------|
| `frontend/src/app/features/driver/case-detail/case-detail.component.ts` | Full rewrite |
| `frontend/src/app/features/driver/case-detail/case-detail.component.html` | Full rewrite (inline in .ts or external) |
| `frontend/src/app/features/driver/case-detail/case-detail.component.scss` | Full rewrite |
| `frontend/src/app/features/driver/case-detail/case-detail.component.spec.ts` | Full rewrite |
| `frontend/src/app/core/services/case.service.ts` | Update Case interface — add attorney stat fields |

### Angular Convention Migration (Mandatory)

| Current | Required |
|---------|----------|
| `constructor(private route, private router, ...)` (8 params) | `inject(ActivatedRoute)`, `inject(Router)`, etc. |
| `standalone: true` explicit | Remove (default in Angular 21) |
| No `changeDetection` | `changeDetection: ChangeDetectionStrategy.OnPush` |
| Mutable class properties | `signal()` for all state, `computed()` for derived values |
| `*ngIf`, `*ngFor` (17 instances) | `@if`, `@for` native control flow |
| `[ngClass]` | `[class.status-new]="..."` bindings |
| `CommonModule` import | Remove |
| 12 Material module imports | Remove all — custom HTML/CSS |
| `MatIconModule` + 40+ `<mat-icon>` | Emoji spans + inline SVGs |
| `MatSnackBar` | Custom toast/notification signal |
| `Subject` + `takeUntil` destroy | `DestroyRef` + `takeUntilDestroyed()` |
| `FormBuilder` constructor injection | `inject(NonNullableFormBuilder)` |
| Font `Inter` | Font `Mulish` (project standard) |

### Visual Redesign Sections

#### 1. Case Hero Header
- Breadcrumb nav: Home > My Cases > CASE-2026-000847
- Case number (h1, bold) + violation type label (e.g., "Speeding")
- Status badge with emoji icon (colored chip, no mat-icon)
- Stat strip: 3 inline metrics — Days Open, Court Countdown, Documents Count

#### 2. Info Grid
- 2-column bordered cells with emoji icons per field
- Fields: Citation Number, Violation Date, Location, State, Court Date, Submitted
- Description in its own section below grid
- Resolution section (if case closed) with green left border

#### 3. Documents Section
- Header with count + upload button (emoji icon)
- Dashed-border drag-drop upload area with format badges (JPG, PNG, PDF, HEIC) and 10MB limit note
- File list: type-colored emoji icon + name + date + size + download/delete actions
- Upload progress indicator (CSS spinner, not mat-spinner)
- Empty state with folder emoji

#### 4. Attorney Card
- Initials avatar circle with gradient background
- Name + "Defense Attorney" label + online status dot (green/gray)
- 3-stat strip: Win Rate (%), Years Experience, Cases Won
- Message + Call action buttons with emoji icons
- Uses attorney stats from enriched backend response (CD-1 provides data, already in GET /api/cases/:id)

#### 5. Status Timeline
- Vertical timeline with done/current/pending states
- Done steps: green circle with checkmark emoji
- Current step: animated blue/teal circle with pulse
- Pending steps: gray circle, muted text
- Each step: status label, changed_by name, timestamp, optional notes
- Uses real `statusHistory` from enriched backend response (CD-1)

#### 6. Court Date Alert Card
- Amber/yellow card with calendar emoji
- Bold countdown: "X days until court"
- Formatted court date
- Only shown when court date exists and is in the future

#### 7. Pay Attorney Alert Card
- Prominent card when `status === 'pay_attorney'`
- Payment emoji + amount display + "Pay Now" gradient button
- Navigates to `/driver/cases/:caseId/pay`

#### 8. Quick Actions Grid
- 2x3 grid on desktop, stacked on mobile
- Actions: Upload Document, Add Note, Export PDF, Share Case, Contact Attorney, Payment History
- Each with emoji icon + label
- Wired to actual functionality (upload triggers file input, PDF calls PdfGeneratorService, etc.)

#### 9. Secure Footer
- Shield SVG + "Your data is protected with bank-level encryption"

#### 10. Loading / Error States
- CSS-only spinner (no mat-spinner)
- Error state with warning emoji + retry button

### Component Logic

1. **OnInit:** Read `caseId` from route params (`:caseId` per CD-3), load case details, load documents, connect socket
2. **Signals:**
   - `caseData = signal<Case | null>(null)`
   - `loading = signal(true)`
   - `error = signal('')`
   - `realDocuments = signal<any[]>([])`
   - `uploadingDoc = signal(false)`
   - `deletingDocId = signal<string | null>(null)`
   - `exportingPdf = signal(false)`
   - `copyFeedback = signal(false)` (for copy case number)
3. **Computed signals:**
   - `statusHistory = computed(() => this.caseData()?.statusHistory ?? [])`
   - `attorney = computed(() => this.caseData()?.attorney)`
   - `daysUntilCourt = computed(...)` — from case court_date
   - `daysOpen = computed(...)` — from case created_at
   - `documentCount = computed(() => this.realDocuments().length)`
   - `displayStatus = computed(...)` — label, class, emoji for current status
4. **Preserved functionality:** Document upload/delete, PDF export, socket real-time updates, lightbox, document viewer
5. **Remove:** Mock case fallback (use error state instead), mock comments (moved to CD-5)

### Case Interface Update

Add to `Case` interface in `case.service.ts`:
```typescript
attorney?: {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  win_rate?: number;
  years_experience?: number;
  cases_won?: number;
} | null;
statusHistory?: Array<{
  status: string;
  previous_status: string;
  changed_by: string;
  notes: string;
  changed_at: string;
}>;
```

### Accessibility

- `role="status"` on loading indicator with `aria-label="Loading case details"`
- `aria-label` on all icon-only buttons
- `aria-live="polite"` on status updates from socket
- Keyboard: all buttons and links focusable and activatable
- Touch targets: 48px minimum height on all interactive elements
- Semantic: `<section>` with `<h2>` for each card, proper heading hierarchy
- All decorative SVGs: `aria-hidden="true"`
- Status timeline: `<ol>` with `role="list"` for screen readers

### Responsive Design

- 2-column grid on desktop (>1200px): left column 2fr, right column 1fr
- Single column on tablet/mobile (<1200px)
- Stat strip: inline on desktop, stacked on mobile (<480px)
- Quick actions: 2x3 grid on desktop, stacked on mobile
- Full-width buttons on mobile
- Touch targets: 48px minimum
- Card max-width: none (fills column)

## Acceptance Criteria

- [ ] Angular 21 conventions: signals, inject(), OnPush, native control flow, no Material imports
- [ ] No `mat-icon` — all emoji + inline SVG
- [ ] Mulish font throughout (not Inter)
- [ ] Case hero header with breadcrumb, case number, status badge, stat strip
- [ ] 2-column info grid with emoji icons and bordered cells
- [ ] Documents section with upload area, format badges, file list
- [ ] Attorney card with initials avatar, gradient, stats (win_rate, years_exp, cases_won)
- [ ] Status timeline with done/current/pending visual states using real data from CD-1
- [ ] Court date alert with countdown (shown when applicable)
- [ ] Pay attorney alert with amount and Pay Now button (shown when status = pay_attorney)
- [ ] Quick actions 2x3 grid with emoji icons
- [ ] Secure footer
- [ ] Loading state with CSS spinner
- [ ] Error state with retry
- [ ] Document upload/delete preserved
- [ ] PDF export preserved
- [ ] Socket real-time status updates preserved
- [ ] Document viewer modal + image lightbox preserved
- [ ] Case interface updated with attorney stat fields
- [ ] Mobile-first responsive layout, 48px touch targets
- [ ] WCAG 2.1 AA: ARIA labels, keyboard navigable, screen reader announcements
- [ ] All tests pass: `cd frontend && npx ng test --no-watch`

## Test Coverage Matrix

| Source File | Test File | Action |
|------------|-----------|--------|
| `frontend/src/app/features/driver/case-detail/case-detail.component.ts` | `case-detail.component.spec.ts` | Full rewrite |
| `frontend/src/app/core/services/case.service.ts` | `case.service.spec.ts` | Update |

## Test Cases Required

1. Renders case hero header with case number and status badge
2. Stat strip shows days open, court countdown, document count
3. Info grid displays all case fields with emoji icons
4. Attorney card shows initials, name, stats (win_rate, years_experience, cases_won)
5. Status timeline renders real statusHistory entries with done/current/pending states
6. Court date alert shown when court date is in the future
7. Court date alert hidden when no court date
8. Pay attorney alert shown when status is pay_attorney
9. Quick actions grid renders 6 action buttons
10. Upload document triggers file input
11. Delete document calls CaseService.deleteDocument
12. PDF export calls PdfGeneratorService
13. Loading state shown while data loads
14. Error state shown when API call fails
15. `viewCase()` navigates to correct route
16. `goBack()` navigates to `/driver/tickets`
17. `payAttorneyFee()` navigates to pay route
18. Socket connection established on init, left on destroy
19. Case number copy-to-clipboard with feedback (if applicable)
20. Responsive: 2-column on wide viewport, 1-column on narrow
