import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-landing-header',
  templateUrl: './landing-header.component.html',
  styleUrls: ['./landing-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, MatButtonModule, MatIconModule, TranslateModule, LanguageSwitcherComponent],
})
export class LandingHeaderComponent {
  private readonly router = inject(Router);
  isMobileMenuOpen = signal(false);

  scrollToSection(sectionId: string): void {
    this.closeMobileMenu();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      this.router.navigate(['/'], { fragment: sectionId });
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  navigateToSignIn(): void {
    this.closeMobileMenu();
    this.router.navigate(['/sign-in']);
  }
}
