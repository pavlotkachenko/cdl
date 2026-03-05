import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private snackBar = inject(MatSnackBar);
  private zone = inject(NgZone);

  handleError(error: unknown): void {
    console.error('[GlobalErrorHandler]', error);
    this.zone.run(() => {
      this.snackBar.open('Something went wrong. Please try again.', 'Dismiss', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    });
  }
}
