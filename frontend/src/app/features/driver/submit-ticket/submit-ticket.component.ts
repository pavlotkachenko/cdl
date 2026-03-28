import {
  Component, OnInit, OnDestroy, signal, computed, inject, effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';

import { CaseService } from '../../../core/services/case.service';
import { OcrService, OCRResult } from '../../../core/services/ocr.service';
import { AuthService } from '../../../core/services/auth.service';
import { WizardStepperComponent, WizardStep } from '../../../shared/components/wizard-stepper/wizard-stepper.component';
import {
  VIOLATION_TYPE_REGISTRY,
  VIOLATION_CATEGORIES,
  type ConditionalField,
  type ViolationSeverity,
  resolveSelectLabel,
} from '../../../core/constants/violation-type-registry';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/heic'];

const OCR_TYPE_MAP: Record<string, string> = {
  'speeding': 'speeding',
  'speed': 'speeding',
  'logbook': 'hos_logbook',
  'hours of service': 'hos_logbook',
  'hos': 'hos_logbook',
  'inspection': 'dot_inspection',
  'dot': 'dot_inspection',
  'suspension': 'suspension',
  'suspended': 'suspension',
  'csa': 'csa_score',
  'dqf': 'dqf',
  'disqualification': 'dqf',
  'reckless': 'reckless_driving',
  'dui': 'dui',
  'dwi': 'dui',
  'seatbelt': 'seatbelt_cell_phone',
  'cell phone': 'seatbelt_cell_phone',
  'texting': 'seatbelt_cell_phone',
  'equipment': 'equipment_defect',
  'overweight': 'overweight_oversize',
  'oversize': 'overweight_oversize',
  'hazmat': 'hazmat',
  'hazardous': 'hazmat',
  'railroad': 'railroad_crossing',
  'railway': 'railroad_crossing',
};

interface ViolationChip {
  value: string;
  label: string;
  icon: string;
  severity: ViolationSeverity;
}

interface ViolationCategoryGroup {
  key: string;
  label: string;
  chips: ViolationChip[];
}

interface StateOption {
  code: string;
  name: string;
}

@Component({
  selector: 'app-submit-ticket',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    WizardStepperComponent,
  ],
  templateUrl: './submit-ticket.component.html',
  styleUrl: './submit-ticket.component.scss',
})
export class SubmitTicketComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private caseService = inject(CaseService);
  private ocrService = inject(OcrService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Stepper
  readonly STEPS: WizardStep[] = [
    { label: 'Scan' },
    { label: 'Type' },
    { label: 'Details' },
    { label: 'Review' },
  ];
  readonly currentStep = signal(0);

  // Violation type chips — derived from registry, grouped by category
  readonly VIOLATION_CATEGORIES: ViolationCategoryGroup[] = VIOLATION_CATEGORIES.map(cat => ({
    key: cat.key,
    label: cat.label,
    chips: cat.types
      .map(type => VIOLATION_TYPE_REGISTRY[type])
      .filter(Boolean)
      .map(config => ({
        value: config.value,
        label: config.label,
        icon: config.icon,
        severity: config.severity,
      })),
  }));

  // US States (full names + 2-letter codes)
  readonly STATES: StateOption[] = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
    { code: 'DC', name: 'District of Columbia' },
    { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  ];

  // Forms
  ticketTypeForm = this.fb.group({ type: ['', Validators.required] });

  ticketDetailsForm = this.fb.group({
    citationNumber: [''],
    violationDate: ['', Validators.required],
    state: ['', Validators.required],
    courtDate: [''],
    location: ['', Validators.required],
    fineAmount: [null as number | null],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
  });

  // Dynamic conditional fields form — rebuilt when violation type changes
  conditionalFieldsForm: FormGroup = this.fb.group({});
  readonly activeConditionalFields = signal<ConditionalField[]>([]);
  readonly conditionalFormValid = signal(true);
  private typeChangeSub?: Subscription;
  private conditionalValidSub?: Subscription;

  // OCR state
  ticketFile = signal<File | null>(null);
  ocrResult = signal<OCRResult | null>(null);
  scanning = signal(false);
  ocrFieldCount = computed(() => {
    const d = this.ocrResult()?.extractedData;
    if (!d) return 0;
    return [d.ticketNumber, d.violationDate, d.state, d.location, d.courtDate,
            (d as Record<string, unknown>)['fineAmount'],
            (d as Record<string, unknown>)['violationType']].filter(Boolean).length;
  });

  // Documents
  uploadedFiles = signal<File[]>([]);

  // Submission
  submitting = signal(false);
  submitted = signal(false);
  ticketId = signal('');
  error = signal('');

  // Computed
  readonly descriptionLength = signal(0);

  readonly isSpeedingType = computed(() => {
    return this.ticketTypeForm.get('type')?.value === 'speeding';
  });

  readonly progressPercent = computed(() => {
    return Math.round(((this.currentStep() + 1) / this.STEPS.length) * 100);
  });

  readonly selectedTypeName = computed(() => {
    const val = this.ticketTypeForm.get('type')?.value;
    return VIOLATION_TYPE_REGISTRY[val ?? '']?.label || val || '';
  });

  readonly selectedStateName = computed(() => {
    const code = this.ticketDetailsForm.get('state')?.value;
    return this.STATES.find(s => s.code === code)?.name || code || '';
  });

  readonly canProceedFromType = computed(() => {
    return this.ticketTypeForm.valid;
  });

  readonly canProceedFromDetails = computed(() => {
    return this.ticketDetailsForm.valid && this.conditionalFormValid();
  });

  ngOnInit(): void {
    // Track description length
    this.ticketDetailsForm.get('description')?.valueChanges.subscribe(val => {
      this.descriptionLength.set((val || '').length);
    });

    // Rebuild conditional fields when violation type changes
    this.typeChangeSub = this.ticketTypeForm.get('type')?.valueChanges.subscribe(type => {
      this.buildConditionalFields(type ?? '');
    });
  }

  ngOnDestroy(): void {
    this.typeChangeSub?.unsubscribe();
    this.conditionalValidSub?.unsubscribe();
  }

  /** Build a dynamic FormGroup for the selected violation type's conditional fields */
  private buildConditionalFields(violationType: string): void {
    this.conditionalValidSub?.unsubscribe();
    const config = VIOLATION_TYPE_REGISTRY[violationType];
    const fields = config?.conditionalFields ?? [];
    this.activeConditionalFields.set(fields);

    const group: Record<string, FormControl> = {};
    for (const field of fields) {
      const validators = [];
      if (field.required) validators.push(Validators.required);
      if (field.type === 'number' && field.validation) {
        if (field.validation.min !== undefined) validators.push(Validators.min(field.validation.min));
        if (field.validation.max !== undefined) validators.push(Validators.max(field.validation.max));
      }
      if (field.type === 'text' && field.validation?.maxLength) {
        validators.push(Validators.maxLength(field.validation.maxLength));
      }
      const initial = field.type === 'boolean' ? false : (field.type === 'number' ? null : '');
      group[field.key] = new FormControl(initial, validators);
    }

    this.conditionalFieldsForm = this.fb.group(group);
    this.conditionalFormValid.set(this.conditionalFieldsForm.valid);

    this.conditionalValidSub = this.conditionalFieldsForm.statusChanges.subscribe(() => {
      this.conditionalFormValid.set(this.conditionalFieldsForm.valid);
    });
  }

  /** Toggle a boolean conditional field value */
  toggleBooleanField(key: string): void {
    const ctrl = this.conditionalFieldsForm.get(key);
    if (ctrl) ctrl.setValue(!ctrl.value);
  }

  /** Get the display value for a conditional field in the review step */
  getConditionalFieldDisplayValue(field: ConditionalField): string {
    const value = this.conditionalFieldsForm.get(field.key)?.value;
    if (value === null || value === undefined || value === '') return '';
    if (field.type === 'boolean') return value ? 'Yes' : 'No';
    if (field.type === 'select') return resolveSelectLabel(field, String(value));
    return String(value);
  }

  // --- Navigation ---

  goToStep(step: number): void {
    if (step >= 0 && step < this.STEPS.length) {
      this.currentStep.set(step);
    }
  }

  nextStep(): void {
    this.goToStep(this.currentStep() + 1);
  }

  prevStep(): void {
    this.goToStep(this.currentStep() - 1);
  }

  // --- Violation Type Chips ---

  selectViolationType(value: string): void {
    this.ticketTypeForm.get('type')?.setValue(value);
  }

  onChipKeydown(event: KeyboardEvent, value: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectViolationType(value);
    }
  }

  // --- OCR ---

  onScanFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      this.snackBar.open('File exceeds 10 MB limit.', 'Close', { duration: 3000 });
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      this.snackBar.open('Only PDF, JPG, PNG, HEIC allowed.', 'Close', { duration: 3000 });
      return;
    }

    this.ticketFile.set(file);
    this.scanning.set(true);
    this.ocrResult.set(null);

    this.ocrService.processTicketImage(file).subscribe({
      next: (result) => {
        this.ocrResult.set(result);
        this.scanning.set(false);
        this.applyOcrResults(result);
        this.nextStep(); // Auto-advance to Type step
      },
      error: () => {
        this.scanning.set(false);
        this.snackBar.open(
          'Could not scan ticket. Please fill in details manually.',
          'Close', { duration: 4000 },
        );
      },
    });
  }

  applyOcrResults(result: OCRResult): void {
    const d = result.extractedData;
    const patch: Record<string, unknown> = {};
    if (d.ticketNumber) patch['citationNumber'] = d.ticketNumber;
    if (d.violationDate) patch['violationDate'] = d.violationDate;
    if (d.state) patch['state'] = d.state;
    if (d.location) patch['location'] = d.location;
    if (d.courtDate) patch['courtDate'] = d.courtDate;

    const ext = d as Record<string, unknown>;
    if (ext['fineAmount']) patch['fineAmount'] = ext['fineAmount'];

    this.ticketDetailsForm.patchValue(patch);

    // Map OCR violation type to chip (triggers conditional field rebuild)
    if (ext['violationType']) {
      const raw = String(ext['violationType']).toLowerCase().trim();
      const mapped = OCR_TYPE_MAP[raw];
      if (mapped) {
        this.ticketTypeForm.get('type')?.setValue(mapped);
      }
    }

    // Apply OCR-extracted alleged speed to conditional field if speeding
    if (ext['allegedSpeed'] && this.conditionalFieldsForm.get('alleged_speed')) {
      this.conditionalFieldsForm.get('alleged_speed')?.setValue(ext['allegedSpeed']);
    }
  }

  // --- Documents ---

  onFileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    const current = this.uploadedFiles();
    const toAdd: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        this.snackBar.open(`${file.name} exceeds 10 MB limit.`, 'Close', { duration: 3000 });
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        this.snackBar.open(`${file.name}: only PDF, JPG, PNG allowed.`, 'Close', { duration: 3000 });
        continue;
      }
      if (current.length + toAdd.length >= 10) {
        this.snackBar.open('Maximum 10 documents allowed.', 'Close', { duration: 3000 });
        break;
      }
      toAdd.push(file);
    }
    if (toAdd.length) this.uploadedFiles.set([...current, ...toAdd]);
  }

  removeFile(index: number): void {
    this.uploadedFiles.update(files => files.filter((_, i) => i !== index));
  }

  getFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  // --- Submission ---

  submitTicket(): void {
    if (this.ticketTypeForm.invalid || this.ticketDetailsForm.invalid || this.conditionalFieldsForm.invalid) {
      this.error.set('Please fill in all required fields.');
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    const user = this.authService.currentUserValue;
    const details = this.ticketDetailsForm.value;
    const type = this.ticketTypeForm.value.type ?? '';

    const payload: Record<string, unknown> = {
      customer_name: user?.name || 'Unknown',
      customer_type: 'one_time_driver',
      violation_type: type,
      violation_date: details.violationDate,
      violation_details: details.description,
      state: details.state,
      town: details.location,
    };

    // Optional common fields
    if (details.citationNumber) payload['citation_number'] = details.citationNumber;
    if (details.fineAmount != null) payload['fine_amount'] = details.fineAmount;
    if (details.courtDate) payload['court_date'] = details.courtDate;
    if (user?.phone) payload['driver_phone'] = user.phone;

    // Build type_specific_data from conditional fields (exclude empty values)
    const conditionalValues = this.conditionalFieldsForm.value;
    const typeSpecificData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(conditionalValues)) {
      if (value !== null && value !== undefined && value !== '') {
        typeSpecificData[key] = value;
      }
    }
    if (Object.keys(typeSpecificData).length > 0) {
      payload['type_specific_data'] = typeSpecificData;
    }

    // Backward compat: speeding alleged_speed also as top-level
    if (type === 'speeding' && typeSpecificData['alleged_speed'] != null) {
      payload['alleged_speed'] = typeSpecificData['alleged_speed'];
    }

    // Auto-populate severity from registry
    const config = VIOLATION_TYPE_REGISTRY[type];
    if (config) {
      payload['violation_severity'] = config.severity;
    }

    // If conditional fields include a regulation code, send it as top-level too
    if (typeSpecificData['violation_regulation_code']) {
      payload['violation_regulation_code'] = typeSpecificData['violation_regulation_code'];
    }

    this.caseService.createCase(payload).subscribe({
      next: (response: any) => {
        this.ticketId.set(response.case?.id ?? response.id ?? response.data?.id ?? 'TCK-NEW');
        this.submitted.set(true);
        this.submitting.set(false);
      },
      error: () => {
        this.error.set('Failed to submit ticket. Please try again.');
        this.submitting.set(false);
      },
    });
  }

  viewTicket(): void {
    this.router.navigate(['/driver/cases', this.ticketId()]);
  }

  submitAnother(): void {
    this.submitted.set(false);
    this.currentStep.set(0);
    this.ticketTypeForm.reset();
    this.ticketDetailsForm.reset();
    this.conditionalFieldsForm = this.fb.group({});
    this.activeConditionalFields.set([]);
    this.conditionalFormValid.set(true);
    this.uploadedFiles.set([]);
    this.ocrResult.set(null);
    this.ticketFile.set(null);
    this.error.set('');
    this.ticketId.set('');
  }

  goToDashboard(): void {
    this.router.navigate(['/driver/dashboard']);
  }
}
