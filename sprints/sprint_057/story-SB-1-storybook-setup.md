# Story SB-1: Storybook — Initial Setup

**Status:** DONE
**Priority:** P2
**Sprint:** 057

## Description
Set up Storybook for the Angular 21 frontend with Material + Tailwind theming support for component documentation and visual testing.

## Files Created
- `frontend/.storybook/main.ts` — Storybook configuration
- `frontend/.storybook/preview.ts` — Global decorators and theme setup
- `frontend/.storybook/tsconfig.doc.json` — TypeScript config for Storybook
- `frontend/.storybook/tsconfig.json` — Extended TS config
- `frontend/.storybook/typings.d.ts` — Type declarations
- `frontend/src/app/shared/components/button/button.stories.ts`
- `frontend/src/app/shared/components/card/card.stories.ts`
- `frontend/src/app/shared/components/error-state/error-state.stories.ts`
- `frontend/src/app/shared/components/skeleton-loader/skeleton-loader.stories.ts`
- `frontend/src/app/shared/components/status-badge/status-badge.stories.ts`
- `frontend/src/app/shared/design-tokens.stories.ts`

## Acceptance Criteria
- [x] `npm run storybook` launches Storybook dev server
- [x] Stories render shared components with Material theming
- [x] CSS design tokens documented
