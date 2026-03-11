import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  socialLinks = [
    { icon: 'facebook', url: 'https://facebook.com', label: 'Facebook' },
    { icon: 'twitter', url: 'https://twitter.com', label: 'Twitter' },
    { icon: 'linkedin', url: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: 'instagram', url: 'https://instagram.com', label: 'Instagram' }
  ];

  companyLinks = [
    { labelKey: 'LANDING.FOOTER_ABOUT', url: '#about' },
    { labelKey: 'LANDING.FOOTER_SERVICES', url: '#services' },
    { labelKey: 'LANDING.FOOTER_PRICING', url: '#pricing' },
    { labelKey: 'LANDING.FOOTER_CONTACT_LINK', url: '#contact' }
  ];

  legalLinks = [
    { labelKey: 'LANDING.FOOTER_PRIVACY', url: '/privacy' },
    { labelKey: 'LANDING.FOOTER_TERMS', url: '/terms' },
    { labelKey: 'LANDING.FOOTER_COOKIES', url: '/cookies' }
  ];

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
