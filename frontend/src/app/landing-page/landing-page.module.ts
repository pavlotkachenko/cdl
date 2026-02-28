import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LandingPageRoutingModule } from './landing-page-routing.module';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

// Container Component
import { LandingPageComponent } from './components/landing-page/landing-page.component';

// Section Components
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { ServicesSectionComponent } from './components/services-section/services-section.component';
import { HowWeWorkComponent } from './components/how-we-work/how-we-work.component';
import { PersonalExpertComponent } from './components/personal-expert/personal-expert.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { ContactSectionComponent } from './components/contact-section/contact-section.component';

// Shared Components
import { ServiceCardComponent } from './shared/service-card/service-card.component';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LandingPageRoutingModule,
    
    // Material
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonToggleModule,
    
    // Container
    LandingPageComponent,
    
    // Sections
    HeaderComponent,
    FooterComponent,
    HeroSectionComponent,
    ServicesSectionComponent,
    HowWeWorkComponent,
    PersonalExpertComponent,
    TestimonialsComponent,
    ContactSectionComponent,
    
    // Shared
    ServiceCardComponent
  ]
})
export class LandingPageModule { }
