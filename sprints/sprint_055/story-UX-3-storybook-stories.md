# UX-3: Create Storybook component stories for foundation components

- **Status:** DONE
- **Priority:** P1
- **Sprint:** 055

## Description

Create Storybook component stories for foundation components including design tokens, buttons, status badges, cards, skeleton loaders, and error states.

## Acceptance Criteria

- [x] Design System/Tokens story shows all colors, typography, spacing, shadows, radii — responds to theme switching
- [x] Foundation/Button story: 10 variants (primary, secondary, outline, danger, text, loading, disabled, full-width, small, large)
- [x] Foundation/Status Badge story: 11 variants (all 10 case statuses + sizes + icon toggle)
- [x] Foundation/Card story: 4 variants (default, no-header, clickable, dashboard KPI grid)
- [x] Foundation/Skeleton Loader story: 4 variants
- [x] Foundation/Error State story: 4 variants
- [x] Default Storybook example stories removed

## Files

- `src/app/shared/design-tokens.stories.ts`
- `src/app/shared/components/button/button.stories.ts`
- `src/app/shared/components/status-badge/status-badge.stories.ts`
- `src/app/shared/components/card/card.stories.ts`
- `src/app/shared/components/skeleton-loader/skeleton-loader.stories.ts`
- `src/app/shared/components/error-state/error-state.stories.ts`
