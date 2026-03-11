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

// ── Mock data ──
const MOCK_STATS: FleetStats = { totalDrivers: 24, activeCases: 7, pendingCases: 3, resolvedCases: 48 };

const MOCK_DRIVERS: FleetDriver[] = [
  { id: 'd1', full_name: 'Miguel Rodriguez', cdl_number: 'CDL-TX-384729', openCases: 2 },
  { id: 'd2', full_name: 'James Williams', cdl_number: 'CDL-CA-192837', openCases: 1 },
  { id: 'd3', full_name: 'Robert Johnson', cdl_number: 'CDL-FL-847261', openCases: 0 },
  { id: 'd4', full_name: 'Carlos Martinez', cdl_number: 'CDL-TX-573920', openCases: 3 },
  { id: 'd5', full_name: 'David Chen', cdl_number: 'CDL-IL-628401', openCases: 0 },
  { id: 'd6', full_name: 'Kevin Brown', cdl_number: 'CDL-GA-401928', openCases: 1 },
  { id: 'd7', full_name: 'Andre Wilson', cdl_number: 'CDL-OH-739281', openCases: 0 },
  { id: 'd8', full_name: 'Luis Garcia', cdl_number: 'CDL-NJ-284019', openCases: 0 },
];

const MOCK_CASES: FleetCase[] = [
  { id: 'c1', case_number: 'CDL-2025-0471', driver_name: 'Miguel Rodriguez', violation_type: 'Speeding', state: 'TX', status: 'assigned_to_attorney', attorney_name: 'Sarah Mitchell' },
  { id: 'c2', case_number: 'CDL-2025-0468', driver_name: 'Miguel Rodriguez', violation_type: 'Logbook Violation', state: 'TX', status: 'send_info_to_attorney', attorney_name: 'Sarah Mitchell' },
  { id: 'c3', case_number: 'CDL-2025-0459', driver_name: 'James Williams', violation_type: 'Overweight', state: 'CA', status: 'new', attorney_name: '' },
  { id: 'c4', case_number: 'CDL-2025-0445', driver_name: 'Carlos Martinez', violation_type: 'Speeding', state: 'TX', status: 'call_court', attorney_name: 'John Peters' },
  { id: 'c5', case_number: 'CDL-2025-0440', driver_name: 'Carlos Martinez', violation_type: 'Lane Violation', state: 'OK', status: 'reviewed', attorney_name: '' },
  { id: 'c6', case_number: 'CDL-2025-0438', driver_name: 'Carlos Martinez', violation_type: 'Equipment Violation', state: 'TX', status: 'check_with_manager', attorney_name: 'Sarah Mitchell' },
  { id: 'c7', case_number: 'CDL-2025-0430', driver_name: 'Kevin Brown', violation_type: 'Following Too Closely', state: 'GA', status: 'pay_attorney', attorney_name: 'Lisa Chang' },
  { id: 'c8', case_number: 'CDL-2025-0412', driver_name: 'David Chen', violation_type: 'Speeding', state: 'IL', status: 'closed', attorney_name: 'John Peters' },
  { id: 'c9', case_number: 'CDL-2025-0398', driver_name: 'Robert Johnson', violation_type: 'Logbook Violation', state: 'FL', status: 'resolved', attorney_name: 'Sarah Mitchell' },
  { id: 'c10', case_number: 'CDL-2025-0385', driver_name: 'Andre Wilson', violation_type: 'Overweight', state: 'OH', status: 'resolved', attorney_name: 'Lisa Chang' },
];

const MOCK_CSA: CsaScoreResponse = {
  csaScore: 42,
  riskLevel: 'medium',
  openViolations: 7,
  breakdown: { hos: 3, maintenance: 1, speeding_major: 2, speeding_minor: 1, other: 0 },
};

