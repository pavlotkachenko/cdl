import {
  Component, signal, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

import {
  CarrierService, ComplianceReportRow,
} from '../../../core/services/carrier.service';

interface PreviewRow {
  cdl_number: string;
  violation_type: string;
  state: string;
  valid: boolean;
  error?: string;
}

@Component({
  selector: 'app-bulk-import',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="header-row">
        <button mat-icon-button (click)="goBack()" aria-label="Go back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Bulk Import Cases</h1>
      </div>

      @if (!preview()) {
        <mat-card>
          <mat-card-content>
            <p class="instructions">
              Upload a CSV file or paste CSV text below.
              Required columns: <code>cdl_number</code>, <code>violation_type</code>, <code>state</code>.
            </p>

            <div class="upload-area" (dragover)="$event.preventDefault()" (drop)="onDrop($event)"
                 role="region" aria-label="CSV drop zone">
              <mat-icon aria-hidden="true">upload_file</mat-icon>
              <p>Drag &amp; drop a CSV file here, or</p>
              <label class="file-label">
                <input type="file" accept=".csv,text/csv" (change)="onFileChange($event)"
                       aria-label="Choose CSV file" style="display:none">
                <span class="choose-btn">Choose File</span>
              </label>
            </div>

            <p class="or-divider">— or paste CSV below —</p>

            <textarea class="csv-textarea" rows="8"
                      placeholder="cdl_number,violation_type,state&#10;CDL123456,Speeding,TX&#10;CDL789012,Overweight,CA"
                      [(ngModel)]="csvText" aria-label="CSV text input"></textarea>

            <div class="actions">
              <button mat-raised-button color="primary" [disabled]="!csvText().trim()"
                      (click)="buildPreview()">
                Preview
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="template-card">
          <mat-card-content>
            <p class="template-label">CSV Template</p>
            <pre class="template-pre">cdl_number,violation_type,state
CDL123456,Speeding,TX
CDL789012,Overweight,CA</pre>
            <button mat-stroked-button (click)="downloadTemplate()" aria-label="Download CSV template">
              <mat-icon aria-hidden="true">download</mat-icon> Download Template
            </button>
          </mat-card-content>
        </mat-card>

      } @else {
        <mat-card>
          <mat-card-content>
            <p class="preview-header">
              Preview — {{ validRows() }} valid / {{ preview()!.length - validRows() }} with errors
            </p>
            <div class="table-wrap" role="region" aria-label="CSV preview table">
              <table class="preview-table" aria-label="Import preview">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">CDL Number</th>
                    <th scope="col">Violation</th>
                    <th scope="col">State</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of preview()!; track $index) {
                    <tr [class.row-error]="!row.valid">
                      <td>{{ $index + 2 }}</td>
                      <td>{{ row.cdl_number }}</td>
                      <td>{{ row.violation_type }}</td>
                      <td>{{ row.state }}</td>
                      <td>
                        @if (row.valid) {
                          <mat-icon class="ok-icon" aria-label="Valid">check_circle</mat-icon>
                        } @else {
                          <span class="err-msg" [attr.aria-label]="'Error: ' + row.error">{{ row.error }}</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="actions">
              <button mat-stroked-button (click)="resetPreview()">Back</button>
              <button mat-raised-button color="primary" [disabled]="validRows() === 0 || importing()"
                      (click)="confirmImport()">
                @if (importing()) {
                  <mat-spinner diameter="18" aria-label="Importing"></mat-spinner>
                } @else {
                  Import {{ validRows() }} case{{ validRows() !== 1 ? 's' : '' }}
                }
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 760px; margin: 0 auto; padding: 24px 16px; }
    .header-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    h1 { margin: 0; font-size: 1.4rem; }
    .instructions { font-size: 0.9rem; color: #555; margin-bottom: 16px; }
    code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; font-size: 0.85em; }
    .upload-area { border: 2px dashed #bdbdbd; border-radius: 8px; padding: 32px;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      background: #fafafa; cursor: pointer; text-align: center; }
    .upload-area mat-icon { font-size: 48px; width: 48px; height: 48px; color: #9e9e9e; }
    .upload-area p { margin: 0; color: #666; }
    .file-label { cursor: pointer; }
    .choose-btn { display: inline-block; padding: 6px 16px; border: 1px solid #1976d2;
      border-radius: 4px; color: #1976d2; font-size: 0.85rem; }
    .or-divider { text-align: center; color: #999; margin: 12px 0; font-size: 0.85rem; }
    .csv-textarea { width: 100%; box-sizing: border-box; font-family: monospace;
      font-size: 0.85rem; padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px;
      resize: vertical; }
    .actions { display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end; }
    .template-card { margin-top: 16px; }
    .template-label { font-weight: 600; font-size: 0.9rem; margin: 0 0 8px; }
    .template-pre { background: #f5f5f5; padding: 10px; border-radius: 4px;
      font-size: 0.8rem; margin: 0 0 12px; overflow-x: auto; }
    .preview-header { font-weight: 600; font-size: 0.95rem; margin-bottom: 12px; }
    .table-wrap { overflow-x: auto; }
    .preview-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .preview-table th { text-align: left; padding: 8px 10px; font-weight: 600;
      border-bottom: 2px solid #e0e0e0; color: #555; }
    .preview-table td { padding: 7px 10px; border-bottom: 1px solid #f0f0f0; }
    .row-error td { background: #fff3e0; }
    .ok-icon { color: #388e3c; font-size: 18px; width: 18px; height: 18px; }
    .err-msg { color: #d32f2f; font-size: 0.78rem; }
  `],
})
export class BulkImportComponent {
  private carrierService = inject(CarrierService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  csvText = signal('');
  preview = signal<PreviewRow[] | null>(null);
  importing = signal(false);

  validRows(): number {
    return (this.preview() ?? []).filter(r => r.valid).length;
  }

  goBack(): void { this.router.navigate(['/carrier/cases']); }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.csvText.set(e.target?.result as string ?? '');
      this.buildPreview();
    };
    reader.readAsText(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.csvText.set(e.target?.result as string ?? '');
      this.buildPreview();
    };
    reader.readAsText(file);
  }

  buildPreview(): void {
    const text = this.csvText().trim();
    if (!text) return;
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      this.snackBar.open('CSV must have a header row and at least one data row.', 'Close', { duration: 3000 });
      return;
    }
    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const col = (name: string) => header.indexOf(name);
    const rows: PreviewRow[] = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: PreviewRow = {
        cdl_number: vals[col('cdl_number')] ?? '',
        violation_type: vals[col('violation_type')] ?? '',
        state: vals[col('state')] ?? '',
        valid: true,
      };
      if (!row.cdl_number) { row.valid = false; row.error = 'cdl_number required'; }
      else if (!row.violation_type) { row.valid = false; row.error = 'violation_type required'; }
      else if (!row.state) { row.valid = false; row.error = 'state required'; }
      return row;
    });
    this.preview.set(rows);
  }

  resetPreview(): void { this.preview.set(null); }

  confirmImport(): void {
    this.importing.set(true);
    this.carrierService.bulkImport(this.csvText()).subscribe({
      next: ({ results }) => {
        this.importing.set(false);
        const msg = `Imported ${results.imported} case${results.imported !== 1 ? 's' : ''}` +
          (results.errors.length > 0 ? `, ${results.errors.length} skipped.` : '.');
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        if (results.imported > 0) this.router.navigate(['/carrier/cases']);
        else this.resetPreview();
      },
      error: () => {
        this.importing.set(false);
        this.snackBar.open('Import failed. Please try again.', 'Close', { duration: 3000 });
      },
    });
  }

  downloadTemplate(): void {
    const csv = 'cdl_number,violation_type,state\nCDL123456,Speeding,TX\nCDL789012,Overweight,CA\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
