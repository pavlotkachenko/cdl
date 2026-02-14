import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { LandingHeaderComponent } from './components/landing-header/landing-header.component';
import { LandingFooterComponent } from './components/landing-footer/landing-footer.component';

interface Testimonial {
  name: string;
  text: string;
  image?: string;
}

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: true,                                // ← THIS WAS MISSING
  imports: [                                       // ← THIS WAS MISSING
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    LandingHeaderComponent,
    LandingFooterComponent
  ]
})
export class LandingComponent implements OnInit {
  heroSlides = [
    { title: 'We are #1 advisor<br>in the trucking industry', subtitle: '', image: 'card-panel-1' },
    { title: '100% tickets<br>resolution rate', subtitle: '', image: 'card-panel-2' },
    { title: 'Safety consulting<br>for trucking companies', subtitle: '', image: 'card-panel-3' },
    { title: 'Services<br>for drivers', subtitle: '', image: 'card-panel-4' },
    { title: 'We are proud<br>of our team', subtitle: '', image: 'card-panel-5' }
  ];
  currentSlideIndex = 0;

  driverServices = [
    { icon: 'person', title: 'Personal Safety Expert', description: 'Have questions or concerns in regards to your driving privileges, received a DOT inspection, a citation and need a consultation, feel free to contact us' },
    { icon: 'confirmation_number', title: 'Submit your ticket', description: 'We help you to fight tickets in all states. We have won thousands of cases, we can help with yours.' },
    { icon: 'car_crash', title: 'Accident, claims', description: 'Have an accident or struggling with a claim, we can connect with our experts to offer you an advice.' },
    { icon: 'search', title: 'MVR', description: 'Monitor your motor vehicle record, to keep your driving record in a good standing.' }
  ];

  workSteps = [
    { icon: 'touch_app', title: 'You submit a ticket', description: 'Using our online application submit your ticket. All you have to enter is your name, cell phone for contact, description of your request and any supporting documents that might help us to understand the nature of your request.' },
    { icon: 'task_alt', title: 'We review it immediately', description: 'You will receive SMS as soon as we start working on your request. And within an hour from this moment we will let you know what can be done in your specific case.' },
    { icon: 'verified', title: 'We guarantee 100% resolution', description: 'We work with the best traffic lawyers in U.S. and have already won thousands of cases. So if we take your case, we guarantee its resolution.' }
  ];

  benefits = [
    { icon: 'support_agent', title: '24/7 call center support' },
    { icon: 'assessment', title: 'Live tracking of a status of your case' },
    { icon: 'description', title: 'Unlimited free submissions' },
    { icon: 'security', title: '100% security of all personal data' },
    { icon: 'folder', title: 'Lifetime history of your cases with all attached documents' },
    { icon: 'autorenew', title: 'Always updating knowledge base' }
  ];

  testimonials: Testimonial[] = [
    { name: 'Ivan M.', text: 'This company is very friendly, available all time any time. Very affordable and helpful services.', image: undefined },
    { name: 'Losta M.', text: 'I had a complicated CDL issue, but the CDL advisor lawyer handled it with expertise and professionalism.', image: 'assets/images/testimonials/Losta-M.jpeg' },
    { name: 'Karem S.', text: 'The CDL advisor\'s tips on maintaining a clean driving record were spot-on. Their emphasis on safety made me feel more confident and responsible as a commercial driver.', image: 'assets/images/testimonials/Karem-S.jpeg' },
    { name: 'Dimitrius T.', text: 'I can\'t thank the CDL advisor lawyer enough for their exceptional representation in court.', image: undefined },
    { name: 'Jorge T.', text: 'The CDL advisor took the time to explain the legal process in simple terms, making it less overwhelming for me.', image: 'assets/images/testimonials/Jorge-T.jpeg' },
    { name: 'Juan P.', text: 'Excellent experience from start to finish. Highly professional team.', image: 'assets/images/testimonials/Juan-P.jpeg' },
    { name: 'Cemania P.', text: 'Very helpful and responsive team! They answered all my questions.', image: 'assets/images/testimonials/Cemania-P.jpeg' },
    { name: 'Eric V.', text: 'Highly recommend their services. Professional and efficient.', image: 'assets/images/testimonials/Eric-V.jpeg' }
  ];
  currentTestimonialIndex = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    setInterval(() => this.nextSlide(), 5000);
  }

  nextSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.heroSlides.length;
  }

  prevSlide(): void {
    this.currentSlideIndex = this.currentSlideIndex === 0 ? this.heroSlides.length - 1 : this.currentSlideIndex - 1;
  }

  nextTestimonial(): void {
    this.currentTestimonialIndex = (this.currentTestimonialIndex + 1) % this.testimonials.length;
  }

  prevTestimonial(): void {
    this.currentTestimonialIndex = this.currentTestimonialIndex === 0 ? this.testimonials.length - 1 : this.currentTestimonialIndex - 1;
  }

  scrollToSection(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }

  navigateToSignIn(): void {
    this.router.navigate(['/login']);
  }

  navigateToSubmit(): void {
    this.router.navigate(['/driver/dashboard']);
  }

  // Fixed & safe initials
  getInitials(name: string): string {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }

  // Fallback for broken images
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/testimonials/placeholder.jpg';
    img.onerror = null;
  }
}