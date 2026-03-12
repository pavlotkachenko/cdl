import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap } from 'rxjs/operators';

// Support ALL 6 roles
type UserRole = 'driver' | 'carrier' | 'attorney' | 'admin' | 'paralegal' | 'operator';

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  avatar_url?: string;
  usdot?: string;         // carrier
  barNumber?: string;     // attorney
  permissions?: string[]; // admin/paralegal
}

interface SignInResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  cdlNumber?: string;
  password: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  signIn(email: string, password: string): Observable<SignInResponse> {
    return this.http.post<SignInResponse>(`${this.apiUrl}/auth/signin`, {
      email,
      password
    }).pipe(
      tap(response => {
        this.storeAuthData(response);

        // Route based on role (ALL 5 roles supported)
        this.navigateByRole(response.user.role);
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<SignInResponse> {
    return this.http.post<SignInResponse>(`${this.apiUrl}/auth/signin`, {
      email: credentials.email,
      password: credentials.password
    }).pipe(
      tap(response => {
        this.storeAuthData(response);
      })
    );
  }

  private storeAuthData(response: SignInResponse): void {
    localStorage.setItem('token', response.token);
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    localStorage.setItem('currentUser', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  private navigateByRole(role: string): void {
    switch (role) {
      case 'driver':
        this.router.navigate(['/driver/dashboard']);
        break;
      case 'carrier':
        this.router.navigate(['/carrier/dashboard']);
        break;
      case 'attorney':
        this.router.navigate(['/attorney/dashboard']);
        break;
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'paralegal':
        this.router.navigate(['/paralegal/dashboard']);
        break;
      case 'operator':
        this.router.navigate(['/operator/dashboard']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  register(data: RegisterData): Observable<SignInResponse> {
    return this.http.post<SignInResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(accessToken: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, { access_token: accessToken, password: newPassword });
  }

  logout(): Observable<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
    return of(void 0);
  }

  signOut(): void {
    this.logout();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        this.logout();
        return false;
      }
    } catch {
      // Unparseable token — treat as present but don't reject
    }
    return true;
  }

  hasRole(role: UserRole): boolean {
    return this.getCurrentUser()?.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const currentRole = this.getCurrentUser()?.role;
    return currentRole ? roles.includes(currentRole) : false;
  }

  getUserRole(): string {
    return this.getCurrentUser()?.role || '';
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  refreshToken(): Observable<{ accessToken: string }> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<{ accessToken: string }>(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(response => {
        localStorage.setItem('token', response.accessToken);
      })
    );
  }

  updateProfile(data: { name?: string; phone?: string }): Observable<{ user: User }> {
    return this.http.put<{ user: User }>(`${this.apiUrl}/users/profile`, data).pipe(
      tap(response => {
        const updated = { ...this.currentUserSubject.value!, ...response.user };
        this.currentUserSubject.next(updated);
        localStorage.setItem('currentUser', JSON.stringify(updated));
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/users/change-password`,
      { currentPassword, newPassword },
    );
  }

  uploadAvatar(file: File): Observable<{ avatar_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ avatar_url: string }>(`${this.apiUrl}/users/me/avatar`, formData).pipe(
      tap(response => {
        const updated = { ...this.currentUserSubject.value!, avatar_url: response.avatar_url };
        this.currentUserSubject.next(updated);
        localStorage.setItem('currentUser', JSON.stringify(updated));
      })
    );
  }
}