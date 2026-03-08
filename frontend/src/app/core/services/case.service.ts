// ============================================
// Case Service - Backend Integration Service
// Location: frontend/src/app/core/services/case.service.ts
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Case {
  id: string;
  case_number?: string;
  userId?: string;
  ticketNumber?: string;
  type?: string;
  status: string;
  citationNumber?: string;
  citation_number?: string;
  violationDate?: Date | string;
  violation_date?: Date | string;
  violation_type?: string;
  state?: string;
  location?: string;
  description?: string;
  courtDate?: Date | string;
  court_date?: Date | string;
  documents?: any[];
  statusHistory?: any[];
  assignedAttorney?: string;
  attorney?: { id: string; full_name: string; email?: string; phone?: string } | null;
  attorney_price?: number;
  resolution?: string;
  createdAt?: Date | string;
  created_at?: Date | string;
  updatedAt?: Date | string;
  full_name?: string;
  driver_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  // API URL - will use environment variable or fallback to localhost
  private apiUrl = '/api';

  // Mock data for development (until backend is ready)
  private mockCases: Case[] = [
    {
      id: 'case-001',
      ticketNumber: 'TCK-001',
      type: 'Speeding',
      violation_type: 'Speeding',
      status: 'under_review',
      citationNumber: 'CA-SPD-123456',
      violationDate: new Date('2026-02-05'),
      location: 'Los Angeles, CA',
      state: 'CA',
      description: 'Speeding violation - 75 mph in a 55 mph zone',
      createdAt: new Date('2026-02-05'),
      created_at: new Date('2026-02-05')
    },
    {
      id: 'case-002',
      ticketNumber: 'TCK-002',
      type: 'CDL Violation',
      violation_type: 'CDL Violation',
      status: 'in_progress',
      citationNumber: 'CA-CDL-789012',
      violationDate: new Date('2026-02-03'),
      location: 'Sacramento, CA',
      state: 'CA',
      description: 'Failure to maintain proper logbook records',
      createdAt: new Date('2026-02-03'),
      created_at: new Date('2026-02-03')
    },
    {
      id: 'case-003',
      ticketNumber: 'TCK-003',
      type: 'Traffic',
      violation_type: 'Traffic',
      status: 'resolved',
      citationNumber: 'AZ-TRF-345678',
      violationDate: new Date('2026-01-28'),
      location: 'Phoenix, AZ',
      state: 'AZ',
      description: 'Improper lane change',
      createdAt: new Date('2026-01-28'),
      created_at: new Date('2026-01-28')
    }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Get all cases for the current user
   */
  getMyCases(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cases/my-cases`).pipe(
      map(response => ({ data: response.cases || [] }))
    );
  }

  /**
   * Get recent cases (limited number)
   */
  getRecentCases(limit: number = 5): Observable<any> {
    // TODO: Replace with actual HTTP call
    // return this.http.get(`${this.apiUrl}/cases/recent`, {
    //   params: { limit: limit.toString() }
    // });
    
    const recentCases = this.mockCases.slice(0, limit);
    return of({ data: recentCases }).pipe(delay(700));
  }

  /**
   * Get a single case by ID
   */
  getCaseById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cases/${id}`).pipe(
      map(response => ({ data: response.case || response }))
    );
  }

  /**
   * Create a new case
   */
  createCase(caseData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/cases`, caseData);
  }

  /**
   * Public submission from landing page (no auth required)
   */
  publicSubmit(formData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/cases/public-submit`, formData);
  }

  /**
   * Update a case
   */
  updateCase(id: string, caseData: any): Observable<any> {
    // TODO: Replace with actual HTTP call
    // return this.http.put(`${this.apiUrl}/cases/${id}`, caseData);
    
    const caseIndex = this.mockCases.findIndex(c => c.id === id);
    if (caseIndex !== -1) {
      this.mockCases[caseIndex] = { ...this.mockCases[caseIndex], ...caseData };
      return of({ data: this.mockCases[caseIndex] }).pipe(delay(800));
    }
    return of({ error: 'Case not found' }).pipe(delay(800));
  }

  /**
   * Delete a case
   */
  deleteCase(id: string): Observable<any> {
    // TODO: Replace with actual HTTP call
    // return this.http.delete(`${this.apiUrl}/cases/${id}`);
    
    const caseIndex = this.mockCases.findIndex(c => c.id === id);
    if (caseIndex !== -1) {
      this.mockCases.splice(caseIndex, 1);
      return of({ success: true }).pipe(delay(600));
    }
    return of({ error: 'Case not found' }).pipe(delay(600));
  }

  /**
   * List documents for a case
   */
  listDocuments(caseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cases/${caseId}/documents`);
  }

  /**
   * Upload document for a case
   */
  uploadDocument(caseId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/cases/${caseId}/documents`, formData);
  }

  /**
   * Delete a document from a case
   */
  deleteDocument(caseId: string, documentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cases/${caseId}/documents/${documentId}`);
  }

  /**
   * Get operator case queue
   */
  getOperatorCases(status = 'new'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/operator/cases`, { params: { status } });
  }

  /**
   * Get available attorneys for assignment
   */
  getAvailableAttorneys(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/operator/attorneys`);
  }

  /**
   * Assign attorney to case (operator action)
   */
  assignToAttorney(caseId: string, attorneyId: string, price: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/cases/${caseId}/assign-attorney`, {
      attorney_id: attorneyId,
      attorney_price: price
    });
  }

  /**
   * Get case statistics
   */
  getStats(): Observable<any> {
    // TODO: Replace with actual HTTP call
    // return this.http.get(`${this.apiUrl}/cases/stats`);
    
    const activeStatuses = ['new', 'reviewed', 'assigned_to_attorney', 'in_progress', 'under_review'];
    const pendingStatuses = ['waiting_for_driver', 'submitted'];
    const resolvedStatuses = ['resolved', 'closed'];
    const rejectedStatuses = ['rejected', 'denied'];
    
    const stats = {
      total: this.mockCases.length,
      active: this.mockCases.filter(c => activeStatuses.includes(c.status)).length,
      pending: this.mockCases.filter(c => pendingStatuses.includes(c.status)).length,
      resolved: this.mockCases.filter(c => resolvedStatuses.includes(c.status)).length,
      rejected: this.mockCases.filter(c => rejectedStatuses.includes(c.status)).length
    };
    
    return of(stats).pipe(delay(600));
  }

  /**
   * Update case status
   */
  updateStatus(id: string, status: string, note?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cases/${id}/status`, { status, comment: note });
  }

  /**
   * Attorney accepts an assigned case
   */
  acceptCase(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cases/${id}/accept`, {});
  }

  /**
   * Attorney declines an assigned case
   */
  declineCase(id: string, reason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cases/${id}/decline`, { reason });
  }

  /**
   * Get top 3 recommended attorneys for a case
   */
  getRecommendedAttorneys(caseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/cases/${caseId}/attorneys`);
  }

  /**
   * Driver selects an attorney from recommendations
   */
  selectAttorney(caseId: string, attorneyId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cases/${caseId}/select-attorney`, { attorney_id: attorneyId });
  }

  /**
   * Get cases with filters
   */
  getCasesWithFilters(filters: {
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<any> {
    // TODO: Replace with actual HTTP call
    // return this.http.get(`${this.apiUrl}/cases`, { params: filters as any });
    
    let filtered = [...this.mockCases];
    
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    if (filters.type) {
      filtered = filtered.filter(c => c.type === filters.type);
    }
    
    return of({ data: filtered }).pipe(delay(800));
  }
}
