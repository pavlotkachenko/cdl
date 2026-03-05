import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FleetStats {
  totalDrivers: number;
  activeCases: number;
  pendingCases: number;
  resolvedCases: number;
}

export interface FleetDriver {
  id: string;
  full_name: string;
  cdl_number: string;
  openCases: number;
}

export interface FleetCase {
  id: string;
  case_number: string;
  driver_name: string;
  violation_type: string;
  state: string;
  status: string;
  attorney_name: string;
}

export interface CarrierProfile {
  company_name: string;
  usdot_number: string;
  email: string;
  phone_number: string;
  notify_on_new_ticket: boolean;
}

@Injectable({ providedIn: 'root' })
export class CarrierService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/carriers/me`;

  getStats(): Observable<FleetStats> {
    return this.http.get<FleetStats>(`${this.api}/stats`);
  }

  getDrivers(): Observable<{ drivers: FleetDriver[] }> {
    return this.http.get<{ drivers: FleetDriver[] }>(`${this.api}/drivers`);
  }

  addDriver(data: { full_name: string; cdl_number: string }): Observable<{ driver: FleetDriver }> {
    return this.http.post<{ driver: FleetDriver }>(`${this.api}/drivers`, data);
  }

  removeDriver(driverId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/drivers/${driverId}`);
  }

  getCases(status?: string): Observable<{ cases: FleetCase[] }> {
    const url = status && status !== 'all'
      ? `${this.api}/cases?status=${status}`
      : `${this.api}/cases`;
    return this.http.get<{ cases: FleetCase[] }>(url);
  }

  getProfile(): Observable<{ carrier: CarrierProfile }> {
    return this.http.get<{ carrier: CarrierProfile }>(this.api);
  }

  updateProfile(data: Partial<CarrierProfile>): Observable<{ carrier: CarrierProfile }> {
    return this.http.put<{ carrier: CarrierProfile }>(this.api, data);
  }
}
