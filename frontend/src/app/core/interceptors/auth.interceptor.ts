// ============================================
// HTTP Interceptor - JWT Authentication
// Location: frontend/src/app/core/interceptors/auth.interceptor.ts
// ============================================

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the auth token from localStorage
    const token = this.getAuthToken();

    // Clone the request and add authorization header if token exists
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Add common headers
    request = request.clone({
      setHeaders: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'Accept': 'application/json'
      }
    });

    // Handle the request and catch errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('HTTP Error:', error);

        // Handle specific error cases
        if (error.status === 401) {
          // Unauthorized - redirect to login
          console.warn('Unauthorized request - redirecting to login');
          this.handleUnauthorized();
        } else if (error.status === 403) {
          // Forbidden - user doesn't have permission
          console.error('Access forbidden');
        } else if (error.status === 0) {
          // Network error
          console.error('Network error - cannot reach server');
        }

        return throwError(() => error);
      })
    );
  }

  private getAuthToken(): string | null {
    // Try multiple token storage keys for compatibility
    return localStorage.getItem('token') || 
           localStorage.getItem('access_token') || 
           localStorage.getItem('authToken') ||
           sessionStorage.getItem('token');
  }

  private handleUnauthorized(): void {
    // Clear stored tokens
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('token');

    // Redirect to login page
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }
}
