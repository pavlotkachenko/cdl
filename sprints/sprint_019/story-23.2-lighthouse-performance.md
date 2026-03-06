# Story 23.2 — Lighthouse Performance (Launch Gate 2)

**Epic:** Launch Gate Sprint
**Sprint:** 019
**Priority:** CRITICAL
**Status:** TODO

## User Story

As a driver on a mobile network,
I want the app to load in under 2 seconds,
so I don't abandon before I even see the product.

## Scope

Achieve Lighthouse score >90 mobile, >95 desktop to pass Launch Gate 2.

## Target Metrics

| Metric | Target | Tool |
|---|---|---|
| First Contentful Paint | < 1.5s on 4G | Lighthouse |
| Time to Interactive | < 3s on 4G | Lighthouse |
| Lighthouse Mobile Score | > 90 | `npx lighthouse` |
| Lighthouse Desktop Score | > 95 | `npx lighthouse` |
| Bundle Size (initial) | < 300KB gzipped | `ng build --stats-json` |

## Tasks

### Bundle Optimization
- [ ] Run `ng build --stats-json` and analyse with `webpack-bundle-analyzer`
- [ ] Verify all feature routes are lazy-loaded (no eager imports in `app.routes.ts`)
- [ ] Remove any unused Angular Material modules from shared imports
- [ ] Ensure `NgOptimizedImage` is used for all static images

### Image Optimization
- [ ] Compress all landing page images to < 200KB
- [ ] Add explicit `width` and `height` to all `<img>` elements to prevent layout shift
- [ ] Use WebP format where supported

### Runtime Performance
- [ ] Confirm all components use `ChangeDetectionStrategy.OnPush`
- [ ] Audit for any `setInterval` / subscription leaks — check with `takeUntilDestroyed`
- [ ] Verify no blocking third-party scripts in `index.html`

### Verification

```bash
# Build for production
cd frontend && ng build --configuration production

# Run Lighthouse (requires running server)
npx lighthouse http://localhost:4200 --output=json --output-path=./lighthouse-report.json

# Check bundle sizes
npx ng build --stats-json && npx webpack-bundle-analyzer dist/stats.json
```

## Acceptance Criteria

- [ ] Lighthouse mobile score ≥ 90
- [ ] Lighthouse desktop score ≥ 95
- [ ] Initial bundle < 300KB gzipped
- [ ] No Lighthouse "Opportunities" rated HIGH severity
- [ ] Report saved to `sprints/sprint_019/lighthouse-report.json`

## Files to Modify

- `frontend/src/index.html` — remove blocking scripts, add resource hints
- `frontend/src/app/app.routes.ts` — verify lazy loading
- Individual components with missing OnPush or image issues
- Test file: no new unit tests required; Lighthouse report is the artifact
