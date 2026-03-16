import {
  Component, ChangeDetectionStrategy, inject, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

export interface NoteDialogData {
  targetLabel: string;
}

@Component({
  selector: 'app-status-note-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, MatButtonModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'OPR.WORKFLOW.NOTE_TITLE' | translate }}</h2>
    <mat-dialog-content>
      <p class="note-prompt">
        {{ 'OPR.WORKFLOW.NOTE_PROMPT' | translate:{ status: data.targetLabel } }}
      </p>
      <mat-form-field appearance="outline" class="note-field">
        <mat-label>{{ 'OPR.WORKFLOW.NOTE_LABEL' | translate }}</mat-label>
        <textarea matInput
                  [(ngModel)]="noteText"
                  rows="4"
                  required
                  minlength="10"
                  [attr.aria-label]="'OPR.WORKFLOW.NOTE_LABEL' | translate"
                  cdkTextareaAutosize></textarea>
        @if (noteText().length > 0 && noteText().length < 10) {
          <mat-hint>{{ 'OPR.WORKFLOW.NOTE_MIN_CHARS' | translate }}</mat-hint>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'OPR.WORKFLOW.CANCEL' | translate }}</button>
      <button mat-flat-button color="primary"
              [disabled]="noteText().length < 10"
              (click)="confirm()">
        {{ 'OPR.WORKFLOW.CONFIRM' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .note-prompt { color: #666; margin-bottom: 16px; }
    .note-field { width: 100%; }
    mat-dialog-actions button { min-height: 44px; min-width: 44px; }
  `],
})
export class StatusNoteDialogComponent {
  data: NoteDialogData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<StatusNoteDialogComponent>);

  noteText = signal('');

  confirm(): void {
    if (this.noteText().length >= 10) {
      this.dialogRef.close(this.noteText());
    }
  }
}
