// ============================================
// AUTH INTERCEPTOR - JWT Token Management
// Location: frontend/src/app/core/interceptors/auth.interceptor.ts
// ============================================

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

// ============================================
// Functional Interceptor (Angular 16+)
// ============================================
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip auth header for login/register/public endpoints
  if (isPublicEndpoint(req.url)) {
    return next(req);
  }

  // Add authorization header with JWT token
  const token = authService.getToken();
  if (token) {
    req = addTokenToRequest(req, token);
  }

  // Handle the request and catch 401 errors
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Try to refresh token
        return handle401Error(req, next, authService);
      }
      return throwError(() => error);
    })
  );
};

// ============================================
// Helper: Check if endpoint is public
// ============================================
function isPublicEndpoint(url: string): boolean {
  const publicEndpoints = [
    '/auth/login',
    '/auth/signin',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/refresh',
    '/auth/verify-email',
    '/public/',
    '/cases/public-submit'
  ];

  return publicEndpoints.some(endpoint => url.includes(endpoint));
}

// ============================================
// Helper: Add token to request
// ============================================
function addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

// ============================================
// Helper: Handle 401 error by refreshing token
// ============================================
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

function handle401Error(
  request: HttpRequest<any>,
  next: (req: HttpRequest<any>) => Observable<HttpEvent<any>>,
  authService: AuthService
): Observable<HttpEvent<any>> {

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = authService.getRefreshToken();

    if (refreshToken) {
      return authService.refreshToken().pipe(
        switchMap((response: { accessToken: string }): Observable<HttpEvent<any>> => {
          isRefreshing = false;
          refreshTokenSubject.next(response.accessToken);

          // Retry original request with new token
          return next(addTokenToRequest(request, response.accessToken));
        }),
        catchError((error) => {
          isRefreshing = false;

          // Refresh failed, logout user
          authService.logout().subscribe();

          return throwError(() => error);
        })
      );
    }
  }

  // Wait for token refresh to complete
  return refreshTokenSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token): Observable<HttpEvent<any>> => {
      return next(addTokenToRequest(request, token));
    })
  );
}

// ============================================
// Class-based Interceptor (Alternative)
// Use this if functional interceptor doesn't work
// ============================================
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth header for public endpoints
    if (isPublicEndpoint(request.url)) {
      return next.handle(request);
    }

    // Add authorization header with JWT token
    const token = this.authService.getToken();
    if (token) {
      request = addTokenToRequest(request, token);
    }

    // Handle the request and catch 401 errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401ErrorClass(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401ErrorClass(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.authService.getRefreshToken();

      if (refreshToken) {
        return this.authService.refreshToken().pipe(
          switchMap((response: { accessToken: string }) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(response.accessToken);
            
            // Retry original request with new token
            return next.handle(addTokenToRequest(request, response.accessToken));
          }),
          catchError((error) => {
            this.isRefreshing = false;
            
            // Refresh failed, logout user
            this.authService.logout().subscribe();
            
            return throwError(() => error);
          })
        );
      }
    }

    // Wait for token refresh to complete
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        return next.handle(addTokenToRequest(request, token!));
      })
    );
  }
}
