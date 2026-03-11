import { Component, OnInit, inject, input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const LANG_KEY = 'cdl_lang';

interface LangOption {
  code: string;
  label: string;
  flag: string;
}

const LANGUAGES: LangOption[] = [
  { code: 'en', label: 'EN', flag: 'assets/images/flags/us.svg' },
  { code: 'es', label: 'ES', flag: 'assets/images/flags/es.svg' },
  { code: 'fr', label: 'FR', flag: 'assets/images/flags/fr.svg' },
];

@Component({
  selector: 'app-language-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="lang-row" [class.light]="theme() === 'light'" role="radiogroup" aria-label="Select language">
      @for (lang of languages; track lang.code) {
        <button class="lang-item"
          [class.active]="currentLang() === lang.code"
          [attr.aria-checked]="currentLang() === lang.code"
          role="radio"
          (click)="switchLang(lang.code)">
          <img [src]="lang.flag" [alt]="lang.label" class="flag">
          <span class="code">{{ lang.label }}</span>
        </button>
      }
    </div>
  `,
  styles: [`
    .lang-row {
      display: flex;
      align-items: center;
      gap: 2px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 22px;
      padding: 3px;

      &.light {
        background: rgba(0, 0, 0, 0.06);

        .lang-item {
          &:hover {
            background: rgba(0, 0, 0, 0.08);
          }

          &.active {
            background: rgba(29, 173, 140, 0.15);
          }

          &:focus-visible {
            outline-color: #1dad8c;
          }
        }

        .code {
          color: #333;
        }
      }
    }

    .lang-item {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border: none;
      border-radius: 18px;
      background: transparent;
      cursor: pointer;
      transition: background 0.2s ease;
      white-space: nowrap;

      &:hover {
        background: rgba(255, 255, 255, 0.12);
      }

      &.active {
        background: rgba(255, 255, 255, 0.22);
      }

      &:focus-visible {
        outline: 2px solid white;
        outline-offset: -2px;
      }
    }

    .flag {
      width: 18px;
      height: 13px;
      border-radius: 2px;
      object-fit: cover;
      display: block;
    }

    .code {
      font-size: 12px;
      font-weight: 600;
      color: white;
      letter-spacing: 0.5px;
      line-height: 1;
    }
  `]
})
export class LanguageSwitcherComponent implements OnInit {
  private translate = inject(TranslateService);
  theme = input<'dark' | 'light'>('dark');
  currentLang = signal(this.translate.currentLang || 'en');
  languages = LANGUAGES;

  ngOnInit(): void {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && LANGUAGES.some(l => l.code === saved)) {
      this.translate.use(saved);
      this.currentLang.set(saved);
    }
  }

  switchLang(lang: string): void {
    this.translate.use(lang);
    this.currentLang.set(lang);
    localStorage.setItem(LANG_KEY, lang);
  }
}
