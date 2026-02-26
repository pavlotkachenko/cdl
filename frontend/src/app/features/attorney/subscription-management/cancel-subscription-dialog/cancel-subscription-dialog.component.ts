import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from '../../../../services/subscription.service';

export interface CancelDialogData {
  subscription: Subscription;
}

export interface CancelDialogResult {
  immediately: boolean;
}

@Component({
  selector: 'app-cancel-subscription-dialog',
  templateUrl: './cancel-subscription-dialog.component.html',
  styleUrls: ['./cancel-subscription-dialog.component.scss']
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
