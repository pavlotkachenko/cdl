// ============================================
// Contact Us Component
// Location: frontend/src/app/features/driver/contact/contact.component.ts
// ============================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-contact',
  standalone: true,
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ]
})
export class ContactComponent {
  contactForm: FormGroup;
  submitting = false;

  contactReasons = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'case', label: 'Question About My Case' },
    { value: 'billing', label: 'Billing Question' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'feedback', label: 'Feedback or Suggestion' },
    { value: 'other', label: 'Other' }
  ];

  contactMethods = [
    {
      icon: 'email',
      title: 'Email',
      value: 'support@cdltickets.com',
      description: 'Response within 24 hours',
      link: 'mailto:support@cdltickets.com'
    },
    {
      icon: 'phone',
      title: 'Phone',
      value: '1-800-CDL-HELP',
      description: 'Mon-Fri 8AM-8PM EST',
      link: 'tel:1-800-235-4357'
    },
    {
      icon: 'location_on',
      title: 'Office',
      value: '123 Legal Street, Suite 500',
      description: 'New York, NY 10001',
      link: 'https://maps.google.com'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      reason: ['general', Validators.required],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    // Simulate API call
    setTimeout(() => {
      this.submitting = false;
      
      this.snackBar.open('Message sent successfully! We\'ll respond within 24 hours.', 'Close', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });

      this.contactForm.reset({
        reason: 'general'
      });
    }, 1500);
  }

  getErrorMessage(field: string): string {
    const control = this.contactForm.get(field);
    
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    
    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    
    return '';
  }
}
