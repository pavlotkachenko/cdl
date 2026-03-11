import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-header',
  imports: [CommonModule, MatButtonModule, MatIconModule, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  host: {
    '(window:scroll)': 'onWindowScroll()'
  }
})
export class HeaderComponent {
  isScrolled = false;
  isMobileMenuOpen = false;

  navigationLinks = [
    { labelKey: 'LANDING.NAV_SERVICES', url: '#services' },
    { labelKey: 'LANDING.NAV_ABOUT', url: '#about' },
    { labelKey: 'LANDING.NAV_CONTACT', url: '#contact' }
  ];

  constructor(private router: Router) {}

  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  scrollToSection(sectionId: string): void {
    this.isMobileMenuOpen = false;
    const element = document.getElementById(sectionId.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToSignup(): void {
    this.router.navigate(['/signup']);
  }
}
