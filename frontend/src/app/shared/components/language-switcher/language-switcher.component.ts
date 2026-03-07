import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';

const LANG_KEY = 'cdl_lang';

@Component({
  selector: 'app-language-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonToggleModule, FormsModule],
  template: `
    <mat-button-toggle-group [value]="currentLang()" (change)="switchLang($event.value)"
      aria-label="Select language" class="lang-toggle">
      <mat-button-toggle value="en">🇺🇸 EN</mat-button-toggle>
      <mat-button-toggle value="es">🇲🇽 ES</mat-button-toggle>
      <mat-button-toggle value="fr">🇫🇷 FR</mat-button-toggle>
    </mat-button-toggle-group>
  `,
  styles: [`
    .lang-toggle { height: 32px; font-size: 0.8rem; }
    ::ng-deep .lang-toggle .mat-button-toggle-button { height: 32px; line-height: 32px; padding: 0 10px; }
  `]
})
export class LanguageSwitcherComponent implements OnInit {
  private translate = inject(TranslateService);
  currentLang = signal(this.translate.currentLang || 'en');

  ngOnInit(): void {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && (saved === 'en' || saved === 'es' || saved === 'fr')) {
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
