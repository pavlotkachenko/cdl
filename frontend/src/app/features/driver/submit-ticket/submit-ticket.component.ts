// ============================================
// Submit Ticket Component
// Location: frontend/src/app/features/driver/submit-ticket/submit-ticket.component.ts
// ============================================

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Services
import { CaseService } from '../../../core/services/case.service';

@Component({
  selector: 'app-submit-ticket',
  standalone: true,
  templateUrl: './submit-ticket.component.html',
  styleUrls: ['./submit-ticket.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule
  ]
})
export class SubmitTicketComponent implements OnInit {
   @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>; 
   
  ticketTypeForm!: FormGroup;
  ticketDetailsForm!: FormGroup;
  documentsForm!: FormGroup;
  
  submitting = false;
  submitted = false;
  error = '';
  ticketId = '';

  ticketTypes = [
    { value: 'speeding', label: 'Speeding Violation' },
    { value: 'cdl_violation', label: 'CDL Violation' },
    { value: 'traffic', label: 'Traffic Violation' },
    { value: 'accident', label: 'Accident' },
    { value: 'parking', label: 'Parking Violation' },
    { value: 'weight_station', label: 'Weight Station Issue' },
    { value: 'logbook', label: 'Logbook Violation' },
    { value: 'other', label: 'Other' }
  ];

  states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  uploadedFiles: File[] = [];

  constructor(
    private fb: FormBuilder,
    private caseService: CaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForms();
  }

  private initializeForms(): void {
    // Step 1: Ticket Type
    this.ticketTypeForm = this.fb.group({
      type: ['', Validators.required]
    });

    // Step 2: Ticket Details
    this.ticketDetailsForm = this.fb.group({
      citationNumber: [''],
      violationDate: ['', Validators.required],
      state: ['', Validators.required],
      location: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      courtDate: [''],
      hasPreviousViolations: [false]
    });

    // Step 3: Documents (optional for now)
    this.documentsForm = this.fb.group({
      citationCopy: [null],
      supportingDocs: [null]
    });
  }

onFileSelected(event: any): void {
  const files: FileList = event.target.files;
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} has invalid type. Only PDF, JPG, and PNG are allowed.`);
        continue;
      }
      this.uploadedFiles.push(file);
    }
  }
}

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  getFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  submitTicket(): void {
    if (this.ticketTypeForm.invalid || this.ticketDetailsForm.invalid) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.submitting = true;
    this.error = '';

    const ticketData = {
      type: this.ticketTypeForm.value.type,
      ...this.ticketDetailsForm.value,
      status: 'submitted'
    };

    this.caseService.createCase(ticketData).subscribe({
      next: (response: any) => {
        this.submitted = true;
        this.submitting = false;
        this.ticketId = response.id || response.data?.id || 'TCK-NEW';
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/driver/dashboard']);
        }, 3000);
      },
      error: (err) => {
        this.error = 'Failed to submit ticket. Please try again.';
        this.submitting = false;
        console.error('Error submitting ticket:', err);
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/driver/dashboard']);
  }

  viewTicket(): void {
    this.router.navigate(['/driver/tickets', this.ticketId]);
  }

  submitAnother(): void {
    this.submitted = false;
    this.initializeForms();
    this.uploadedFiles = [];
  }
}
