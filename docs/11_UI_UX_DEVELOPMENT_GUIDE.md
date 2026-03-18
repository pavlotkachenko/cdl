# UI/UX Development Guide

Quick reference for visual development, theming, and component preview tools.

---

## Quick Start — Run Everything

```bash
# Terminal 1: Backend
cd backend && npm run dev            # http://localhost:3000

# Terminal 2: Frontend + Storybook (side by side)
cd frontend && npm run dev           # FE on :4200, Storybook on :6006

# Or run all 3 at once:
cd frontend && npm run dev:all       # Backend :3000, FE :4200, Storybook :6006
```

| Service    | URL                        | Purpose                    |
|------------|----------------------------|----------------------------|
| Backend    | http://localhost:3000       | Express API                |
| Frontend   | http://localhost:4200       | Angular app (live reload)  |
| Storybook  | http://localhost:6006       | Component preview & themes |

---

## Storybook

### What's Inside

Storybook lets you preview and interact with components in isolation — no backend needed.

**Current stories:**

| Category | Stories | What it shows |
|----------|---------|---------------|
| Design System / Tokens | 1 | All colors, typography, spacing, shadows, radii — responds to theme switching |
| Foundation / Button | 10 | primary, secondary, outline, danger, text, loading, disabled, full-width, sizes |
| Foundation / Status Badge | 11 | All 10 case statuses + sizes + icon toggle |
| Foundation / Card | 4 | default, no-header, clickable, dashboard KPI grid |
| Foundation / Skeleton Loader | 4 | Loading states with different row/height configs |
| Foundation / Error State | 4 | Error messages with and without retry buttons |

### Theme Switching

Use the **paintbrush icon** in the Storybook toolbar to switch between:
- **Light** (default) — brand colors as designed
- **Dark** — inverted surfaces, brightened accent tones
- **High Contrast** — WCAG AAA-level contrast, no shadows

Themes work via CSS custom properties. Every `--cdl-*` variable responds to `data-theme` on `<html>`.

### Viewport Presets

Use the **viewport dropdown** in the toolbar to test responsive layouts:

| Preset | Width | Use case |
|--------|-------|----------|
| Mobile | 375px | iPhone SE / standard mobile |
| Mobile Large | 414px | iPhone Plus / Pro Max |
| Tablet | 768px | iPad portrait |
| Tablet Landscape | 1024px | iPad landscape |
| Desktop | 1280px | Standard laptop |
| Wide | 1536px | External monitor |

### Adding a New Story

Create a `.stories.ts` file next to any component:

```typescript
import type { Meta, StoryObj } from '@storybook/angular';
import { MyComponent } from './my.component';

const meta: Meta<MyComponent> = {
  title: 'Category/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<MyComponent>;

export const Default: Story = {
  args: { label: 'Hello' },
};
```

For components in SharedModule (non-standalone), add `moduleMetadata`:

```typescript
import { moduleMetadata } from '@storybook/angular';
import { SharedModule } from '../../../shared/shared.module';

decorators: [
  moduleMetadata({ imports: [SharedModule] }),
],
```

### Running Storybook

```bash
cd frontend

npm run storybook        # Dev server on :6006
npm run build-storybook  # Static build to storybook-static/
```

---

## Visual Sitemap

Open in any browser:

```bash
open frontend/src/assets/sitemap/index.html
```

Shows all 76 routes across 7 sections (Public + 6 roles), color-coded by role, with lazy-load and auth guard badges.

---

## Theme System

### Architecture

The app has two theming layers:

1. **SCSS compile-time tokens** (`_variables.scss`) — used by existing component styles
2. **CSS custom properties** (`_css-tokens.scss`) — runtime theme switching (light/dark/high-contrast)

Both are imported in `styles.scss`. Existing components continue to work with `$accent-green` etc. New components can use `var(--cdl-accent)` for theme-aware styling.

### Switching Themes in Code

