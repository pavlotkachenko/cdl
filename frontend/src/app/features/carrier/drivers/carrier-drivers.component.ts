import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CarrierService, FleetDriver } from '../../../core/services/carrier.service';

@Component({
  selector: 'app-carrier-drivers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="drivers-page">
      <h1>Fleet Drivers</h1>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search drivers</mat-label>
        <input matInput [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)"
               placeholder="Filter by name" aria-label="Search drivers">
        <mat-icon matSuffix aria-hidden="true">search</mat-icon>
      </mat-form-field>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (filteredDrivers().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">people_outline</mat-icon>
          <p>{{ drivers().length === 0 ? 'No drivers yet. Add your first driver below.' : 'No drivers match your search.' }}</p>
        </div>
      } @else {
        <div class="driver-list" role="list">
          @for (driver of filteredDrivers(); track driver.id) {
            <mat-card class="driver-card" role="listitem">
              <mat-card-content>
                <div class="driver-info">
                  <mat-icon aria-hidden="true">person</mat-icon>
                  <div>
                    <p class="driver-name">{{ driver.full_name }}</p>
                    <p class="driver-cdl">CDL: {{ driver.cdl_number }}</p>
                  </div>
                </div>
                <div class="driver-meta">
                  @if (driver.openCases > 0) {
                    <span [class]="'case-badge risk-' + (driver.openCases >= 3 ? 'red' : 'yellow')"
                          [attr.aria-label]="driver.full_name + ': ' + driver.openCases + ' open cases'">
                      {{ driver.openCases }} open {{ driver.openCases === 1 ? 'case' : 'cases' }}
                    </span>
                  }
                  <button mat-icon-button color="warn" (click)="removeDriver(driver.id)"
                          [attr.aria-label]="'Remove ' + driver.full_name">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      <mat-card class="add-card">
        <mat-card-header><mat-card-title>Add Driver</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="addForm" (ngSubmit)="addDriver()" class="add-form">
            <mat-form-field appearance="outline">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="full_name" placeholder="John Smith">
              @if (addForm.get('full_name')?.invalid && addForm.get('full_name')?.touched) {
                <mat-error>Full name is required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>CDL Number</mat-label>
              <input matInput formControlName="cdl_number" placeholder="CDL123456">
              @if (addForm.get('cdl_number')?.invalid && addForm.get('cdl_number')?.touched) {
                <mat-error>CDL number is required</mat-error>
              }
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" [disabled]="adding()">
              @if (adding()) { <mat-spinner diameter="20"></mat-spinner> } @else { Add Driver }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .drivers-page { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    h1 { margin: 0 0 16px; font-size: 1.4rem; }
    .search-field { width: 100%; margin-bottom: 16px; }
    .loading { display: flex; justify-content: center; padding: 32px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 32px; color: #999; text-align: center; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .driver-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .driver-card mat-card-content { display: flex; justify-content: space-between; align-items: center; }
    .driver-info { display: flex; align-items: center; gap: 12px; }
    .driver-name { margin: 0; font-weight: 500; }
    .driver-cdl { margin: 2px 0 0; font-size: 0.8rem; color: #666; }
    .driver-meta { display: flex; align-items: center; gap: 8px; }
    .case-badge { font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; font-weight: 600; }
    .risk-yellow { background: #fff3e0; color: #e65100; }
    .risk-red { background: #ffebee; color: #c62828; }
    .add-form { display: flex; flex-direction: column; gap: 8px; }
  `],
})
export class CarrierDriversComponent implements OnInit {
  private carrierService = inject(CarrierService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  drivers = signal<FleetDriver[]>([]);
  loading = signal(true);
  adding = signal(false);
  searchTerm = signal('');

  filteredDrivers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return term
      ? this.drivers().filter(d => d.full_name.toLowerCase().includes(term))
      : this.drivers();
  });

  addForm = this.fb.group({
    full_name: ['', Validators.required],
    cdl_number: ['', Validators.required],
  });

  ngOnInit(): void {
    this.carrierService.getDrivers().subscribe({
      next: (r) => { this.drivers.set(r.drivers); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  addDriver(): void {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    this.adding.set(true);
    const { full_name, cdl_number } = this.addForm.value;
    this.carrierService.addDriver({ full_name: full_name!, cdl_number: cdl_number! }).subscribe({
      next: (r) => {
        this.drivers.update(d => [r.driver, ...d]);
        this.addForm.reset();
        this.adding.set(false);
        this.snackBar.open('Driver added successfully.', 'Close', { duration: 3000 });
      },
      error: () => {
        this.adding.set(false);
        this.snackBar.open('Failed to add driver. Please try again.', 'Close', { duration: 3000 });
      },
    });
  }

  removeDriver(id: string): void {
    if (!confirm('Remove this driver from your fleet?')) return;
    this.carrierService.removeDriver(id).subscribe({
      next: () => {
        this.drivers.update(d => d.filter(dr => dr.id !== id));
        this.snackBar.open('Driver removed.', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to remove driver.', 'Close', { duration: 3000 });
      },
    });
  }
}
