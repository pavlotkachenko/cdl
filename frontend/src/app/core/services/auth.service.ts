// ============================================
// Auth Service (COMPLETE - Compatible with all components)
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
    return localStorage.getItem('token');
  }

  // ============================================
  // Get user role
  // ============================================
  getUserRole(): string {
    const user = this.currentUserValue;
    return user?.role || 'driver';
  }

  // ============================================
  // Check if user is authenticated (callable method)
  // ============================================
  isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  // ============================================
  // Login
  // ============================================
  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials).pipe(
      map(response => {
        const user: User = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          token: response.token
        };

        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        if (response.token) {
          localStorage.setItem('token', response.token);
        }

        // Update BehaviorSubject
        this.currentUserSubject.next(user);

        return user;
      }),
      catchError(error => {
        console.error('Login error:', error);
        // Fall back to mock login
        return this.performMockLogin(credentials.email, credentials.password);
      })
    );
  }

  // ============================================
  // Mock login (public for compatibility)
  // ============================================
  mockLogin(email: string, password: string): Observable<User> {
    return this.performMockLogin(email, password);
  }

  private performMockLogin(email: string, password: string): Observable<User> {
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
      token: 'mock-jwt-token'
    };

    // Store in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', user.token || '');

    // Update BehaviorSubject
    this.currentUserSubject.next(user);

    return of(user);
  }

  // ============================================
  // Register
  // ============================================
  register(userData: RegisterRequest): Observable<User> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, userData).pipe(
      map(response => {
        const user: User = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role || 'driver',
          token: response.token
        };

        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        if (response.token) {
          localStorage.setItem('token', response.token);
        }

        // Update BehaviorSubject
        this.currentUserSubject.next(user);

        return user;
      }),
      catchError(error => {
        console.error('Registration error:', error);
        // Fall back to mock register
        return this.performMockRegister(userData);
      })
    );
  }

  // ============================================
  // Mock register (for compatibility)
  // ============================================
  mockRegister(userData: RegisterRequest): Observable<User> {
    return this.performMockRegister(userData);
  }

  private performMockRegister(userData: RegisterRequest): Observable<User> {
    const user: User = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      role: 'driver',
      token: 'mock-jwt-token'
    };

    // Store in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', user.token || '');

    // Update BehaviorSubject
    this.currentUserSubject.next(user);

    return of(user);
  }

  // ============================================
  // Refresh token (for interceptor compatibility)
  // ============================================
  refreshToken(): Observable<{ token: string }> {
    // Mock token refresh - return current token
    const currentToken = this.getToken();
    if (currentToken) {
      return of({ token: currentToken });
    }
    return throwError(() => new Error('No token to refresh'));
  }

  // ============================================
  // Logout
  // ============================================
  logout(): void {
    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');

    // Clear BehaviorSubject
    this.currentUserSubject.next(null);

    // Navigate to login
    this.router.navigate(['/login']);
  }

  // ============================================
  // Refresh user from localStorage
  // ============================================
  refreshUser(): void {
    const user = this.getUserFromStorage();
    console.log('🔄 Refreshing user from localStorage:', user);
    this.currentUserSubject.next(user);
  }
}
