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

export interface BulkImportResult {
  results: {
    imported: number;
    errors: { row: number; message: string }[];
  };
}

export interface ComplianceReportRow {
  case_number: string;
  driver_name: string;
  cdl_number: string;
  violation_type: string;
  state: string;
  status: string;
  incident_date: string;
  attorney_name: string;
}

export interface ComplianceReport {
  report: ComplianceReportRow[];
  generated_at: string;
}

export interface FleetAnalytics {
  casesByMonth: { month: string; count: number }[];
  violationBreakdown: { type: string; count: number; pct: number }[];
  successRate: number;
  avgResolutionDays: number;
  atRiskDrivers: { id: string; name: string; openCases: number; riskLevel: 'green' | 'yellow' | 'red' }[];
  estimatedSavings: number;
  totalCases: number;
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

  getAnalytics(): Observable<FleetAnalytics> {
    return this.http.get<FleetAnalytics>(`${this.api}/analytics`);
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.api}/export?format=csv`, { responseType: 'blob' });
  }

  bulkImport(csv: string): Observable<BulkImportResult> {
    return this.http.post<BulkImportResult>(`${this.api}/bulk-import`, { csv });
  }

  bulkArchive(caseIds: string[]): Observable<{ archived: number }> {
    return this.http.post<{ archived: number }>(`${this.api}/cases/bulk-archive`, { case_ids: caseIds });
  }

  getComplianceReport(from?: string, to?: string): Observable<ComplianceReport> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return this.http.get<ComplianceReport>(`${this.api}/compliance-report${qs ? '?' + qs : ''}`);
  }
}
