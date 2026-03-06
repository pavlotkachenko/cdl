/**
 * Sprint 034 I18N-1 — LanguageSwitcherComponent unit tests
 */
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { LanguageSwitcherComponent } from './language-switcher.component';
import { TranslateService } from '@ngx-translate/core';

function makeTranslateSpy(currentLang = 'en') {
  return {
    currentLang,
    use: vi.fn(),
  };
}

async function setup(translateSpy = makeTranslateSpy()) {
  await TestBed.configureTestingModule({
    imports: [LanguageSwitcherComponent, NoopAnimationsModule],
    providers: [
      { provide: TranslateService, useValue: translateSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(LanguageSwitcherComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, translateSpy };
}

describe('LanguageSwitcherComponent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('initialises with default language "en" from TranslateService', async () => {
    const { component } = await setup(makeTranslateSpy('en'));
    expect(component.currentLang()).toBe('en');
  });

  it('restores saved language from localStorage on init', async () => {
    localStorage.setItem('cdl_lang', 'es');
    const spy = makeTranslateSpy('en');
    const { component } = await setup(spy);
    expect(component.currentLang()).toBe('es');
    expect(spy.use).toHaveBeenCalledWith('es');
  });

  it('ignores invalid values in localStorage', async () => {
    localStorage.setItem('cdl_lang', 'fr');
    const spy = makeTranslateSpy('en');
    const { component } = await setup(spy);
    // 'fr' is not 'en' or 'es', so it should be ignored
    expect(component.currentLang()).toBe('en');
    expect(spy.use).not.toHaveBeenCalled();
  });

  it('switchLang() calls translateService.use with selected language', async () => {
    const { component, translateSpy } = await setup();
    component.switchLang('es');
    expect(translateSpy.use).toHaveBeenCalledWith('es');
  });

  it('switchLang() updates currentLang signal', async () => {
    const { component } = await setup();
    component.switchLang('es');
    expect(component.currentLang()).toBe('es');
  });

  it('switchLang() persists selection to localStorage', async () => {
    const { component } = await setup();
    component.switchLang('es');
    expect(localStorage.getItem('cdl_lang')).toBe('es');
  });

  it('renders EN and ES toggle buttons', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('EN');
    expect(el.textContent).toContain('ES');
  });
});
