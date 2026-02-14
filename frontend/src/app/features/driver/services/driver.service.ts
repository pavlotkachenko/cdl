import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { DashboardStats } from '../dashboard/driver-dashboard.component';

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

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  
  // Mock user data
  private mockUser: User = {
    id: 'user-001',
    email: 'john.driver@example.com',
    firstName: 'John',
    lastName: 'Driver',
    phone: '+1 (555) 123-4567',
    cdlNumber: 'CDL12345678',
    cdlState: 'CA',
    createdAt: new Date('2025-01-15')
  };

  // Mock statistics
  private mockStats: DashboardStats = {
    total: 12,
    active: 3,
    pending: 3,
    resolved: 5,
    rejected: 1
  };

  constructor() {}

  /**
   * Get current user information
   */
  getCurrentUser(): Observable<User> {
    // Simulate API call with delay
    return of(this.mockUser).pipe(delay(500));
  }

  /**
   * Get user statistics (total tickets, pending, resolved, rejected)
   */
  getStats(): Observable<DashboardStats> {
    // Simulate API call with delay
    return of(this.mockStats).pipe(delay(600));
  }

  /**
   * Update user profile
   */
  updateProfile(userData: Partial<User>): Observable<User> {
    // Update mock user data
    this.mockUser = { ...this.mockUser, ...userData };
    return of(this.mockUser).pipe(delay(800));
  }

  /**
   * Get user profile picture URL
   */
  getProfilePictureUrl(userId: string): string {
    return this.mockUser.profilePicture || 'assets/images/default-avatar.png';
  }
}
