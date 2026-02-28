import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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

  currentServiceView: 'drivers' | 'carriers' = 'drivers';

  driverServices = [
    { icon: 'person', title: 'Personal Safety Expert', description: 'Have questions or concerns in regards to your driving privileges, received a DOT inspection, a citation and need a consultation, fill free to contact us' },
    { icon: 'ticket', title: 'Submit your ticket', description: 'We help you to fight tickets in all states. We won thousands of cases, we can help with yours.' },
    { icon: 'car-crash', title: 'Accident, claims', description: 'Have an accident or struggling with a claim, we can connect with our experts to offer you an advice.' },
    { icon: 'screen-search', title: 'MVR', description: 'Monitor your motor vehicle record, to keep your driving record in a good standing.' }
  ];

  carrierServices = [
    { icon: 'driver-ticket', title: "Driver's Tickets", description: "Maintain your\u2019s CSA scores, by directing the drivers to the best attorney in USA" },
    { icon: 'DOT', title: 'DOT, MC Set up, Audit', description: 'We help you to establish a new company. Contact us to understand what are the steps.' },
    { icon: 'DQF', title: 'DQF, MVR', description: "Create with us a Driver Qualification File that will be in compliance with Federal Motor Carriers Regulations. We will help to monitor your driver\u2019s record and help to avoid Driver Fitness violations." },
    { icon: 'inspections', title: 'Inspections, DataQs', description: 'Have an expert opinion about driver inspections on the road, removing CSA points is essential.' },
    { icon: 'safety-training', title: 'Safety Training', description: 'Improve your Safety team skills by investing in their knowledge if you plan running a long term business.' },
    { icon: 'weekly-safety', title: 'Weekly Safety Services', description: 'Arrange weekly meetings with us to help maintain and monitor a Safety Culture in your company.' },
    { icon: 'mock-audit', title: 'Mock Audit', description: 'We can perform a mock audit to check if your are compliant.' },
    { icon: 'CSA', title: 'CSA Review', description: 'We help you to check your CSA scores on the monthly bases, and advice what steps have to be taken to improve it or monitor.' },
    { icon: 'accidents-claims', title: 'Accidents, Claims', description: 'If you have accidents, or claims, let our experts help you to manage them, so you minimize the cost.' },
    { icon: 'insurance', title: 'Insurance', description: 'Insurance is the highest cost. We helped to manage and control this cost' },
    { icon: 'hos', title: 'HOS', description: "Monitoring driver\u2019s compliance with HOS standards" },
    { icon: 'crash-lines', title: 'Crash lines', description: 'Report the accidents 24/7' },
    { icon: 'maintenance', title: 'Maintenance', description: 'Developing a comprehensive maintenance schedule' }
  ];

  get activeServices() {
    return this.currentServiceView === 'drivers' ? this.driverServices : this.carrierServices;
  }

  driverWorkSteps = [
    { svgIcon: 'document', title: 'You submit a ticket', description: 'Using our online application submit your ticket. All you have to enter is your name, cell phone for contact, description of your request and any supporting documents that might help us to understand the nature of your request.' },
    { svgIcon: 'document-ok', title: 'We review it immediately', description: 'You will receive SMS as soon as we start working on your request. And within an hour from this moment we will let you know what can be done in your specific case.' },
    { svgIcon: 'approved', title: 'We guarantee 100% resolution', description: 'We work with the best traffic lawyers in U.S. and have already won thousands of cases. So if we take your case, we guarantee its resolution.' }
  ];

  carrierWorkSteps = [
    { svgIcon: 'document', title: 'You submit a request', description: 'Using our online application submit your request. All you have to enter is your name, cell phone for contact, description of your request and any supporting documents that might help us to understand the nature of your request.' },
    { svgIcon: 'document-ok', title: 'We review it immediately', description: 'You will receive SMS as soon as we start working on your request. And within an hour from this moment we will let you know what can be done in your specific case.' }
  ];

  get activeWorkSteps() {
    return this.currentServiceView === 'drivers' ? this.driverWorkSteps : this.carrierWorkSteps;
  }

  benefits = [
    { svgIcon: 'person-call', title: '24/7 call center support' },
    { svgIcon: 'screen-point', title: 'Live tracking of a status of your case' },
    { svgIcon: 'two-documents', title: 'Unlimited free submissions' },
    { svgIcon: 'security', title: '100% security of all personal data' },
    { svgIcon: 'maintenance-files', title: 'Lifetime history of your cases with all attached documents' },
    { svgIcon: 'reload', title: 'Always updating knowledge base' }
  ];

  testimonials: Testimonial[] = [
    { name: 'Losta M.', text: 'I had a complicated CDL issue, but the CDL advisor lawyer handled it with expertise and professionalism. They provided me with sound legal advice and successfully resolved the matter in my favor.', image: 'assets/images/clients/Losta-M.jpeg' },
    { name: 'Karem S.', text: 'The CDL advisor\'s tips on maintaining a clean driving record were spot-on. Their emphasis on safety made me feel more confident and responsible as a commercial driver.', image: 'assets/images/clients/Karem-S.jpeg' },
    { name: 'Dimitrius T.', text: 'I can\u2019t thank the CDL advisor lawyer enough for their exceptional representation in court. They skillfully defended my case, and I couldn\u2019t be happier with the outcome.', image: 'assets/images/clients/Dimitrius-T.jpeg' },
    { name: 'Jorge T.', text: 'The CDL advisor took the time to explain the legal process in simple terms, making it less overwhelming for me. They were always available to answer my questions and address my concerns', image: 'assets/images/clients/Jorge-T.jpeg' },
    { name: 'Juan P.', text: 'Excellent experience from start to finish. Highly professional team that truly cares about their clients.', image: 'assets/images/clients/Juan-P.jpeg' },
    { name: 'Cemania P.', text: 'Very helpful and responsive team! They answered all my questions and guided me through the entire process.', image: 'assets/images/clients/Cemania-P.jpeg' },
    { name: 'Eric V.', text: 'Highly recommend their services. Professional and efficient. They resolved my case faster than I expected.', image: 'assets/images/clients/Eric-V.jpeg' },
    { name: 'Ivan M.', text: 'This company is very friendly, available all time any time. Very affordable and helpful services.', image: 'assets/images/clients/Ivan-M.jpeg' }
  ];
  currentTestimonialIndex = 0;
  testimonialPageCount = Math.ceil(this.testimonials.length / 4);

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    setInterval(() => this.nextSlide(), 5000);

    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        setTimeout(() => {
          const el = document.getElementById(fragment);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    });
  }

  nextSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.heroSlides.length;
  }

  prevSlide(): void {
    this.currentSlideIndex = this.currentSlideIndex === 0 ? this.heroSlides.length - 1 : this.currentSlideIndex - 1;
  }

  nextTestimonial(): void {
    this.currentTestimonialIndex = (this.currentTestimonialIndex + 1) % this.testimonialPageCount;
  }

  prevTestimonial(): void {
    this.currentTestimonialIndex = this.currentTestimonialIndex === 0 ? this.testimonialPageCount - 1 : this.currentTestimonialIndex - 1;
  }

  get visibleTestimonials(): Testimonial[] {
    const start = this.currentTestimonialIndex * 4;
    return this.testimonials.slice(start, start + 4);
  }

  scrollToSection(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }

  navigateToSignIn(): void {
    this.router.navigate(['/login']);
  }

  navigateToSubmit(): void {
    this.router.navigate(['/sign-in']);
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