import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CarrierService } from '../../../core/services/carrier.service';

@Component({
  selector: 'app-carrier-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="profile-page">
      <div class="profile-header">
        <button mat-icon-button (click)="goBack()" aria-label="Back to dashboard">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Company Profile</h1>
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="profileForm" (ngSubmit)="save()" class="profile-form">
              <mat-form-field appearance="outline">
                <mat-label>Company Name</mat-label>
                <input matInput formControlName="company_name">
                @if (profileForm.get('company_name')?.invalid && profileForm.get('company_name')?.touched) {
                  <mat-error>Company name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>USDOT Number</mat-label>
                <input matInput formControlName="usdot_number" readonly aria-readonly="true">
                <mat-hint>Cannot be changed after registration</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Contact Email</mat-label>
                <input matInput formControlName="email" type="email" autocomplete="email" readonly aria-readonly="true">
                <mat-hint>Cannot be changed here</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Phone Number</mat-label>
                <input matInput formControlName="phone_number" type="tel">
              </mat-form-field>

              <div class="toggle-row">
                <label for="notify-toggle">Email alerts for new driver tickets</label>
                <mat-slide-toggle id="notify-toggle" formControlName="notify_on_new_ticket"
                                  aria-label="Email alerts for new driver tickets">
                </mat-slide-toggle>
              </div>

              <div class="form-actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
                  @if (saving()) { <mat-spinner diameter="20"></mat-spinner> } @else { Save Changes }
                </button>
                <button mat-button type="button" (click)="goBack()">Cancel</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .profile-page { max-width: 520px; margin: 0 auto; padding: 24px 16px; }
    .profile-header { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
    .profile-header h1 { margin: 0; font-size: 1.4rem; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .profile-form { display: flex; flex-direction: column; gap: 12px; }
    .toggle-row { display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; font-size: 0.9rem; }
    .form-actions { display: flex; gap: 12px; padding-top: 8px; }
  `],
})
export class CarrierProfileComponent implements OnInit {
  private carrierService = inject(CarrierService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loading = signal(true);
  saving = signal(false);

  profileForm = this.fb.group({
    company_name: ['', Validators.required],
    usdot_number: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    phone_number: [''],
    notify_on_new_ticket: [false],
  });

  ngOnInit(): void {
    this.carrierService.getProfile().subscribe({
      next: (r) => {
        this.profileForm.patchValue(r.carrier);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const { company_name, phone_number, notify_on_new_ticket } = this.profileForm.value;
    this.carrierService.updateProfile({ company_name: company_name!, phone_number: phone_number ?? '', notify_on_new_ticket: notify_on_new_ticket ?? false }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Profile updated successfully.', 'Close', { duration: 3000 });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to save profile. Please try again.', 'Close', { duration: 3000 });
      },
    });
  }

  goBack(): void { this.router.navigate(['/carrier/dashboard']); }
}
