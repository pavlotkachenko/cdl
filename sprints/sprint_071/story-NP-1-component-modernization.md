# Story NP-1 — Component Modernization

**Status:** DONE
**Priority:** P0

## Acceptance Criteria

- [x] Remove all Angular Material imports (MatSlideToggle, MatCard, MatIcon, etc.)
- [x] Eliminate external template and SCSS files; inline template and styles in component
- [x] Replace all `*ngIf` / `*ngFor` with native `@if` / `@for` control flow
- [x] Convert all `@Input()` / `@Output()` decorators to `input()` / `output()` signal functions
- [x] Replace class properties with `signal()` and `computed()` for reactive state
- [x] Use `inject()` instead of constructor injection for all services
- [x] Set `changeDetection: ChangeDetectionStrategy.OnPush`
