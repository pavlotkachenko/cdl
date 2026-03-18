import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

export interface CsaScoreResponse {
  csaScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  openViolations: number;
  breakdown: { hos: number; maintenance: number; speeding_major: number; speeding_minor: number; other: number };
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

export interface CarrierPayment {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  case_number: string;
}

export interface CarrierNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class CarrierService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/carriers/me`;

  getStats(): Observable<FleetStats> {
    return this.http.get<FleetStats>(`${this.api}/stats`).pipe(
      catchError(() => of({ totalDrivers: 0, activeCases: 0, pendingCases: 0, resolvedCases: 0 }))
    );
  }

  getDrivers(): Observable<{ drivers: FleetDriver[] }> {
    return this.http.get<{ drivers: FleetDriver[] }>(`${this.api}/drivers`).pipe(
      catchError(() => of({ drivers: [] as FleetDriver[] }))
    );
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
    return this.http.get<{ cases: FleetCase[] }>(url).pipe(
      catchError(() => of({ cases: [] as FleetCase[] }))
    );
  }

  getProfile(): Observable<{ carrier: CarrierProfile }> {
    return this.http.get<{ carrier: CarrierProfile }>(this.api);
  }

  updateProfile(data: Partial<CarrierProfile>): Observable<{ carrier: CarrierProfile }> {
    return this.http.put<{ carrier: CarrierProfile }>(this.api, data);
  }

  getAnalytics(): Observable<FleetAnalytics> {
    return this.http.get<FleetAnalytics>(`${this.api}/analytics`).pipe(
      catchError(() => of({
        casesByMonth: [], violationBreakdown: [], successRate: 0,
        avgResolutionDays: 0, atRiskDrivers: [], estimatedSavings: 0, totalCases: 0,
      } as FleetAnalytics))
    );
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

  getCsaScore(): Observable<CsaScoreResponse> {
    return this.http.get<CsaScoreResponse>(`${this.api}/csa-score`).pipe(
      catchError(() => of({ csaScore: 0, riskLevel: 'low' as const, openViolations: 0, breakdown: {} } as CsaScoreResponse))
    );
  }

  getPayments(): Observable<CarrierPayment[]> {
    return this.http.get<CarrierPayment[]>(`${this.api}/payments`).pipe(
      catchError(() => of([] as CarrierPayment[]))
    );
  }

  getNotifications(): Observable<CarrierNotification[]> {
    return this.http.get<CarrierNotification[]>(`${this.api}/notifications`).pipe(
      catchError(() => of([] as CarrierNotification[]))
    );
  }

  markNotificationRead(id: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.api}/notifications/${id}/read`, {});
  }

  markAllNotificationsRead(): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.api}/notifications/read-all`, {});
  }
}
