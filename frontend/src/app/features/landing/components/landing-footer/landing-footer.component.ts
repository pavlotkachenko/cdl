import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-footer',
  templateUrl: './landing-footer.component.html',
  styleUrls: ['./landing-footer.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class LandingFooterComponent {
  currentYear = new Date().getFullYear();

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}