const MOCK_ANALYTICS: FleetAnalytics = {
  totalCases: 58,
  successRate: 82,
  avgResolutionDays: 18,
  estimatedSavings: 34500,
  casesByMonth: [
    { month: 'Oct', count: 6 },
    { month: 'Nov', count: 9 },
    { month: 'Dec', count: 4 },
    { month: 'Jan', count: 11 },
    { month: 'Feb', count: 8 },
    { month: 'Mar', count: 7 },
  ],
  violationBreakdown: [
    { type: 'Speeding', count: 22, pct: 38 },
    { type: 'Logbook Violation', count: 14, pct: 24 },
    { type: 'Overweight', count: 9, pct: 16 },
    { type: 'Equipment', count: 7, pct: 12 },
    { type: 'Lane Violation', count: 6, pct: 10 },
  ],
  atRiskDrivers: [
    { id: 'd4', name: 'Carlos Martinez', openCases: 3, riskLevel: 'red' },
    { id: 'd1', name: 'Miguel Rodriguez', openCases: 2, riskLevel: 'yellow' },
    { id: 'd2', name: 'James Williams', openCases: 1, riskLevel: 'green' },
    { id: 'd6', name: 'Kevin Brown', openCases: 1, riskLevel: 'green' },
  ],
};

const MOCK_PROFILE: CarrierProfile = {
  company_name: 'Pacific Coast Logistics',
  usdot_number: 'USDOT-2847193',
  email: 'dispatch@pacificcoastlogistics.com',
  phone_number: '(555) 847-2930',
  notify_on_new_ticket: true,
};

export const MOCK_PAYMENTS: CarrierPayment[] = [
  { id: 'p1', date: '2025-03-08', description: 'Attorney fee — CDL-2025-0471', amount: 450, status: 'paid', case_number: 'CDL-2025-0471' },
  { id: 'p2', date: '2025-03-05', description: 'Attorney fee — CDL-2025-0445', amount: 375, status: 'paid', case_number: 'CDL-2025-0445' },
  { id: 'p3', date: '2025-03-01', description: 'Attorney fee — CDL-2025-0438', amount: 500, status: 'pending', case_number: 'CDL-2025-0438' },
  { id: 'p4', date: '2025-02-22', description: 'Attorney fee — CDL-2025-0430', amount: 325, status: 'paid', case_number: 'CDL-2025-0430' },
  { id: 'p5', date: '2025-02-15', description: 'Attorney fee — CDL-2025-0412', amount: 400, status: 'paid', case_number: 'CDL-2025-0412' },
  { id: 'p6', date: '2025-02-08', description: 'Court filing — CDL-2025-0398', amount: 150, status: 'paid', case_number: 'CDL-2025-0398' },
  { id: 'p7', date: '2025-01-30', description: 'Attorney fee — CDL-2025-0385', amount: 375, status: 'failed', case_number: 'CDL-2025-0385' },
];

export const MOCK_NOTIFICATIONS: CarrierNotification[] = [
  { id: 'n1', title: 'New case submitted', message: 'Miguel Rodriguez submitted a speeding ticket (CDL-2025-0471).', type: 'info', read: false, created_at: '2025-03-10T14:22:00Z' },
  { id: 'n2', title: 'Attorney assigned', message: 'Sarah Mitchell was assigned to case CDL-2025-0471.', type: 'success', read: false, created_at: '2025-03-10T15:05:00Z' },
  { id: 'n3', title: 'Case resolved', message: 'Case CDL-2025-0398 resolved — violation dismissed.', type: 'success', read: true, created_at: '2025-03-09T10:30:00Z' },
  { id: 'n4', title: 'Payment failed', message: 'Payment for CDL-2025-0385 failed. Please update card.', type: 'error', read: false, created_at: '2025-03-08T16:45:00Z' },
  { id: 'n5', title: 'CSA score updated', message: 'Your CSA score changed from 38 to 42. Review risk factors.', type: 'warning', read: true, created_at: '2025-03-07T09:00:00Z' },
  { id: 'n6', title: 'Court date scheduled', message: 'Case CDL-2025-0445 court date: April 15, 2025.', type: 'info', read: true, created_at: '2025-03-06T11:15:00Z' },
  { id: 'n7', title: 'Driver added', message: 'Luis Garcia was added to your fleet.', type: 'info', read: true, created_at: '2025-03-05T08:30:00Z' },
  { id: 'n8', title: 'Compliance report ready', message: 'Your Q1 2025 compliance report is ready for download.', type: 'info', read: true, created_at: '2025-03-01T07:00:00Z' },
];

