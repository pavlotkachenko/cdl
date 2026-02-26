/**
 * Ticket Upload Wizard Component - Multi-step guided ticket upload with OCR
 * Location: frontend/src/app/features/driver/ticket-upload-wizard/ticket-upload-wizard.component.ts
 */

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { OcrService, OCRResult, OCRValidationError } from '../../../core/services/ocr.service';
import { CaseService } from '../../../core/services/case.service';
import { AuthService } from '../../../core/services/auth.service';

interface DocumentChecklistItem {
  id: string;
  name: string;
  required: boolean;
  uploaded: boolean;
  file?: File;
}

@Component({
  selector: 'app-ticket-upload-wizard',
  templateUrl: './ticket-upload-wizard.component.html',
  styleUrls: ['./ticket-upload-wizard.component.scss']
})
export class TicketUploadWizardComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  // Forms for each step
  uploadForm!: FormGroup;
  ocrReviewForm!: FormGroup;
  detailsForm!: FormGroup;
  documentsForm!: FormGroup;

  // Step 1: Upload
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  useCamera = false;
  cameraStream: MediaStream | null = null;
  processingOCR = false;

  // Step 2: OCR Results
  ocrResult: OCRResult | null = null;
  ocrErrors: OCRValidationError[] = [];
  confidenceLevel: any = null;

  // Step 3: Additional Details
  violationTypes: string[] = [];
  states: Array<{ code: string; name: string }> = [];

  // Step 4: Document Checklist
  documentChecklist: DocumentChecklistItem[] = [
    { id: 'ticket', name: 'Traffic Ticket (Required)', required: true, uploaded: false },
    { id: 'license', name: 'Driver License', required: false, uploaded: false },
    { id: 'insurance', name: 'Insurance Card', required: false, uploaded: false },
    { id: 'registration', name: 'Vehicle Registration', required: false, uploaded: false },
    { id: 'photos', name: 'Scene Photos', required: false, uploaded: false }
  ];

  // Step 5: Review
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private ocrService: OcrService,
    private caseService: CaseService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadDropdownData();
  }

  /**
   * Initialize all forms
   */
  initializeForms(): void {
    this.uploadForm = this.fb.group({
      uploadMethod: ['file', Validators.required]
    });

    this.ocrReviewForm = this.fb.group({
      ticketNumber: ['', Validators.required],
      violationType: ['', Validators.required],
      violationDate: ['', Validators.required],
      violationTime: [''],
      location: [''],
      state: ['', Validators.required],
      officerName: [''],
      officerBadge: [''],
      fineAmount: [''],
      courtDate: [''],
      courtLocation: [''],
      licensePlate: [''],
      vehicleInfo: ['']
    });

    this.detailsForm = this.fb.group({
      driverNotes: [''],
      contestReason: [''],
      priorViolations: [false],
      requestTrafficSchool: [false],
      urgency: ['normal']
    });

    this.documentsForm = this.fb.group({
      additionalDocuments: [[]]
    });
  }

  /**
   * Load dropdown data
   */
  loadDropdownData(): void {
    this.ocrService.getViolationTypes().subscribe({
      next: (types) => {
        this.violationTypes = types;
      },
      error: (error) => {
        console.error('Error loading violation types:', error);
      }
    });

    this.ocrService.getStates().subscribe({
      next: (states) => {
        this.states = states;
      },
      error: (error) => {
        console.error('Error loading states:', error);
      }
    });
  }

  /**
   * STEP 1: File Upload
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedFile = file;
      
      // Generate preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.snackBar.open('Please select a valid image file', 'Close', { duration: 3000 });
    }
  }

  /**
   * Start camera for photo capture
   */
  async startCamera(): Promise<void> {
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.cameraStream;
      }
      
      this.useCamera = true;
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.snackBar.open('Unable to access camera', 'Close', { duration: 3000 });
    }
  }

  /**
   * Capture photo from camera
   */
  capturePhoto(): void {
    if (this.videoElement && this.canvasElement) {
      const video = this.videoElement.nativeElement;
      const canvas = this.canvasElement.nativeElement;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          this.selectedFile = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          this.imagePreview = canvas.toDataURL('image/jpeg');
          this.stopCamera();
          this.useCamera = false;
        }
      }, 'image/jpeg');
    }
  }

  /**
   * Stop camera stream
   */
  stopCamera(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
  }

  /**
   * Process image with OCR and move to next step
   */
  processWithOCR(): void {
    if (!this.selectedFile) {
      this.snackBar.open('Please select or capture an image first', 'Close', { duration: 3000 });
      return;
    }

    this.processingOCR = true;

    this.ocrService.processTicketImage(this.selectedFile).subscribe({
      next: (result) => {
        this.ocrResult = result;
        this.confidenceLevel = this.ocrService.getConfidenceLevel(result.confidence);
        
        // Populate form with OCR results
        if (result.success && result.extractedData) {
          this.ocrReviewForm.patchValue(result.extractedData);
        }

        // Validate extracted data
        this.ocrErrors = this.ocrService.validateOCRData(result.extractedData);

        this.processingOCR = false;
        this.stepper.next();
      },
      error: (error) => {
        console.error('OCR processing error:', error);
        this.snackBar.open('Error processing image. Please try again.', 'Close', { duration: 3000 });
        this.processingOCR = false;
      }
    });
  }

  /**
   * Skip OCR and enter manually
   */
  skipOCR(): void {
    this.stepper.next();
  }

  /**
   * STEP 2: Review and Edit OCR Results
   */
  getErrorsForField(field: string): OCRValidationError[] {
    return this.ocrErrors.filter(e => e.field === field);
  }

  hasError(field: string): boolean {
    return this.ocrErrors.some(e => e.field === field && e.severity === 'error');
  }

  hasWarning(field: string): boolean {
    return this.ocrErrors.some(e => e.field === field && e.severity === 'warning');
  }

  /**
   * STEP 4: Upload Additional Documents
   */
  onDocumentSelected(event: any, item: DocumentChecklistItem): void {
    const file = event.target.files[0];
    if (file) {
      item.file = file;
      item.uploaded = true;
    }
  }

  removeDocument(item: DocumentChecklistItem): void {
    item.file = undefined;
    item.uploaded = false;
  }

  canProceedToReview(): boolean {
    const requiredItems = this.documentChecklist.filter(item => item.required);
    return requiredItems.every(item => item.uploaded);
  }

  /**
   * STEP 5: Review and Submit
   */
  getReviewData(): any {
    return {
      ticket: this.ocrReviewForm.value,
      details: this.detailsForm.value,
      documents: this.documentChecklist.filter(item => item.uploaded),
      ocrConfidence: this.ocrResult?.confidence,
      imageUrl: this.imagePreview
    };
  }

  /**
   * Submit case
   */
  submitCase(): void {
    if (!this.ocrReviewForm.valid) {
      this.snackBar.open('Please complete all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.submitting = true;
    const currentUser = this.authService.currentUserValue;

    const caseData = {
      driverId: currentUser?.userId,
      ...this.ocrReviewForm.value,
      ...this.detailsForm.value,
      status: 'new',
      priority: this.detailsForm.value.urgency === 'urgent' ? 'high' : 'medium',
      ocrConfidence: this.ocrResult?.confidence,
      ocrRawText: this.ocrResult?.rawText
    };

    this.caseService.createCase(caseData).subscribe({
      next: (createdCase) => {
        // Upload documents
        const uploadPromises = this.documentChecklist
          .filter(item => item.uploaded && item.file)
          .map(item => this.uploadDocument(createdCase.caseId, item.file!, item.id));

        Promise.all(uploadPromises).then(() => {
          this.submitting = false;
          this.snackBar.open('Case submitted successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/driver/dashboard']);
        }).catch((error) => {
          console.error('Error uploading documents:', error);
          this.submitting = false;
          this.snackBar.open('Case created but some documents failed to upload', 'Close', { duration: 5000 });
        });
      },
      error: (error) => {
        console.error('Error creating case:', error);
        this.submitting = false;
        this.snackBar.open('Error submitting case. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }

  /**
   * Upload document for case
   */
  private uploadDocument(caseId: string, file: File, documentType: string): Promise<any> {
    return this.caseService.uploadDocument(caseId, file, documentType).toPromise();
  }

  /**
   * Navigate back
   */
  goBack(): void {
    this.router.navigate(['/driver/dashboard']);
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.stopCamera();
  }
}
