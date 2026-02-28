import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { ServicesSectionComponent } from './components/services-section/services-section.component';
import { HowWeWorkComponent } from './components/how-we-work/how-we-work.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { ContactSectionComponent } from './components/contact-section/contact-section.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    HeaderComponent,
    HeroSectionComponent,
    ServicesSectionComponent,
    HowWeWorkComponent,
    TestimonialsComponent,
    ContactSectionComponent,
    FooterComponent
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {

}
