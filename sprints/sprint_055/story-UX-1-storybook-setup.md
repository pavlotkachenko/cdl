# UX-1: Install and configure Storybook 10 for Angular

- **Status:** DONE
- **Priority:** P0
- **Sprint:** 055

## Description

Install and configure Storybook 10 for Angular with a11y and docs addons, including angular.json builder targets and npm scripts.

## Acceptance Criteria

- [x] Storybook 10.2 installed with @storybook/angular framework
- [x] Addons configured: @storybook/addon-a11y, @storybook/addon-docs
- [x] angular.json has storybook and build-storybook builder targets
- [x] `npm run storybook` starts Storybook on port 6006
- [x] `npm run build-storybook` produces storybook-static/ output
- [x] storybook-static/ added to .gitignore

## Files

- `.storybook/main.ts`
- `.storybook/preview.ts`
- `.storybook/tsconfig.json`
- `.storybook/tsconfig.doc.json`
- `.storybook/typings.d.ts`
- `angular.json`
- `package.json`
