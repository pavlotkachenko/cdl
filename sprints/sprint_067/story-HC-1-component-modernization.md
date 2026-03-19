# Story: HC-1 — Component Modernization & Layout Foundation

**Sprint:** sprint_067
**Priority:** P0
**Status:** DONE

## User Story

As a developer,
I want to modernize the HelpComponent to use Angular 21 best practices (signals, OnPush, inject(), native control flow),
So that the component is maintainable, performant, and free of Angular Material dependencies.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/help/help.component.ts`

### Database Changes
- None

## Acceptance Criteria

- [ ] All Angular Material imports removed (MatCardModule, MatButtonModule, MatIconModule, MatExpansionModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatChipsModule, MatTabsModule)
- [ ] `TranslateModule` and `FormsModule` removed from imports
- [ ] `CommonModule` removed (native control flow used instead)
- [ ] `changeDetection: ChangeDetectionStrategy.OnPush` set
- [ ] Class properties converted to signals: `searchQuery`, `selectedCategory`
- [ ] `filteredFAQs` getter replaced with `computed()` signal
- [ ] New `computed()` signals added: `filteredCategories` (for article count per category), `hasResults`
- [ ] `OnInit` lifecycle replaced with `afterNextRender` for scroll-to-hash
- [ ] `inject(Router)` used instead of `window.location.href` for internal navigation
- [ ] FAQ data model expanded: each FAQ gets an `icon` emoji field
- [ ] Contact methods expanded with `availability` and `responseTime` string fields
- [ ] New `resources` array added for quick-links section data
- [ ] Category data model gets `emoji` field replacing `icon` (mat-icon name)
- [ ] Interfaces updated: `FAQ`, `SupportCategory`, `ContactMethod`, `Resource`

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `frontend/src/app/features/driver/help/help.component.ts` | `help.component.spec.ts` | HC-7 |

## Dependencies

- Depends on: none
- Blocked by: none

## Notes

- This story sets up the TS foundation; HTML and SCSS come in HC-2 through HC-5
- Keep the HTML template minimal/stub until subsequent stories fill it in
- The `openContactMethod` method should use `Router.navigate()` for internal routes and `window.open()` for external (mailto:, tel:)
- Category click should both filter FAQs AND scroll to the FAQ section
