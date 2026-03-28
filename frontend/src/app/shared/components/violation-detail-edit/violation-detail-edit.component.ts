// ============================================
// Violation Detail Edit — Sprint 075 / VD-6
// Shared component for viewing and editing type-specific
// violation fields. Used by operator and attorney case detail views.
// Integrates with Material Design components (mat-form-field, etc.).
// ============================================

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
  VIOLATION_TYPE_REGISTRY,
  ACTIVE_VIOLATION_TYPES,
  resolveSelectLabel,
  type ConditionalField,
  type ViolationTypeConfig,
} from '../../../core/constants/violation-type-registry';

export interface ViolationDetailSaveEvent {
  type_specific_data: Record<string, unknown>;
  violation_regulation_code?: string;
  violation_severity?: string;
  violation_type?: string;
}

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'serious', label: 'Serious' },
  { value: 'standard', label: 'Standard' },
  { value: 'minor', label: 'Minor' },
];

@Component({
  selector: 'app-violation-detail-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  template: `
    <mat-card appearance="outlined" class="vd-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>description</mat-icon>
        <mat-card-title>Violation Details</mat-card-title>
        @if (!editing()) {
          <button mat-icon-button class="edit-btn" (click)="startEdit()" aria-label="Edit violation details">
            <mat-icon>edit</mat-icon>
          </button>
        }
      </mat-card-header>
      <mat-card-content>

        @if (!editing()) {
          <!-- Read-only view -->
          @if (config()) {
            <div class="detail-list">
              <div class="detail-row">
                <span class="detail-label">Violation Type</span>
                <span class="detail-value">{{ config()!.label }}</span>
              </div>
              @if (violationSeverity()) {
                <div class="detail-row">
                  <span class="detail-label">Severity</span>
                  <span class="detail-value severity-{{ violationSeverity() }}">{{ violationSeverity() }}</span>
                </div>
              }
              @if (violationRegulationCode()) {
                <div class="detail-row">
                  <span class="detail-label">Regulation</span>
                  <span class="detail-value">{{ violationRegulationCode() }}</span>
                </div>
              }
              @for (item of displayFields(); track item.field.key) {
                <div class="detail-row">
                  <span class="detail-label">{{ item.field.label }}</span>
                  <span class="detail-value">{{ formatValue(item.field, item.value) }}</span>
                </div>
              }
            </div>
          } @else {
            <p class="empty-msg">No violation details available.</p>
          }
        } @else {
          <!-- Edit mode -->
          <form [formGroup]="editForm" (ngSubmit)="save()">
            <!-- Violation type selector -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Violation Type</mat-label>
              <mat-select formControlName="violation_type">
                @for (vt of violationTypes; track vt.value) {
                  <mat-option [value]="vt.value">{{ vt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Severity -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Severity</mat-label>
              <mat-select formControlName="violation_severity">
                @for (s of severityOptions; track s.value) {
                  <mat-option [value]="s.value">{{ s.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Regulation code -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Regulation Code</mat-label>
              <input matInput formControlName="violation_regulation_code"
                     placeholder="e.g., 395.3(a)(1)">
            </mat-form-field>

            <!-- Dynamic conditional fields -->
            @if (editConditionalFields().length > 0) {
              <div class="conditional-fields" formGroupName="type_specific_data">
                @for (field of editConditionalFields(); track field.key) {
                  @switch (field.type) {
                    @case ('text') {
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>{{ field.label }}</mat-label>
                        <input matInput [formControlName]="field.key">
                        @if (field.helpText) {
                          <mat-hint>{{ field.helpText }}</mat-hint>
                        }
                      </mat-form-field>
                    }
                    @case ('number') {
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>{{ field.label }}</mat-label>
                        <input matInput type="number" [formControlName]="field.key"
                               [attr.min]="field.validation?.min"
                               [attr.max]="field.validation?.max"
                               [attr.step]="field.validation?.step ?? 1">
                        @if (field.helpText) {
                          <mat-hint>{{ field.helpText }}</mat-hint>
                        }
                      </mat-form-field>
                    }
                    @case ('select') {
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>{{ field.label }}</mat-label>
                        <mat-select [formControlName]="field.key">
                          <mat-option [value]="null">— None —</mat-option>
                          @for (opt of field.options; track opt.value) {
                            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                          }
                        </mat-select>
                        @if (field.helpText) {
                          <mat-hint>{{ field.helpText }}</mat-hint>
                        }
                      </mat-form-field>
                    }
                    @case ('date') {
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>{{ field.label }}</mat-label>
                        <input matInput type="date" [formControlName]="field.key">
                      </mat-form-field>
                    }
                    @case ('boolean') {
                      <div class="toggle-row">
                        <mat-slide-toggle [formControlName]="field.key">
                          {{ field.label }}
                        </mat-slide-toggle>
                        @if (field.helpText) {
                          <span class="toggle-hint">{{ field.helpText }}</span>
                        }
                      </div>
                    }
                  }
                }
              </div>
            }

            <div class="action-row">
              <button mat-flat-button color="primary" type="submit"
                      [disabled]="saving()">
                {{ saving() ? 'Saving...' : 'Save' }}
              </button>
              <button mat-stroked-button type="button" (click)="cancelEdit()">
                Cancel
              </button>
            </div>
          </form>
        }

      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .vd-card { margin-bottom: 0; }

    mat-card-header {
      display: flex;
      align-items: center;

      .edit-btn {
        margin-left: auto;
      }
    }

    .detail-list {
      display: flex;
      flex-direction: column;
    }

    .detail-row {
      display: flex;
      padding: 6px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child { border-bottom: none; }
    }

    .detail-label {
      font-weight: 500;
      color: #666;
      min-width: 140px;
      flex-shrink: 0;
      font-size: 0.9rem;
    }

    .detail-value {
      color: #222;
      font-size: 0.9rem;
    }

    .severity-critical { color: #dc2626; font-weight: 600; }
    .severity-serious { color: #ea580c; font-weight: 600; }
    .severity-standard { color: #2563eb; }
    .severity-minor { color: #16a34a; }

    .full-width { width: 100%; }

    .conditional-fields {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e0e0e0;
    }

    .toggle-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin: 8px 0 16px;
    }

    .toggle-hint {
      font-size: 0.75rem;
      color: #666;
      margin-left: 48px;
    }

    .action-row {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    .empty-msg {
      color: #999;
      font-style: italic;
      margin: 8px 0;
    }
  `,
})
export class ViolationDetailEditComponent {
  private fb = inject(NonNullableFormBuilder);

  // ── Inputs ──────────────────────────────────────────────────────
  violationType = input.required<string>();
  typeSpecificData = input<Record<string, unknown> | undefined>(undefined);
  violationRegulationCode = input<string | undefined>(undefined);
  violationSeverity = input<string | undefined>(undefined);
  caseId = input.required<string>();

  // ── Outputs ─────────────────────────────────────────────────────
  saved = output<ViolationDetailSaveEvent>();

  // ── State ───────────────────────────────────────────────────────
  editing = signal(false);
  saving = signal(false);

  // ── Constants ───────────────────────────────────────────────────
  violationTypes = ACTIVE_VIOLATION_TYPES.map(t => ({ value: t.value, label: t.label }));
  severityOptions = SEVERITY_OPTIONS;

  // ── Computed ────────────────────────────────────────────────────
  config = computed<ViolationTypeConfig | null>(() => {
    return VIOLATION_TYPE_REGISTRY[this.violationType()] ?? null;
  });

  displayFields = computed<{ field: ConditionalField; value: unknown }[]>(() => {
    const cfg = this.config();
    const tsd = this.typeSpecificData();
    if (!cfg || !tsd) return [];
    return cfg.conditionalFields
      .map(field => ({ field, value: tsd[field.key] }))
      .filter(item => item.value !== undefined && item.value !== null && item.value !== '');
  });

  editConditionalFields = signal<ConditionalField[]>([]);

  // ── Form ────────────────────────────────────────────────────────
  editForm = this.fb.group({
    violation_type: [''],
    violation_severity: [''],
    violation_regulation_code: [''],
    type_specific_data: this.fb.group({} as Record<string, FormControl>),
  });

  private originalTypeSpecificData: Record<string, unknown> = {};

  constructor() {
    // Watch violation_type changes in edit mode to rebuild conditional fields
    effect(() => {
      // This is called when the component initializes; we only listen in edit mode
      // The actual rebuild happens in onTypeChange()
    });
  }

  startEdit(): void {
    const type = this.violationType();
    const tsd = this.typeSpecificData() ?? {};
    this.originalTypeSpecificData = { ...tsd };

    this.editForm.patchValue({
      violation_type: type,
      violation_severity: this.violationSeverity() ?? this.config()?.severity ?? 'standard',
      violation_regulation_code: this.violationRegulationCode() ?? this.config()?.regulationRef ?? '',
    });

    this.rebuildConditionalFields(type, tsd);
    this.editing.set(true);

    // Listen for type changes
    this.editForm.controls.violation_type.valueChanges.subscribe(newType => {
      if (newType && newType !== this.violationType()) {
        if (confirm('Changing the violation type will clear all type-specific fields. Continue?')) {
          const newConfig = VIOLATION_TYPE_REGISTRY[newType];
          this.editForm.patchValue({
            violation_severity: newConfig?.severity ?? 'standard',
          });
          this.rebuildConditionalFields(newType, {});
        } else {
          // Revert
          this.editForm.controls.violation_type.setValue(this.violationType(), { emitEvent: false });
        }
      }
    });
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);

    const formValue = this.editForm.getRawValue();

    // Build type_specific_data from the nested group
    const tsdGroup = this.editForm.controls.type_specific_data as FormGroup;
    const tsd: Record<string, unknown> = {};
    for (const key of Object.keys(tsdGroup.controls)) {
      const val = tsdGroup.controls[key].value;
      if (val !== null && val !== undefined && val !== '') {
        tsd[key] = val;
      }
    }

    const event: ViolationDetailSaveEvent = {
      type_specific_data: tsd,
    };

    // Only include changed top-level fields
    if (formValue.violation_regulation_code !== (this.violationRegulationCode() ?? '')) {
      event.violation_regulation_code = formValue.violation_regulation_code;
    }
    if (formValue.violation_severity !== (this.violationSeverity() ?? '')) {
      event.violation_severity = formValue.violation_severity;
    }
    if (formValue.violation_type !== this.violationType()) {
      event.violation_type = formValue.violation_type;
    }

    this.saved.emit(event);
  }

  /** Called by parent after successful save to exit edit mode */
  onSaveComplete(): void {
    this.saving.set(false);
    this.editing.set(false);
  }

  /** Called by parent on save failure */
  onSaveError(): void {
    this.saving.set(false);
  }

  // ── Helpers ─────────────────────────────────────────────────────
  formatValue(field: ConditionalField, value: unknown): string {
    if (value === null || value === undefined || value === '') return 'Not set';
    if (field.type === 'boolean') return value ? 'Yes' : 'No';
    if (field.type === 'select') return resolveSelectLabel(field, String(value));
    if (field.type === 'number') return Number(value).toLocaleString();
    return String(value);
  }

  private rebuildConditionalFields(type: string, data: Record<string, unknown>): void {
    const config = VIOLATION_TYPE_REGISTRY[type];
    const fields = config?.conditionalFields ?? [];
    this.editConditionalFields.set(fields);

    // Rebuild the type_specific_data form group
    const tsdGroup: Record<string, FormControl> = {};
    for (const field of fields) {
      const existingVal = data[field.key];
      const validators = field.required ? [Validators.required] : [];

      if (field.type === 'boolean') {
        tsdGroup[field.key] = new FormControl(existingVal === true, { validators });
      } else if (field.type === 'number') {
        tsdGroup[field.key] = new FormControl(existingVal ?? null, { validators });
      } else {
        tsdGroup[field.key] = new FormControl(existingVal ?? '', { validators });
      }
    }

    this.editForm.setControl('type_specific_data', new FormGroup(tsdGroup));
  }
}
