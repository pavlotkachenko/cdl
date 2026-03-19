# Story PY-13 — Frontend: SCSS Redesign to Match Template

## Status: DONE

## Description
Complete SCSS rewrite for the payment history component to match the HTML template design. Uses design tokens from `_variables.scss`, adds new color tokens for green/amber/blue/red families, and implements all template visual patterns.

## New Design Tokens (add to `_variables.scss` if not present)
```scss
// Status colors (may already exist partially)
$green: #10b981;
$green-bg: #ecfdf5;
$green-border: #a7f3d0;
$amber: #f59e0b;
$amber-bg: #fffbeb;
$amber-border: #fde68a;
$blue: #3b82f6;
$blue-bg: #eff6ff;
$blue-border: #bfdbfe;
$red: #ef4444;
$red-bg: #fef2f2;
$red-border: #fecaca;

// Additional
$teal-bg2: #e4f5f1;
$border-light: #edf2f6;
$shadow-md: 0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04);
$shadow-teal: 0 4px 16px rgba(29,173,140,.25);
```

## Key CSS Patterns from Template

### Page Header
```scss
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.page-label {
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: $teal;
  &::before { content: ''; width: 18px; height: 2px; background: $teal; }
}
.page-title { font-size: 22px; font-weight: 800; }
.page-sub { font-size: 13px; color: $text-muted; margin-top: 3px; }
```

### KPI Row
```scss
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.kpi-card {
  background: white; border: 1.5px solid $border-light; border-radius: $radius-md;
  padding: 20px 22px; box-shadow: $shadow-sm; position: relative; overflow: hidden;
  &::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  &:hover { box-shadow: $shadow-md; transform: translateY(-2px); }
}
```

### Filter Card, Table Card, Pagination
- See PY-6, PY-7, PY-8 stories for detailed CSS specs

### Animations
```scss
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.kpi-row { animation: fadeIn 0.3s ease both; }
.filter-card { animation: fadeIn 0.3s 0.06s ease both; }
.table-card { animation: fadeIn 0.3s 0.12s ease both; }
```

## Hidden Requirements
1. **Remove "Make Payment" section**: The template is a pure payment history page — the unpaid cases section is a separate concern. Remove it from this component (it lives in the case detail flow).
2. **Import variables**: Use `@use '../../../../../assets/styles/variables' as *` at the top of SCSS
3. **No Material card wrappers**: Replace `mat-card` with plain `<div>` elements styled with template classes
4. **Font**: `font-family: 'Mulish', -apple-system, sans-serif` — already in global styles
5. **Scrollbar styling**: Thin 5px scrollbar matching template CSS
6. **Responsive breakpoints**:
   - Desktop (>1024px): 4 KPI columns, full filter row
   - Tablet (768–1024px): 2 KPI columns, wrapped filter fields
   - Mobile (<768px): 1 KPI column, stacked filter fields, table with horizontal scroll
7. **Dark mode ready**: Use CSS custom properties where possible for future dark mode support (not required now, but structure for it)

## Acceptance Criteria
- [x] All design tokens added to `_variables.scss`
- [x] SCSS matches template visual design pixel-close
- [x] No Material card/chip/form-field styling overrides needed
- [x] Fade-in animations on load
- [x] Responsive grid at all breakpoints
- [x] Hover effects on cards, rows, buttons
- [x] Make Payment section removed
