// ============================================
// AUTH SERVICE - Complete Implementation
// Location: frontend/src/app/core/services/auth.service.ts
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'driver' | 'admin' | 'attorney' | 'paralegal';
  token?: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  cdlNumber?: string;
  role?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  
  // BehaviorSubject to hold current user
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Initialize from localStorage
    const storedUser = this.getUserFromStorage();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();

    console.log('✅ AuthService initialized with user:', storedUser);
  }

  // ============================================
  // Get user from localStorage
  // ============================================
  private getUserFromStorage(): User | null {
    try {
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        const user = JSON.parse(userJson);
        console.log('✅ Loaded user from localStorage:', user);
        return user;
      }
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
    return null;
  }

  // ============================================
  // Public getter for current user value
  // ============================================
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // ============================================
  // Get token (for interceptor compatibility)
  // ============================================
  public get token(): string | null {
    return this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem('token') || localStorage.getItem('accessToken');
  }

  // ============================================
  // Get refresh token
  // ============================================
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // ============================================
  // Get user role
  // ============================================
  getUserRole(): string {
    const user = this.currentUserValue;
    return user?.role || 'driver';
  }

  // ============================================
  // Check if user is authenticated
  // ============================================
  isAuthenticated(): boolean {
    return !!this.currentUserValue && !!this.getToken();
  }

  // ============================================
  // LOGIN - Call backend API
  // ============================================
  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      map(response => {
        return this.handleAuthResponse(response);
      }),
      catchError(error => {
        console.error('❌ Login error:', error);
        throw error;
      })
    );
  }

  // ============================================
  // REGISTER - Call backend API
  // ============================================
  register(userData: RegisterRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData).pipe(
      map(response => {
        return this.handleAuthResponse(response);
      }),
      catchError(error => {
        console.error('❌ Registration error:', error);
        throw error;
      })
    );
  }

  // ============================================
  // LOGOUT - Clear tokens and call backend
  // ============================================
  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    
    // Clear local storage first
    this.clearAuthData();

    // Call backend logout endpoint if we have a refresh token
    if (refreshToken) {
      return this.http.post(`${this.apiUrl}/auth/logout`, { refreshToken }).pipe(
        tap(() => {
          console.log('✅ Logged out from backend');
        }),
        catchError(error => {
          console.error('❌ Logout error:', error);
          return of(null); // Continue even if backend call fails
        })
      );
    }

    return of(null);
  }

  // ============================================
  // REFRESH TOKEN - Get new access token
  // ============================================
  refreshToken(): Observable<{ accessToken: string }> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<{ accessToken: string }>(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(response => {
        // Update access token
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('accessToken', response.accessToken);
        
        console.log('✅ Token refreshed successfully');
      }),
      catchError(error => {
        console.error('❌ Token refresh failed:', error);
        // If refresh fails, logout user
        this.clearAuthData();
        throw error;
      })
    );
  }

  // ============================================
  // FORGOT PASSWORD - Send reset email
  // ============================================
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email }).pipe(
      tap(response => {
        console.log('✅ Password reset email sent:', response.message);
      }),
      catchError(error => {
        console.error('❌ Forgot password error:', error);
        throw error;
      })
    );
  }

  // ============================================
  // RESET PASSWORD - Set new password with token
  // ============================================
  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, { 
      token, 
      newPassword 
    }).pipe(
      tap(response => {
        console.log('✅ Password reset successful:', response.message);
      }),
      catchError(error => {
        console.error('❌ Reset password error:', error);
        throw error;
      })
    );
  }

  // ============================================
  // Handle auth response (login/register)
  // ============================================
  private handleAuthResponse(response: AuthResponse): User {
    const user: User = {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
      role: response.user.role as User['role'],
      token: response.accessToken,
      refreshToken: response.refreshToken
    };

    // Store user and tokens in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', response.accessToken);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);

    // Update BehaviorSubject
    this.currentUserSubject.next(user);

    console.log('✅ User authenticated:', user);
    return user;
  }

  // ============================================
  // Clear authentication data
  // ============================================
  private clearAuthData(): void {
    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Clear BehaviorSubject
    this.currentUserSubject.next(null);

    // Navigate to login
    this.router.navigate(['/login']);

    console.log('✅ Auth data cleared');
  }

  // ============================================
  // Mock login (for development/testing)
  // ============================================
  mockLogin(email: string, password: string): Observable<User> {
    console.log('🔧 Using mock login for development');
    
    // Simulate different roles based on email
    let role: User['role'] = 'driver';
    
    if (email.includes('admin')) {
      role = 'admin';
    } else if (email.includes('attorney')) {
      role = 'attorney';
    } else if (email.includes('paralegal')) {
      role = 'paralegal';
    }

    const user: User = {
      id: '1',
      email: email,
      name: email.split('@')[0],
      role: role,
      token: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now()
    };

    // Store in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', user.token || '');
    localStorage.setItem('accessToken', user.token || '');
    localStorage.setItem('refreshToken', user.refreshToken || '');

    // Update BehaviorSubject
    this.currentUserSubject.next(user);

    return of(user);
  }

  // ============================================
  // Mock register (for development/testing)
  // ============================================
  mockRegister(userData: RegisterRequest): Observable<User> {
    console.log('🔧 Using mock register for development');
    
    const user: User = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      role: (userData.role as User['role']) || 'driver',
      token: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now()
    };

    // Store in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', user.token || '');
    localStorage.setItem('accessToken', user.token || '');
    localStorage.setItem('refreshToken', user.refreshToken || '');

    // Update BehaviorSubject
    this.currentUserSubject.next(user);

    return of(user);
  }

  // ============================================
  // Refresh user from localStorage
  // ============================================
  refreshUser(): void {
    const user = this.getUserFromStorage();
    console.log('🔄 Refreshing user from localStorage:', user);
    this.currentUserSubject.next(user);
  }

  // ============================================
  // Verify email (optional feature)
  // ============================================
  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/verify-email`, { token }).pipe(
      tap(response => {
        console.log('✅ Email verified:', response.message);
      }),
      catchError(error => {
        console.error('❌ Email verification error:', error);
        throw error;
      })
    );
  }

  // ============================================
  // Resend verification email
  // ============================================
  resendVerificationEmail(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/resend-verification`, { email }).pipe(
      tap(response => {
        console.log('✅ Verification email resent:', response.message);
      }),
      catchError(error => {
        console.error('❌ Resend verification error:', error);
        throw error;
      })
    );
  }
}
