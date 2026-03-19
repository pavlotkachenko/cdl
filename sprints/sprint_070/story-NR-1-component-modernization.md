# Story: NR-1 — Component Modernization

**Sprint:** sprint_070
**Priority:** P0
**Status:** DONE

## User Story

As a developer,
I want the notification center component modernized to Angular 21 conventions,
so that it uses no Angular Material, no TranslateModule, external templates, and native control flow.

## Acceptance Criteria

- [x] Remove all Angular Material imports: MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule, MatChipListbox, MatMenu
- [x] Remove TranslateModule import and all `| translate` pipes
- [x] Switch to external `templateUrl` and `styleUrl` (not inline template/styles)
- [x] Replace all `*ngFor` directives with `@for` blocks (with `track` expression)
- [x] Replace all `*ngIf` directives with `@if` blocks
- [x] Remove any mock data fallback — component must rely on NotificationService
- [x] Keep NotificationService integration intact (inject via `inject()`)
- [x] Component remains standalone (no `standalone: true` needed in Angular 21)
- [x] Component uses OnPush change detection
- [x] All state managed via signals: `signal()`, `computed()`, `input()`, `output()`
- [x] No constructor injection — use `inject()` function

## Technical Notes

- This is a foundational story — must be completed before all other NR stories
- Check existing component for any `@Input()`/`@Output()` decorators and convert to `input()`/`output()`
- Ensure `inject(NotificationService)` and `inject(Router)` are used
- The template file will be `notification-center.component.html`
- The style file will be `notification-center.component.scss`
- No `NgModule` wrappers — everything standalone
