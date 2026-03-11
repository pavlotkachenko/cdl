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
import { TranslateModule } from '@ngx-translate/core';

import { LandingHeaderComponent } from './components/landing-header/landing-header.component';
import { LandingFooterComponent } from './components/landing-footer/landing-footer.component';
import { CaseService } from '../../core/services/case.service';

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
    TranslateModule,
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
    { line1Key: 'LANDING.HERO_1_L1', line2Key: 'LANDING.HERO_1_L2', image: 'card-panel-1' },
    { line1Key: 'LANDING.HERO_2_L1', line2Key: 'LANDING.HERO_2_L2', image: 'card-panel-2' },
    { line1Key: 'LANDING.HERO_3_L1', line2Key: 'LANDING.HERO_3_L2', image: 'card-panel-3' },
    { line1Key: 'LANDING.HERO_4_L1', line2Key: 'LANDING.HERO_4_L2', image: 'card-panel-4' },
    { line1Key: 'LANDING.HERO_5_L1', line2Key: 'LANDING.HERO_5_L2', image: 'card-panel-5' },
  ];

  readonly driverServices = [
    { icon: 'person', titleKey: 'LANDING.SVC_DRV_1_TITLE', descKey: 'LANDING.SVC_DRV_1_DESC' },
    { icon: 'ticket', titleKey: 'LANDING.SVC_DRV_2_TITLE', descKey: 'LANDING.SVC_DRV_2_DESC' },
    { icon: 'car-crash', titleKey: 'LANDING.SVC_DRV_3_TITLE', descKey: 'LANDING.SVC_DRV_3_DESC' },
    { icon: 'screen-search', titleKey: 'LANDING.SVC_DRV_4_TITLE', descKey: 'LANDING.SVC_DRV_4_DESC' },
  ];

  readonly carrierServices = [
    { icon: 'driver-ticket', titleKey: 'LANDING.SVC_CAR_1_TITLE', descKey: 'LANDING.SVC_CAR_1_DESC' },
    { icon: 'DOT', titleKey: 'LANDING.SVC_CAR_2_TITLE', descKey: 'LANDING.SVC_CAR_2_DESC' },
    { icon: 'DQF', titleKey: 'LANDING.SVC_CAR_3_TITLE', descKey: 'LANDING.SVC_CAR_3_DESC' },
    { icon: 'inspections', titleKey: 'LANDING.SVC_CAR_4_TITLE', descKey: 'LANDING.SVC_CAR_4_DESC' },
    { icon: 'safety-training', titleKey: 'LANDING.SVC_CAR_5_TITLE', descKey: 'LANDING.SVC_CAR_5_DESC' },
    { icon: 'weekly-safety', titleKey: 'LANDING.SVC_CAR_6_TITLE', descKey: 'LANDING.SVC_CAR_6_DESC' },
    { icon: 'mock-audit', titleKey: 'LANDING.SVC_CAR_7_TITLE', descKey: 'LANDING.SVC_CAR_7_DESC' },
    { icon: 'CSA', titleKey: 'LANDING.SVC_CAR_8_TITLE', descKey: 'LANDING.SVC_CAR_8_DESC' },
    { icon: 'accidents-claims', titleKey: 'LANDING.SVC_CAR_9_TITLE', descKey: 'LANDING.SVC_CAR_9_DESC' },
    { icon: 'insurance', titleKey: 'LANDING.SVC_CAR_10_TITLE', descKey: 'LANDING.SVC_CAR_10_DESC' },
    { icon: 'hos', titleKey: 'LANDING.SVC_CAR_11_TITLE', descKey: 'LANDING.SVC_CAR_11_DESC' },
    { icon: 'crash-lines', titleKey: 'LANDING.SVC_CAR_12_TITLE', descKey: 'LANDING.SVC_CAR_12_DESC' },
    { icon: 'maintenance', titleKey: 'LANDING.SVC_CAR_13_TITLE', descKey: 'LANDING.SVC_CAR_13_DESC' },
  ];

  readonly driverWorkSteps = [
    { svgIcon: 'document', titleKey: 'LANDING.STEP_DRV_1_TITLE', descKey: 'LANDING.STEP_DRV_1_DESC' },
    { svgIcon: 'document-ok', titleKey: 'LANDING.STEP_DRV_2_TITLE', descKey: 'LANDING.STEP_DRV_2_DESC' },
    { svgIcon: 'approved', titleKey: 'LANDING.STEP_DRV_3_TITLE', descKey: 'LANDING.STEP_DRV_3_DESC' },
  ];

  readonly carrierWorkSteps = [
    { svgIcon: 'document', titleKey: 'LANDING.STEP_CAR_1_TITLE', descKey: 'LANDING.STEP_CAR_1_DESC' },
    { svgIcon: 'document-ok', titleKey: 'LANDING.STEP_CAR_2_TITLE', descKey: 'LANDING.STEP_CAR_2_DESC' },
  ];

  readonly benefits = [
    { svgIcon: 'person-call', titleKey: 'LANDING.BENEFIT_1' },
    { svgIcon: 'screen-point', titleKey: 'LANDING.BENEFIT_2' },
    { svgIcon: 'two-documents', titleKey: 'LANDING.BENEFIT_3' },
    { svgIcon: 'security', titleKey: 'LANDING.BENEFIT_4' },
    { svgIcon: 'maintenance-files', titleKey: 'LANDING.BENEFIT_5' },
    { svgIcon: 'reload', titleKey: 'LANDING.BENEFIT_6' },
  ];

  readonly testimonials = [
    { nameKey: 'LANDING.TEST_1_NAME', textKey: 'LANDING.TEST_1_TEXT', image: 'assets/images/clients/Losta-M.jpeg' },
    { nameKey: 'LANDING.TEST_2_NAME', textKey: 'LANDING.TEST_2_TEXT', image: 'assets/images/clients/Karem-S.jpeg' },
    { nameKey: 'LANDING.TEST_3_NAME', textKey: 'LANDING.TEST_3_TEXT', image: 'assets/images/clients/Dimitrius-T.jpeg' },
    { nameKey: 'LANDING.TEST_4_NAME', textKey: 'LANDING.TEST_4_TEXT', image: 'assets/images/clients/Jorge-T.jpeg' },
    { nameKey: 'LANDING.TEST_5_NAME', textKey: 'LANDING.TEST_5_TEXT', image: 'assets/images/clients/Juan-P.jpeg' },
    { nameKey: 'LANDING.TEST_6_NAME', textKey: 'LANDING.TEST_6_TEXT', image: 'assets/images/clients/Cemania-P.jpeg' },
    { nameKey: 'LANDING.TEST_7_NAME', textKey: 'LANDING.TEST_7_TEXT', image: 'assets/images/clients/Eric-V.jpeg' },
    { nameKey: 'LANDING.TEST_8_NAME', textKey: 'LANDING.TEST_8_TEXT', image: 'assets/images/clients/Ivan-M.jpeg' },
  ];

  readonly faqItems = [
    { questionKey: 'LANDING.FAQ_1_Q', answerKey: 'LANDING.FAQ_1_A' },
    { questionKey: 'LANDING.FAQ_2_Q', answerKey: 'LANDING.FAQ_2_A' },
    { questionKey: 'LANDING.FAQ_3_Q', answerKey: 'LANDING.FAQ_3_A' },
    { questionKey: 'LANDING.FAQ_4_Q', answerKey: 'LANDING.FAQ_4_A' },
    { questionKey: 'LANDING.FAQ_5_Q', answerKey: 'LANDING.FAQ_5_A' },
    { questionKey: 'LANDING.FAQ_6_Q', answerKey: 'LANDING.FAQ_6_A' },
    { questionKey: 'LANDING.FAQ_7_Q', answerKey: 'LANDING.FAQ_7_A' },
    { questionKey: 'LANDING.FAQ_8_Q', answerKey: 'LANDING.FAQ_8_A' },
    { questionKey: 'LANDING.FAQ_9_Q', answerKey: 'LANDING.FAQ_9_A' },
    { questionKey: 'LANDING.FAQ_10_Q', answerKey: 'LANDING.FAQ_10_A' },
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
