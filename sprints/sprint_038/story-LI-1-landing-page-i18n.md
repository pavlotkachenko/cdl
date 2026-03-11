# Story LI-1: Landing Page Full i18n + Language Switcher on Header

**Status:** DONE

## Description
Internationalize the entire landing page so all text switches dynamically when the user
toggles language (EN/ES/FR) via the header language switcher. Add the language switcher
component to the landing header for both desktop and mobile viewports.

## Acceptance Criteria
- [x] Language switcher visible on landing page header (desktop and mobile)
- [x] Language switcher uses `theme="light"` for white-background header
- [x] All hero slides use translation keys (`LANDING.HERO_*`)
- [x] All driver/carrier service cards use translation keys (`LANDING.SVC_DRV_*`, `LANDING.SVC_CAR_*`)
- [x] How-we-work steps use translation keys (`LANDING.STEP_*`)
- [x] Benefits section uses translation keys (`LANDING.BENEFIT_*`)
- [x] Testimonials use translation keys (`LANDING.TEST_*`)
- [x] FAQ items use translation keys (`LANDING.FAQ_*`)
- [x] Contact form labels/placeholders use translation keys (`LANDING.FORM_*`)
- [x] Footer links and copyright use translation keys (`LANDING.FTR_*`)
- [x] Stats section uses translation keys (`LANDING.STAT_*`)
- [x] CTA sections use translation keys (`LANDING.CTA_*`)
- [x] Mobile hamburger menu with translated nav links
- [x] EN, ES, FR translations all complete for ~130+ LANDING keys
- [x] Old `landing-page/` components also updated with translate pipes

## Files Changed
- `frontend/src/app/shared/components/language-switcher/language-switcher.component.ts` — added `theme` input, light-mode styles
- `frontend/src/app/features/landing/components/landing-header/landing-header.component.ts` — added LanguageSwitcherComponent, TranslateModule, mobile menu signal/methods
- `frontend/src/app/features/landing/components/landing-header/landing-header.component.html` — language switcher in desktop nav + mobile actions, translated nav links, hamburger menu
- `frontend/src/app/features/landing/components/landing-header/landing-header.component.scss` — mobile nav, lang-switcher-item styles
- `frontend/src/app/features/landing/landing.component.ts` — converted all data arrays to translation key references, added TranslateModule
- `frontend/src/app/features/landing/landing.component.html` — all hardcoded English replaced with translate pipes
- `frontend/src/app/features/landing/components/landing-footer/landing-footer.component.ts` — added TranslateModule
- `frontend/src/app/features/landing/components/landing-footer/landing-footer.component.html` — all footer text uses translate pipes
- `frontend/src/assets/i18n/en.json` — ~130+ LANDING keys added
- `frontend/src/assets/i18n/es.json` — full Spanish translations for LANDING keys
- `frontend/src/assets/i18n/fr.json` — full French translations for LANDING keys
- `frontend/src/assets/images/flags/us.svg` — US flag asset
- `frontend/src/assets/images/flags/es.svg` — Spain flag asset
- `frontend/src/assets/images/flags/fr.svg` — France flag asset
- `frontend/src/assets/images/flags/mx.svg` — Mexico flag asset
- `frontend/src/app/landing-page/components/header/header.component.*` — old landing page header i18n
- `frontend/src/app/landing-page/components/hero-section/hero-section.component.*` — old hero i18n
- `frontend/src/app/landing-page/components/how-we-work/how-we-work.component.*` — old how-we-work i18n
- `frontend/src/app/landing-page/components/services-section/services-section.component.*` — old services i18n
- `frontend/src/app/landing-page/components/testimonials/testimonials.component.*` — old testimonials i18n
- `frontend/src/app/landing-page/components/contact-section/contact-section.component.*` — old contact i18n
- `frontend/src/app/landing-page/components/footer/footer.component.*` — old footer i18n
