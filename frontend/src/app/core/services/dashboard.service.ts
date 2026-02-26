/**
 * Dashboard Service - Operator workload and case queue management
 * Location: frontend/src/app/core/services/dashboard.service.ts
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface WorkloadStats {
  totalCases: number;
  newCases: number;
  assignedCases: number;
  inProgressCases: number;
  resolvedCases: number;
  averageResolutionTime: number;
  todaysCases: number;
}

export interface CaseQueueItem {
  caseId: string;
  driverName: string;
  violationType: string;
  violationDate: string;
  violationState: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  createdAt: string;
  suggestedAttorneys?: SuggestedAttorney[];
}

export interface SuggestedAttorney {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  score: number;
  scoreBreakdown: {
    specialization: number;
    stateLicense: number;
    workload: number;
    successRate: number;
    availability: number;
  };
  specializations: string[];
  stateLicenses: string[];
  currentCases: number;
  availabilityStatus: string;
}

export interface BulkAssignmentResult {
  success: boolean;
  assigned: number;
  failed: number;
  results: Array<{
    caseId: string;
    success: boolean;
    attorneyId?: string;
    error?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/api`;
  private workloadSubject = new BehaviorSubject<WorkloadStats | null>(null);
  private queueSubject = new BehaviorSubject<CaseQueueItem[]>([]);

  public workload$ = this.workloadSubject.asObservable();
  public queue$ = this.queueSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get operator workload statistics
   */
  getWorkloadStats(operatorId?: string): Observable<WorkloadStats> {
    let params = new HttpParams();
    if (operatorId) {
      params = params.set('operatorId', operatorId);
    }

    return this.http.get<WorkloadStats>(`${this.apiUrl}/dashboard/workload`, { params })
      .pipe(
        tap(stats => this.workloadSubject.next(stats))
      );
  }

  /**
   * Get new cases queue with optional filters
   */
  getCaseQueue(filters?: {
    status?: string;
    priority?: string;
    violationType?: string;
    state?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<{ cases: CaseQueueItem[], total: number }> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<{ cases: CaseQueueItem[], total: number }>(
      `${this.apiUrl}/dashboard/queue`,
      { params }
    ).pipe(
      tap(response => this.queueSubject.next(response.cases))
    );
  }

  /**
   * Get suggested attorneys for a case with scores
   */
  getSuggestedAttorneys(caseId: string): Observable<SuggestedAttorney[]> {
    return this.http.get<SuggestedAttorney[]>(
      `${this.apiUrl}/assignment/rank/${caseId}`
    );
  }

  /**
   * Assign case to attorney (manual assignment)
   */
  assignCase(caseId: string, attorneyId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/assignment/manual`, {
      caseId,
      attorneyId
    });
  }

  /**
   * Auto-assign case to best-matched attorney
   */
  autoAssignCase(caseId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/assignment/auto`, {
      caseId
    });
  }

  /**
   * Bulk assign multiple cases
   */
  bulkAssignCases(
    caseIds: string[],
    attorneyId?: string,
    useAutoAssignment = false
  ): Observable<BulkAssignmentResult> {
    return this.http.post<BulkAssignmentResult>(`${this.apiUrl}/assignment/bulk`, {
      caseIds,
      attorneyId,
      useAutoAssignment
    });
  }

  /**
   * Get workload distribution by attorney
   */
  getAttorneyWorkloadDistribution(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/dashboard/attorney-workload`);
  }

  /**
   * Get case status distribution for charts
   */
  getCaseStatusDistribution(days = 30): Observable<any> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<any>(`${this.apiUrl}/dashboard/status-distribution`, { params });
  }

  /**
   * Get violation type distribution for charts
   */
  getViolationTypeDistribution(days = 30): Observable<any> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<any>(`${this.apiUrl}/dashboard/violation-distribution`, { params });
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(operatorId?: string): void {
    this.getWorkloadStats(operatorId).subscribe();
    this.getCaseQueue({ status: 'new', limit: 50 }).subscribe();
  }
}