```typescript
// Set theme
document.documentElement.setAttribute('data-theme', 'dark');

// Read current theme
const theme = document.documentElement.getAttribute('data-theme');
```

### Available CSS Variables

All prefixed `--cdl-*`. Major categories:

| Category | Examples | Count |
|----------|---------|-------|
| Brand colors | `--cdl-accent`, `--cdl-primary-black` | 6 |
| Neutrals | `--cdl-light-grey`, `--cdl-dark-grey` | 5 |
| Semantic | `--cdl-success`, `--cdl-error` | 4 |
| Status | `--cdl-status-new` ... `--cdl-status-closed` | 7 |
| Surfaces | `--cdl-bg-page`, `--cdl-bg-card`, `--cdl-bg-input` | 7 |
| Text | `--cdl-text-primary`, `--cdl-text-secondary` | 6 |
| Borders | `--cdl-border-color`, `--cdl-border-focus` | 3 |
| Shadows | `--cdl-shadow-sm` ... `--cdl-shadow-xl` | 4 |
| Typography | `--cdl-fs-h1` ... `--cdl-fs-tiny`, `--cdl-font-primary` | 14 |
| Spacing | `--cdl-space-xs` ... `--cdl-space-4xl` | 8 |
| Radius | `--cdl-radius-sm` ... `--cdl-radius-pill` | 5 |
| Transitions | `--cdl-transition-fast/base/slow` | 3 |
| Layout | `--cdl-sidebar-width`, `--cdl-container-padding` | 3 |

### Responsive Tokens

Font sizes and container padding auto-adjust via media queries:
- Mobile (<=768px): h1=32px, h2=26px, container padding=15px
- Tablet (769-1024px): h2=35px, h3=30px, container padding=40px
- Desktop (>1024px): full Figma sizes

---

## Figma-to-Code Token Mapping

Design tokens from the Figma handoff package are mapped 1:1:

| Figma Token | SCSS Variable | CSS Variable |
|-------------|--------------|--------------|
| primary-black #090000 | `$primary-black` | `--cdl-primary-black` |
| accent-teal #1DAD8C | `$accent-green` | `--cdl-accent` |
| light-grey #EFF3F6 | `$light-grey` | `--cdl-light-grey` |
| Mulish 700 60px | `$h1-size-desktop` | `--cdl-fs-h1` |
| spacing/md 15px | `$spacing-md` | `--cdl-space-md` |
| radius/lg 8px | `$border-radius-lg` | `--cdl-radius-lg` |
| shadow/md | `$shadow-md` | `--cdl-shadow-md` |

Font: Mulish (self-hosted, weights 200-700). No Google Fonts dependency.

---

## Key Files

| File | Purpose |
|------|---------|
| `frontend/.storybook/main.ts` | Storybook addons config |
| `frontend/.storybook/preview.ts` | Viewports, theme toolbar, decorators |
| `frontend/src/assets/styles/_variables.scss` | SCSS design tokens (compile-time) |
| `frontend/src/assets/styles/_css-tokens.scss` | CSS custom properties (3 themes) |
| `frontend/src/assets/styles/_theme.scss` | Angular Material M2 palette |
| `frontend/src/assets/styles/_fonts.scss` | Self-hosted Mulish font-face |
| `frontend/src/assets/sitemap/index.html` | Visual sitemap (standalone HTML) |
| `frontend/src/styles.scss` | Global stylesheet (imports all above) |

---

## Changes Made (March 2026)

- Installed Storybook 10.2 for Angular with a11y + docs addons
- Removed conflicting `@angular/material/prebuilt-themes/indigo-pink.css` from build
- Removed unused Google Fonts Roboto import from index.html
- Updated `<meta name="theme-color">` from `#1976d2` to `#1DAD8C`
- Created CSS custom properties theme system with light/dark/high-contrast variants
- Created 7 Storybook stories covering foundation components and design tokens
- Created visual sitemap HTML with all 76 routes across 7 sections
- Added `npm run dev` and `npm run dev:all` scripts for parallel startup
