import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from '../../../../services/subscription.service';

export interface CancelDialogData {
  subscription: Subscription;
}

export interface CancelDialogResult {
  immediately: boolean;
}

@Component({
  selector: 'app-cancel-subscription-dialog',
  standalone: true,
  templateUrl: './cancel-subscription-dialog.component.html',
  styleUrls: ['./cancel-subscription-dialog.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class CancelSubscriptionDialogComponent {
  cancelImmediately = false;

  constructor(
    public dialogRef: MatDialogRef<CancelSubscriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CancelDialogData
  ) {}

  getPeriodEndDate(): string {
    if (!this.data.subscription) return '';
    return new Date(this.data.subscription.current_period_end).toLocaleDateString();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close({
      immediately: this.cancelImmediately
    });
  }
}
