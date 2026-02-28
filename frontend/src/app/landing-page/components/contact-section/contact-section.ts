import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-section.html',
  styleUrl: './contact-section.scss'
})
export class ContactSectionComponent {
  contactForm: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  get f() {
    return this.contactForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.contactForm.invalid) {
      return;
    }

    console.log('Form submitted:', this.contactForm.value);
    // Handle form submission here
    alert('Thank you for contacting us! We will get back to you soon.');
    this.contactForm.reset();
    this.submitted = false;
  }
}
