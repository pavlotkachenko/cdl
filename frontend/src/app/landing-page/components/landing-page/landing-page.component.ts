import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { ServicesSectionComponent } from '../services-section/services-section.component';
import { HowWeWorkComponent } from '../how-we-work/how-we-work.component';
import { TestimonialsComponent } from '../testimonials/testimonials.component';
import { ContactSectionComponent } from '../contact-section/contact-section.component';
import { FooterComponent } from '../footer/footer.component';

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
    FooterComponent,
  ],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent {
  constructor() {}
}
