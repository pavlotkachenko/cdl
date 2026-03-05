import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message: string | null = null;

      if (error.status === 0) {
        message = 'No connection — check your internet';
      } else if (error.status === 403) {
        message = "You don't have permission";
      } else if (error.status >= 500) {
        message = 'Server error, please try again';
      }

      if (message) {
        snackBar.open(message, 'Dismiss', { duration: 5000 });
      }

      return throwError(() => error);
    })
  );
};
