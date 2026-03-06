import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LandingHeaderComponent } from './components/landing-header/landing-header.component';
import { LandingFooterComponent } from './components/landing-footer/landing-footer.component';
import { CaseService } from '../../core/services/case.service';

interface Testimonial {
  name: string;
  text: string;
  image?: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    LandingHeaderComponent,
    LandingFooterComponent,
  ],
})
export class LandingComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly caseService = inject(CaseService);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly heroSlides = [
    { line1: 'We are #1 advisor', line2: 'in the trucking industry', image: 'card-panel-1' },
    { line1: '100% tickets', line2: 'resolution rate', image: 'card-panel-2' },
    { line1: 'Safety consulting', line2: 'for trucking companies', image: 'card-panel-3' },
    { line1: 'Services', line2: 'for drivers', image: 'card-panel-4' },
    { line1: 'We are proud', line2: 'of our team', image: 'card-panel-5' },
  ];

  readonly driverServices = [
    { icon: 'person', title: 'Personal Safety Expert', description: 'Have questions or concerns in regards to your driving privileges, received a DOT inspection, a citation and need a consultation, fill free to contact us' },
    { icon: 'ticket', title: 'Submit your ticket', description: 'We help you to fight tickets in all states. We won thousands of cases, we can help with yours.' },
    { icon: 'car-crash', title: 'Accident, claims', description: 'Have an accident or struggling with a claim, we can connect with our experts to offer you an advice.' },
    { icon: 'screen-search', title: 'MVR', description: 'Monitor your motor vehicle record, to keep your driving record in a good standing.' },
  ];

  readonly carrierServices = [
    { icon: 'driver-ticket', title: "Driver's Tickets", description: "Maintain your's CSA scores, by directing the drivers to the best attorney in USA" },
    { icon: 'DOT', title: 'DOT, MC Set up, Audit', description: 'We help you to establish a new company. Contact us to understand what are the steps.' },
    { icon: 'DQF', title: 'DQF, MVR', description: "Create with us a Driver Qualification File that will be in compliance with Federal Motor Carriers Regulations. We will help to monitor your driver's record and help to avoid Driver Fitness violations." },
    { icon: 'inspections', title: 'Inspections, DataQs', description: 'Have an expert opinion about driver inspections on the road, removing CSA points is essential.' },
    { icon: 'safety-training', title: 'Safety Training', description: 'Improve your Safety team skills by investing in their knowledge if you plan running a long term business.' },
    { icon: 'weekly-safety', title: 'Weekly Safety Services', description: 'Arrange weekly meetings with us to help maintain and monitor a Safety Culture in your company.' },
    { icon: 'mock-audit', title: 'Mock Audit', description: 'We can perform a mock audit to check if you are compliant.' },
    { icon: 'CSA', title: 'CSA Review', description: 'We help you to check your CSA scores on a monthly basis, and advise what steps have to be taken to improve or monitor it.' },
    { icon: 'accidents-claims', title: 'Accidents, Claims', description: 'If you have accidents or claims, let our experts help you to manage them so you minimize the cost.' },
    { icon: 'insurance', title: 'Insurance', description: 'Insurance is the highest cost. We help manage and control this cost.' },
    { icon: 'hos', title: 'HOS', description: "Monitoring driver's compliance with HOS standards" },
    { icon: 'crash-lines', title: 'Crash lines', description: 'Report accidents 24/7' },
    { icon: 'maintenance', title: 'Maintenance', description: 'Developing a comprehensive maintenance schedule' },
  ];

  readonly driverWorkSteps = [
    { svgIcon: 'document', title: 'You submit a ticket', description: 'Using our online application submit your ticket. All you have to enter is your name, cell phone for contact, description of your request and any supporting documents that might help us to understand the nature of your request.' },
    { svgIcon: 'document-ok', title: 'We review it immediately', description: 'You will receive SMS as soon as we start working on your request. And within an hour from this moment we will let you know what can be done in your specific case.' },
    { svgIcon: 'approved', title: 'We guarantee 100% resolution', description: 'We work with the best traffic lawyers in U.S. and have already won thousands of cases. So if we take your case, we guarantee its resolution.' },
  ];

  readonly carrierWorkSteps = [
    { svgIcon: 'document', title: 'You submit a request', description: 'Using our online application submit your request. All you have to enter is your name, cell phone for contact, description of your request and any supporting documents that might help us to understand the nature of your request.' },
    { svgIcon: 'document-ok', title: 'We review it immediately', description: 'You will receive SMS as soon as we start working on your request. And within an hour from this moment we will let you know what can be done in your specific case.' },
  ];

  readonly benefits = [
    { svgIcon: 'person-call', title: '24/7 call center support' },
    { svgIcon: 'screen-point', title: 'Live tracking of a status of your case' },
    { svgIcon: 'two-documents', title: 'Unlimited free submissions' },
    { svgIcon: 'security', title: '100% security of all personal data' },
    { svgIcon: 'maintenance-files', title: 'Lifetime history of your cases with all attached documents' },
    { svgIcon: 'reload', title: 'Always updating knowledge base' },
  ];

  readonly testimonials: Testimonial[] = [
    { name: 'Losta M.', text: 'I had a complicated CDL issue, but the CDL advisor lawyer handled it with expertise and professionalism. They provided me with sound legal advice and successfully resolved the matter in my favor.', image: 'assets/images/clients/Losta-M.jpeg' },
    { name: 'Karem S.', text: "The CDL advisor's tips on maintaining a clean driving record were spot-on. Their emphasis on safety made me feel more confident and responsible as a commercial driver.", image: 'assets/images/clients/Karem-S.jpeg' },
    { name: 'Dimitrius T.', text: "I can't thank the CDL advisor lawyer enough for their exceptional representation in court. They skillfully defended my case, and I couldn't be happier with the outcome.", image: 'assets/images/clients/Dimitrius-T.jpeg' },
    { name: 'Jorge T.', text: 'The CDL advisor took the time to explain the legal process in simple terms, making it less overwhelming for me. They were always available to answer my questions and address my concerns', image: 'assets/images/clients/Jorge-T.jpeg' },
    { name: 'Juan P.', text: 'Excellent experience from start to finish. Highly professional team that truly cares about their clients.', image: 'assets/images/clients/Juan-P.jpeg' },
    { name: 'Cemania P.', text: 'Very helpful and responsive team! They answered all my questions and guided me through the entire process.', image: 'assets/images/clients/Cemania-P.jpeg' },
    { name: 'Eric V.', text: 'Highly recommend their services. Professional and efficient. They resolved my case faster than I expected.', image: 'assets/images/clients/Eric-V.jpeg' },
    { name: 'Ivan M.', text: 'This company is very friendly, available all time any time. Very affordable and helpful services.', image: 'assets/images/clients/Ivan-M.jpeg' },
  ];

  readonly faqItems: FaqItem[] = [
    {
      question: 'How quickly can you handle my CDL ticket?',
      answer: 'We start reviewing your case within 1 hour of submission. Most cases are resolved within 5–30 business days depending on court schedules and violation type.',
    },
    {
      question: 'How much does it cost to fight a CDL ticket?',
      answer: 'Pricing depends on the violation type and state. We offer transparent, upfront pricing with no hidden fees. Submit your ticket and receive a quote before making any commitment.',
    },
    {
      question: 'Which states do you cover?',
      answer: 'We work with professional attorneys in all 50 US states and also handle federal DOT violations.',
    },
    {
      question: 'Will a traffic violation affect my CDL license?',
      answer: 'Yes — violations can impact your CDL through CSA score points, license suspension, or disqualification. Acting quickly to contest violations is critical to protecting your livelihood.',
    },
    {
      question: 'What types of violations do you handle?',
      answer: 'We handle speeding tickets, overweight violations, logbook violations, inspection failures, DOT violations, accidents and claims, MVR issues, and more.',
    },
    {
      question: 'Do I need to appear in court?',
      answer: 'In most cases, our attorneys can represent you without requiring your presence in court. We will let you know upfront if your attendance is required.',
    },
    {
      question: 'How do I upload my ticket?',
      answer: 'Simply submit your request using the form on this page. You can upload a photo or PDF of your citation, and our team will review it immediately.',
    },
    {
      question: 'What if we cannot get the ticket fully dismissed?',
      answer: 'Even when full dismissal is not possible, our attorneys negotiate to minimize CSA points, reduce fines, and protect your driving record from the worst consequences.',
    },
    {
      question: 'Is my personal information secure?',
      answer: 'Yes. We use bank-level encryption to protect all personal data and documents you share with us. Your information is never sold or shared with third parties.',
    },
    {
      question: 'Can carriers manage tickets for multiple drivers?',
      answer: 'Absolutely. Our platform allows fleet carriers to track and manage violations for all their drivers in one unified dashboard, with full visibility into CSA scores and case statuses.',
    },
  ];

  readonly testimonialPageCount = Math.ceil(this.testimonials.length / 4);
  readonly testimonialPages = Array.from({ length: this.testimonialPageCount }, (_, i) => i);

  currentSlideIndex = signal(0);
  currentServiceView = signal<'drivers' | 'carriers'>('drivers');
  currentTestimonialIndex = signal(0);
  submitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal('');
  uploadedFiles = signal<File[]>([]);
  openFaqIndex = signal<number | null>(null);

  activeServices = computed(() =>
    this.currentServiceView() === 'drivers' ? this.driverServices : this.carrierServices
  );

  activeWorkSteps = computed(() =>
    this.currentServiceView() === 'drivers' ? this.driverWorkSteps : this.carrierWorkSteps
  );

  visibleTestimonials = computed(() => {
    const start = this.currentTestimonialIndex() * 4;
    return this.testimonials.slice(start, start + 4);
  });

  submitForm!: FormGroup;
  private slideIntervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.slideIntervalId = setInterval(() => this.nextSlide(), 5000);

    this.submitForm = this.fb.group({
      customer_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      driver_phone: ['', Validators.required],
      violation_details: ['', Validators.required],
    });

    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        setTimeout(() => {
          document.getElementById(fragment)?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.slideIntervalId !== null) {
      clearInterval(this.slideIntervalId);
    }
  }

  nextSlide(): void {
    this.currentSlideIndex.update(i => (i + 1) % this.heroSlides.length);
  }

  prevSlide(): void {
    this.currentSlideIndex.update(i => (i === 0 ? this.heroSlides.length - 1 : i - 1));
  }

  nextTestimonial(): void {
    this.currentTestimonialIndex.update(i => (i + 1) % this.testimonialPageCount);
  }

  prevTestimonial(): void {
    this.currentTestimonialIndex.update(i => (i === 0 ? this.testimonialPageCount - 1 : i - 1));
  }

  toggleFaq(index: number): void {
    this.openFaqIndex.update(current => (current === index ? null : index));
  }

  scrollToSection(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }

  navigateToSignIn(): void {
    this.router.navigate(['/login']);
  }

  navigateToSubmit(): void {
    this.scrollToSection('contact');
  }

  getInitials(name: string): string {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/testimonials/placeholder.jpg';
    img.onerror = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;

    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const current = this.uploadedFiles();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        this.snackBar.open(`File ${file.name} is too large. Maximum 10MB.`, 'Close', { duration: 5000 });
        continue;
      }
      if (!allowed.includes(file.type)) {
        this.snackBar.open(`File ${file.name}: only PDF, JPG, PNG allowed.`, 'Close', { duration: 5000 });
        continue;
      }
      current.push(file);
    }
    this.uploadedFiles.set([...current]);
  }

  removeFile(index: number): void {
    this.uploadedFiles.update(files => files.filter((_, i) => i !== index));
  }

  getFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  triggerFileInput(): void {
    this.fileInput?.nativeElement?.click();
  }

  onSubmitRequest(): void {
    if (this.submitForm.invalid) {
      Object.keys(this.submitForm.controls).forEach(key =>
        this.submitForm.get(key)?.markAsTouched()
      );
      return;
    }

    this.submitting.set(true);
    this.submitError.set('');

    this.caseService.publicSubmit(this.submitForm.value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitSuccess.set(true);
        this.snackBar.open('Request submitted successfully! We will contact you within 1 hour.', 'Close', { duration: 5000 });
        this.submitForm.reset();
        this.uploadedFiles.set([]);
      },
      error: (error) => {
        this.submitting.set(false);
        const msg = error.error?.message || 'Failed to submit request. Please try again.';
        this.submitError.set(msg);
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      },
    });
  }
}