@Injectable({ providedIn: 'root' })
export class CarrierService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/carriers/me`;

  getStats(): Observable<FleetStats> {
    return this.http.get<FleetStats>(`${this.api}/stats`).pipe(
      catchError(() => of(MOCK_STATS))
    );
  }

  getDrivers(): Observable<{ drivers: FleetDriver[] }> {
    return this.http.get<{ drivers: FleetDriver[] }>(`${this.api}/drivers`).pipe(
      catchError(() => of({ drivers: MOCK_DRIVERS }))
    );
  }

  addDriver(data: { full_name: string; cdl_number: string }): Observable<{ driver: FleetDriver }> {
    return this.http.post<{ driver: FleetDriver }>(`${this.api}/drivers`, data).pipe(
      catchError(() => of({ driver: { id: 'd' + Date.now(), full_name: data.full_name, cdl_number: data.cdl_number, openCases: 0 } }))
    );
  }

  removeDriver(driverId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/drivers/${driverId}`).pipe(
      catchError(() => of({ message: 'Driver removed (mock)' }))
    );
  }

  getCases(status?: string): Observable<{ cases: FleetCase[] }> {
    const url = status && status !== 'all'
      ? `${this.api}/cases?status=${status}`
      : `${this.api}/cases`;
    return this.http.get<{ cases: FleetCase[] }>(url).pipe(
      catchError(() => of({ cases: MOCK_CASES }))
    );
  }

  getProfile(): Observable<{ carrier: CarrierProfile }> {
    return this.http.get<{ carrier: CarrierProfile }>(this.api).pipe(
      catchError(() => of({ carrier: MOCK_PROFILE }))
    );
  }

  updateProfile(data: Partial<CarrierProfile>): Observable<{ carrier: CarrierProfile }> {
    return this.http.put<{ carrier: CarrierProfile }>(this.api, data).pipe(
      catchError(() => of({ carrier: { ...MOCK_PROFILE, ...data } }))
    );
  }

  getAnalytics(): Observable<FleetAnalytics> {
    return this.http.get<FleetAnalytics>(`${this.api}/analytics`).pipe(
      catchError(() => of(MOCK_ANALYTICS))
    );
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.api}/export?format=csv`, { responseType: 'blob' });
  }

  bulkImport(csv: string): Observable<BulkImportResult> {
    return this.http.post<BulkImportResult>(`${this.api}/bulk-import`, { csv });
  }

  bulkArchive(caseIds: string[]): Observable<{ archived: number }> {
    return this.http.post<{ archived: number }>(`${this.api}/cases/bulk-archive`, { case_ids: caseIds }).pipe(
      catchError(() => of({ archived: caseIds.length }))
    );
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
      catchError(() => of(MOCK_CSA))
    );
  }

  getPayments(): Observable<CarrierPayment[]> {
    return this.http.get<CarrierPayment[]>(`${this.api}/payments`).pipe(
      catchError(() => of(MOCK_PAYMENTS))
    );
  }

  getNotifications(): Observable<CarrierNotification[]> {
    return this.http.get<CarrierNotification[]>(`${this.api}/notifications`).pipe(
      catchError(() => of(MOCK_NOTIFICATIONS))
    );
  }

  markNotificationRead(id: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.api}/notifications/${id}/read`, {}).pipe(
      catchError(() => of({ success: true }))
    );
  }

  markAllNotificationsRead(): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.api}/notifications/read-all`, {}).pipe(
      catchError(() => of({ success: true }))
    );
  }
}
