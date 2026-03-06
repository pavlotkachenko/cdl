# Story 15 — Landing Page Polish

**Sprint:** 011 — Landing Page Polish
**Status:** DONE

## Scope

Modernize the landing page to Angular 21 patterns, add FAQ section, enhance trust stats bar, and write spec file.

## Files Changed

### landing.component.ts
- Removed `standalone: true` (default in Angular 21)
- Replaced constructor injection with `inject()`
- Added `ChangeDetectionStrategy.OnPush`
- All state converted to `signal()` / `computed()`
- Added `faqItems: FaqItem[]` (10 entries)
- Added `openFaqIndex = signal<number | null>(null)` + `toggleFaq(index)` method
- Fixed `setInterval` leak: store ID in `slideIntervalId`, clear in `ngOnDestroy`
- Added `testimonialPages` array (replaces `[].constructor(n)` anti-pattern in template)
- Computed: `activeServices`, `activeWorkSteps`, `visibleTestimonials`

### landing.component.html
- All `*ngFor` → `@for` with `track` expressions
- All `*ngIf` → `@if` / `@else`
- `[ngClass]="slide.image"` → `[class]="slide.image"`
- All bindings updated for signals: `currentSlideIndex()`, `submitting()`, etc.
- Added FAQ accordion section (10 Q&As, ARIA `aria-expanded`, `aria-controls`)
- Enhanced hero stats: FREE, 10.5K reviews, 50 states, 100% resolution
- `rel="noopener noreferrer"` on all external links
- Testimonial pagination uses `testimonialPages` array

### landing-header.component.ts
- Removed `standalone: true`
- Added `ChangeDetectionStrategy.OnPush`
- Replaced constructor with `inject(Router)`

### landing.component.spec.ts (18 tests)
- initializes with drivers service view and slide index 0
- nextSlide advances the slide index
- nextSlide wraps around at the end
- prevSlide wraps around from index 0
- activeServices returns driverServices when view is drivers
- activeServices returns carrierServices when view is carriers
- visibleTestimonials returns first 4 testimonials on page 0
- nextTestimonial advances to next page
- toggleFaq opens an item
- toggleFaq closes already-open item
- faqItems has 10 entries
- onSubmitRequest shows snackBar and sets submitSuccess on success
- onSubmitRequest shows error snackBar on failure
- onSubmitRequest marks form touched and does not call service when invalid
- getInitials returns two initials for full name
- getInitials returns two chars for single word
- getInitials returns ? for empty name
- ngOnDestroy clears the slide interval

## Key Fixes Discovered

### RouterLink in child component requires provideRouter([])
`LandingHeaderComponent` uses `RouterLink` in its template. RouterLink subscribes to `Router.events`
which is undefined when using `{ provide: Router, useValue: { navigate: vi.fn() } }`.

**Wrong:**
```typescript
{ provide: Router, useValue: { navigate: vi.fn() } }
```

**Correct:**
```typescript
provideRouter([])
// then spy after injection:
navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
```

### TestBed cascade failure
When the first `beforeEach` fails (e.g., RouterLink can't initialize), TestBed is left partially
instantiated. All subsequent `configureTestingModule` calls fail with:
"Cannot configure the test module when the test module has already been instantiated."

Fix: resolve the root cause AND guard `afterEach` with:
```typescript
afterEach(() => {
  if (component) component.ngOnDestroy();
});
```

### ng test vs npx vitest run
`npx vitest run` bypasses Angular's `TestBed.initTestEnvironment()` setup and shows false failures.
Always use `npm test` (which runs `ng test` → `@angular/build:unit-test`).

## Total
337/337 tests pass (was 319 before Sprint 011, +18 new tests).
