// ============================================
// Authentication Service
// ============================================
// Handles login, logout, and user session management
// Location: frontend/src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

// What a user looks like in our app
export interface AppUser {
  id: string;
  email: string;
  role: 'driver' | 'operator' | 'attorney' | 'admin';
  full_name: string;
  phone?: string;
  auth_user_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Supabase client - connection to database
  private supabase: SupabaseClient;
  
  // Current user information
  // BehaviorSubject = like a box that holds data and tells everyone when it changes
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Is user logged in?
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private router: Router) {
    // Connect to Supabase
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
    
    // Check if user is already logged in (from previous session)
    this.checkExistingSession();
  }

  /**
   * CHECK EXISTING SESSION
   * When app loads, see if user is already logged in
   */
  private async checkExistingSession() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (session?.user) {
        await this.loadUserProfile(session.user);
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }

  /**
   * LOGIN
   * User enters email and password
   */
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to sign in with Supabase
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Load full user profile from our users table
        await this.loadUserProfile(data.user);
        
        // Redirect based on role
        this.redirectAfterLogin();
        
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
      
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * REGISTER NEW USER
   * Create new account
   */
  async register(
    email: string, 
    password: string, 
    fullName: string, 
    phone: string,
    role: string = 'driver'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create auth user in Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email,
        password
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (authData.user) {
        // Create user profile in our users table
        const { error: profileError } = await this.supabase
          .from('users')
          .insert([{
            auth_user_id: authData.user.id,
            email,
            full_name: fullName,
            phone,
            role
          }]);

        if (profileError) {
          return { success: false, error: 'Failed to create user profile' };
        }

        return { 
          success: true, 
          error: 'Registration successful! Please check your email to verify.' 
        };
      }

      return { success: false, error: 'Registration failed' };
      
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * LOGOUT
   * Sign out user
   */
  async logout(): Promise<void> {
    try {
      await this.supabase.auth.signOut();
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * LOAD USER PROFILE
   * Get full user details from database
   */
  private async loadUserProfile(authUser: User): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      if (error || !data) {
        throw new Error('User profile not found');
      }

      // Save user info
      this.currentUserSubject.next(data as AppUser);
      this.isAuthenticatedSubject.next(true);
      
    } catch (error) {
      console.error('Load profile error:', error);
      await this.logout();
    }
  }

  /**
   * REDIRECT AFTER LOGIN
   * Send user to appropriate dashboard based on role
   */
  private redirectAfterLogin(): void {
    const user = this.currentUserSubject.value;
    
    if (!user) return;

    switch (user.role) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'operator':
        this.router.navigate(['/operator']);
        break;
      case 'attorney':
        this.router.navigate(['/attorney']);
        break;
      case 'driver':
      default:
        this.router.navigate(['/driver']);
        break;
    }
  }

  /**
   * GET CURRENT USER
   * Returns current user or null
   */
  getCurrentUser(): AppUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * GET USER ROLE
   * What type of user is this?
   */
  getUserRole(): string | null {
    return this.currentUserSubject.value?.role || null;
  }

  /**
   * CHECK IF USER HAS ROLE
   * Usage: hasRole(['admin', 'operator'])
   */
  hasRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  /**
   * GET ACCESS TOKEN
   * For API requests
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  /**
   * UPDATE USER PROFILE
   * Change user information
   */
  async updateProfile(updates: Partial<AppUser>): Promise<boolean> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) return false;

      const { error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', currentUser.id);

      if (error) {
        console.error('Update profile error:', error);
        return false;
      }

      // Reload profile
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        await this.loadUserProfile(user);
      }

      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  }
}
