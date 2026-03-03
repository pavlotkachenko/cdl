import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface Ticket {
  id: string;
  violation_type: string;
  status: string;
  statusColor: 'green' | 'amber' | 'red';
  statusText: string;
  court_date?: string;
  Attorney?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
}

interface DashboardData {
  summary: {
    active: number;
    resolved: number;
    upcomingCourts: number;
  };
  activeTickets: Ticket[];
  resolvedTickets: Ticket[];
  upcomingCourts: Ticket[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/api/drivers`;

  constructor(private http: HttpClient) {}

  /**
   * Get driver dashboard with color-coded tickets
   * Fetches from: GET /api/drivers/:id/dashboard
   */
  getDriverDashboard(): Observable<DashboardData> {
    // Get driver ID from auth service or local storage
    const driverId = this.getDriverId();
    return this.http.get<DashboardData>(`${this.apiUrl}/${driverId}/dashboard`);
  }

  /**
   * Get current driver ID from authentication context
   * TODO: Replace with actual auth service
   */
  private getDriverId(): string {
    // Placeholder - should get from AuthService
    return localStorage.getItem('driverId') || '1';
  }
}
