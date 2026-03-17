import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface DashboardStats {
  total: number;
  active: number;
  pending: number;
  resolved: number;
  rejected: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  cdlNumber: string;
  cdlState: string;
  profilePicture?: string;
  createdAt: Date;
}

/** Shape returned by GET /api/users/me */
interface UserMeResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    cdl_number?: string;
    cdl_state?: string;
    avatar_url?: string;
    created_at: string;
    [key: string]: unknown;
  };
}

/** Shape returned by GET /api/analytics/dashboard */
interface DashboardResponse {
  success: boolean;
  data: {
    totalCases: number;
    newCases: number;
    activeCases: number;
    closedCases: number;
    statusBreakdown: Record<string, number>;
    recentActivity: unknown[];
  };
}

/** Shape returned by PUT /api/users/profile */
interface ProfileUpdateResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar_url?: string;
    role: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Get current user information
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<UserMeResponse>(`${this.apiUrl}/users/me`).pipe(
      map(response => {
        const u = response.user;
        const nameParts = (u.full_name || '').split(' ');
        return {
          id: u.id,
          email: u.email,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' '),
          phone: u.phone || '',
          cdlNumber: u.cdl_number || '',
          cdlState: u.cdl_state || '',
          profilePicture: u.avatar_url,
          createdAt: new Date(u.created_at),
        } as User;
      })
    );
  }

  /**
   * Get user statistics (total tickets, pending, resolved, rejected)
   */
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardResponse>(`${this.apiUrl}/analytics/dashboard`).pipe(
      map(response => {
        const d = response.data;
        const statusBreakdown = d.statusBreakdown || {};
        return {
          total: d.totalCases,
          active: d.activeCases,
          pending: statusBreakdown['waiting_for_driver'] || statusBreakdown['submitted'] || d.newCases,
          resolved: d.closedCases,
          rejected: statusBreakdown['rejected'] || statusBreakdown['denied'] || 0,
        } as DashboardStats;
      })
    );
  }

  /**
   * Update user profile
   */
  updateProfile(userData: Partial<User>): Observable<User> {
    const body: { name?: string; phone?: string } = {};
    if (userData.firstName !== undefined || userData.lastName !== undefined) {
      body.name = `${userData.firstName ?? ''} ${userData.lastName ?? ''}`.trim();
    }
    if (userData.phone !== undefined) {
      body.phone = userData.phone;
    }

    return this.http.put<ProfileUpdateResponse>(`${this.apiUrl}/users/profile`, body).pipe(
      map(response => {
        const u = response.user;
        const nameParts = (u.name || '').split(' ');
        return {
          id: u.id,
          email: u.email,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' '),
          phone: u.phone || '',
          cdlNumber: '',
          cdlState: '',
          profilePicture: u.avatar_url,
          createdAt: new Date(),
        } as User;
      })
    );
  }

  /**
   * Get user profile picture URL
   */
  getProfilePictureUrl(userId: string): string {
    return 'assets/images/default-avatar.png';
  }
}
