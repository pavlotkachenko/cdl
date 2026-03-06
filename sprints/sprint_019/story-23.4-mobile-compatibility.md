# Story 23.4 — Mobile Compatibility Audit (Launch Gate 4)

**Epic:** Launch Gate Sprint
**Sprint:** 019
**Priority:** CRITICAL
**Status:** TODO

## User Story

As Miguel (driver) using my iPhone or Android phone,
I want every screen to work flawlessly without horizontal scrolling or broken layouts,
so I can manage my tickets from anywhere.

## Scope

Verify platform works perfectly on iOS Safari + Chrome Android to pass Launch Gate 4.

## Target Devices / Viewports

| Device | Viewport | Browser |
|---|---|---|
| iPhone SE (small) | 375×667 | iOS Safari |
| iPhone 14 | 390×844 | iOS Safari |
| Pixel 7 | 412×915 | Chrome Android |
| iPad Mini | 768×1024 | iOS Safari |

## Audit Checklist

### Layout
- [ ] No horizontal scrolling on any screen at 375px width
- [ ] All text readable without zooming (min 16px body, 14px secondary)
- [ ] Cards and tables reflow correctly (no overflow clipping)
- [ ] Bottom navigation / FAB accessible with one thumb in thumb zone

### Forms & Inputs
- [ ] `type="email"` on email fields (triggers correct keyboard)
- [ ] `type="tel"` on phone fields
- [ ] `type="number"` on numeric fields
- [ ] `autocomplete` attributes on login and registration fields
- [ ] No zoom triggered on input focus (font-size ≥ 16px on inputs)

### Touch Interactions
- [ ] All buttons ≥ 44×44px tap target
- [ ] Swipe gestures don't conflict with browser back gesture
- [ ] Modals dismiss cleanly on outside tap or Escape

### Camera / File Upload
- [ ] `<input type="file" accept="image/*" capture="environment">` on ticket upload
- [ ] Camera access prompt appears on first use
- [ ] File selected from gallery works as fallback

### Performance on Mobile
- [ ] No layout shift (CLS < 0.1) during page load
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No 300ms tap delay (FastClick not needed with modern touch-action)

## Verification Steps

```bash
# Chrome DevTools — test at 375px viewport
# Open DevTools → Toggle device toolbar → iPhone SE

# iOS Safari — test on real device or Simulator
# Android Chrome — test with Chrome DevTools remote debugging
```

## Acceptance Criteria

- [ ] All 8 priority screens pass layout audit at 375px, 390px, 412px
- [ ] Ticket photo upload works on both iOS and Android
- [ ] No input zoom on iOS Safari
- [ ] Touch targets pass 44×44px check on all interactive elements
- [ ] Findings documented in `sprints/sprint_019/mobile-audit-results.md`

## Files to Modify

- Any component SCSS with fixed widths causing overflow
- `frontend/src/styles/` — global input font-size fix if needed
- Individual component templates where touch targets are too small
