import {
  Component, ChangeDetectionStrategy, inject, input, output, signal, computed, OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { catchError, of, finalize } from 'rxjs';

import { CaseService } from '../../../core/services/case.service';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY',
];

const VIOLATION_TYPES = [
  'speeding', 'red_light', 'stop_sign', 'illegal_turn', 'reckless_driving',
  'dui', 'no_license', 'no_insurance', 'overweight', 'logbook',
  'equipment', 'lane_violation', 'following_too_close', 'improper_passing', 'other',
];

@Component({
  selector: 'app-case-edit-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatProgressSpinnerModule,
    TranslateModule, CurrencyPipe, DatePipe, TitleCasePipe,
  ],
  template: `
    <!-- Header -->
    <div class="edit-header">
      <h3 class="section-title">{{ 'OPR.EDIT.TITLE' | translate }}</h3>
      <div class="header-actions">
        @if (!editing() && !readonly()) {
          <button mat-stroked-button (click)="startEditing()" class="edit-btn" aria-label="Edit case details">
            <mat-icon>edit</mat-icon>
            {{ 'OPR.EDIT.EDIT' | translate }}
          </button>
        }
        @if (editing()) {
          <button mat-stroked-button (click)="cancel()" [disabled]="saving()" class="cancel-btn">
            {{ 'OPR.EDIT.CANCEL' | translate }}
          </button>
          <button mat-flat-button color="primary"
                  (click)="save()"
                  [disabled]="saving() || !form.valid || !isDirty()"
                  class="save-btn">
            @if (saving()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>save</mat-icon>
              {{ 'OPR.EDIT.SAVE' | translate }}
            }
          </button>
        }
      </div>
    </div>

    @if (error()) {
      <p class="form-error" role="alert">{{ error() }}</p>
    }

    <!-- View mode -->
    @if (!editing()) {
      <div class="field-grid view-mode">
        <div class="field-item">
          <span class="field-label">{{ 'OPR.EDIT.VIOLATION_TYPE' | translate }}</span>
          <span class="field-value">{{ caseData().violation_type || '—' }}</span>
        </div>
        <div class="field-item">
          <span class="field-label">{{ 'OPR.EDIT.VIOLATION_DATE' | translate }}</span>
          <span class="field-value">{{ caseData().violation_date | date:'mediumDate' }}</span>
        </div>
        <div class="field-item field-wide">
          <span class="field-label">{{ 'OPR.EDIT.VIOLATION_DETAILS' | translate }}</span>
          <span class="field-value">{{ caseData().violation_details || '—' }}</span>
        </div>
        <div class="field-item">
          <span class="field-label">{{ 'OPR.EDIT.STATE' | translate }}</span>
          <span class="field-value">{{ caseData().state || '—' }}</span>
        </div>
        <div class="field-item">
          <span class="field-label">{{ 'OPR.EDIT.COUNTY' | translate }}</span>
          <span class="field-value">{{ caseData().county || '—' }}</span>
        </div>
        <div class="field-item">
          <span class="field-label">{{ 'OPR.EDIT.TOWN' | translate }}</span>
          <span class="field-value">{{ caseData().town || '—' }}</span>
        </div>
        <div class="field-item">
          <span class="field-label">{{ 'OPR.EDIT.COURT_DATE' | translate }}</span>
          <span class="field-value">{{ caseData().court_date | date:'mediumDate' }}</span>
        </div>
        <div class="field-item">
          <span class="field-label">{{ 'OPR.EDIT.NEXT_ACTION_DATE' | translate }}</span>
          <span class="field-value">{{ caseData().next_action_date | date:'mediumDate' }}</span>
        </div>
        <div class="field-item">
          <span class="field-label">{{ 'OPR.EDIT.FINE_AMOUNT' | translate }}</span>
          <span class="field-value">
            @if (caseData().attorney_price != null) {
              {{ caseData().attorney_price | currency:'USD':'symbol':'1.0-0' }}
            } @else { — }
          </span>
        </div>
        <div class="field-item">
          <span class="field-label">{{ 'OPR.EDIT.COURT_FEE' | translate }}</span>
          <span class="field-value">
            @if (caseData().court_fee != null) {
              {{ caseData().court_fee | currency:'USD':'symbol':'1.0-0' }}
            } @else { — }
          </span>
        </div>
        <div class="field-item">
          <span class="field-label">{{ 'OPR.EDIT.CARRIER' | translate }}</span>
          <span class="field-value">{{ caseData().carrier || '—' }}</span>
        </div>
        <!-- Non-editable fields -->
        <div class="field-item locked">
          <span class="field-label"><mat-icon class="lock-icon">lock</mat-icon>{{ 'OPR.EDIT.CASE_NUMBER' | translate }}</span>
          <span class="field-value">{{ caseData().case_number }}</span>
        </div>
        <div class="field-item locked">
          <span class="field-label"><mat-icon class="lock-icon">lock</mat-icon>{{ 'OPR.EDIT.CREATED' | translate }}</span>
          <span class="field-value">{{ caseData().created_at | date:'mediumDate' }}</span>
        </div>
      </div>
    }

    <!-- Edit mode -->
    @if (editing()) {
      <form [formGroup]="form" class="field-grid edit-mode" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'OPR.EDIT.VIOLATION_TYPE' | translate }}</mat-label>
          <mat-select formControlName="violation_type">
            @for (vt of violationTypes; track vt) {
              <mat-option [value]="vt">{{ vt | titlecase }}</mat-option>
            }
          </mat-select>
          @if (form.controls.violation_type.hasError('required')) {
            <mat-error>{{ 'OPR.EDIT.REQUIRED' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'OPR.EDIT.VIOLATION_DATE' | translate }}</mat-label>
          <input matInput type="date" formControlName="violation_date">
          @if (form.controls.violation_date.hasError('required')) {
            <mat-error>{{ 'OPR.EDIT.REQUIRED' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-wide">
          <mat-label>{{ 'OPR.EDIT.VIOLATION_DETAILS' | translate }}</mat-label>
          <textarea matInput formControlName="violation_details" rows="3"></textarea>
          @if (form.controls.violation_details.hasError('maxlength')) {
            <mat-error>{{ 'OPR.EDIT.MAX_LENGTH' | translate:{ max: 2000 } }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'OPR.EDIT.STATE' | translate }}</mat-label>
          <mat-select formControlName="state">
            @for (s of usStates; track s) {
              <mat-option [value]="s">{{ s }}</mat-option>
            }
          </mat-select>
          @if (form.controls.state.hasError('required')) {
            <mat-error>{{ 'OPR.EDIT.REQUIRED' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'OPR.EDIT.COUNTY' | translate }}</mat-label>
          <input matInput formControlName="county">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'OPR.EDIT.TOWN' | translate }}</mat-label>
          <input matInput formControlName="town">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'OPR.EDIT.COURT_DATE' | translate }}</mat-label>
          <input matInput type="date" formControlName="court_date">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'OPR.EDIT.NEXT_ACTION_DATE' | translate }}</mat-label>
          <input matInput type="date" formControlName="next_action_date">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'OPR.EDIT.FINE_AMOUNT' | translate }}</mat-label>
          <input matInput type="number" formControlName="attorney_price" min="0">
          @if (form.controls.attorney_price.hasError('min')) {
            <mat-error>{{ 'OPR.EDIT.MIN_ZERO' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'OPR.EDIT.COURT_FEE' | translate }}</mat-label>
          <input matInput type="number" formControlName="court_fee" min="0">
          @if (form.controls.court_fee.hasError('min')) {
            <mat-error>{{ 'OPR.EDIT.MIN_ZERO' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'OPR.EDIT.CARRIER' | translate }}</mat-label>
          <input matInput formControlName="carrier">
        </mat-form-field>

        <!-- Non-editable locked fields -->
        <div class="field-item locked">
          <span class="field-label"><mat-icon class="lock-icon">lock</mat-icon>{{ 'OPR.EDIT.CASE_NUMBER' | translate }}</span>
          <span class="field-value">{{ caseData().case_number }}</span>
        </div>
        <div class="field-item locked">
          <span class="field-label"><mat-icon class="lock-icon">lock</mat-icon>{{ 'OPR.EDIT.CREATED' | translate }}</span>
          <span class="field-value">{{ caseData().created_at | date:'mediumDate' }}</span>
        </div>
      </form>
    }
  `,
  styles: [`
    :host { display: block; }

    .edit-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px; flex-wrap: wrap; gap: 8px;
    }
    .section-title { font-size: 1.1rem; font-weight: 600; margin: 0; }
    .header-actions { display: flex; gap: 8px; }
    .edit-btn, .cancel-btn, .save-btn { min-height: 44px; min-width: 44px; }

    .form-error {
      color: #C62828; background: #FFEBEE; padding: 8px 12px;
      border-radius: 4px; margin-bottom: 12px; font-size: 0.9rem;
    }

    .field-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px;
    }
    .field-wide { grid-column: 1 / -1; }

    /* View mode */
    .view-mode .field-item {
      display: flex; flex-direction: column; gap: 2px; padding: 6px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .field-label { font-size: 0.8rem; color: #666; font-weight: 500; display: flex; align-items: center; gap: 4px; }
    .field-value { font-size: 0.95rem; color: #222; }
    .lock-icon { font-size: 14px; width: 14px; height: 14px; color: #bbb; }
    .locked .field-value { color: #999; }

    /* Edit mode */
    .edit-mode mat-form-field { width: 100%; }

    @media (max-width: 768px) {
      .field-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class CaseEditFormComponent implements OnInit {
  caseData = input.required<any>();
  readonly = input(false);
  saved = output<any>();
  cancelled = output<void>();

  private fb = inject(FormBuilder);
  private caseService = inject(CaseService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  editing = signal(false);
  saving = signal(false);
  error = signal('');

  usStates = US_STATES;
  violationTypes = VIOLATION_TYPES;

  form = this.fb.group({
    violation_type: ['', Validators.required],
    violation_date: ['', Validators.required],
    violation_details: ['', Validators.maxLength(2000)],
    state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
    county: ['', Validators.maxLength(100)],
    town: ['', Validators.maxLength(100)],
    court_date: [''],
    next_action_date: [''],
    attorney_price: [null as number | null, [Validators.min(0)]],
    court_fee: [null as number | null, [Validators.min(0)]],
    carrier: ['', Validators.maxLength(255)],
  });

  private originalValues: Record<string, unknown> = {};

  ngOnInit(): void {
    this.populateForm();
  }

  startEditing(): void {
    this.populateForm();
    this.editing.set(true);
    this.error.set('');
  }

  cancel(): void {
    this.form.reset(this.originalValues as any);
    this.editing.set(false);
    this.error.set('');
    this.cancelled.emit();
  }

  save(): void {
    if (!this.form.valid || this.saving()) return;

    const changed = this.getChangedFields();
    if (Object.keys(changed).length === 0) return;

    this.saving.set(true);
    this.error.set('');

    this.caseService.patchCase(this.caseData().id, changed).pipe(
      finalize(() => this.saving.set(false)),
      catchError(err => {
        this.error.set(err?.error?.error?.message || this.translate.instant('OPR.EDIT.SAVE_FAILED'));
        return of(null);
      }),
    ).subscribe(result => {
      if (result) {
        this.snackBar.open(this.translate.instant('OPR.EDIT.SAVED'), 'OK', { duration: 3000 });
        this.editing.set(false);
        this.saved.emit(result.case || result);
      }
    });
  }

  isDirty(): boolean {
    return Object.keys(this.getChangedFields()).length > 0;
  }

  private populateForm(): void {
    const c = this.caseData();
    const values = {
      violation_type: c.violation_type || '',
      violation_date: this.toDateInput(c.violation_date),
      violation_details: c.violation_details || '',
      state: c.state || '',
      county: c.county || '',
      town: c.town || '',
      court_date: this.toDateInput(c.court_date),
      next_action_date: this.toDateInput(c.next_action_date),
      attorney_price: c.attorney_price ?? null,
      court_fee: c.court_fee ?? null,
      carrier: c.carrier || '',
    };
    this.form.patchValue(values);
    this.originalValues = { ...values };
  }

  private getChangedFields(): Record<string, unknown> {
    const current = this.form.getRawValue();
    const changed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(current)) {
      const original = (this.originalValues as any)[key];
      if (value !== original && !(value === '' && (original === '' || original == null))) {
        changed[key] = value;
      }
    }
    return changed;
  }

  private toDateInput(dateVal: string | Date | null | undefined): string {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }
}
