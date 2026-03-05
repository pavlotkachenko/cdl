// ============================================
// Case Service - Backend Integration Service
// Location: frontend/src/app/core/services/case.service.ts
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

export interface Case {
  id: string;
  userId?: string;
  ticketNumber?: string;
  type?: string;
  status: string;
  citationNumber?: string;
  violationDate?: Date | string;
  violation_type?: string;
  state?: string;
  location?: string;
  description?: string;
  courtDate?: Date | string;
  documents?: any[];
  statusHistory?: any[];
  assignedAttorney?: string;
  resolution?: string;
  createdAt?: Date | string;
  created_at?: Date | string;
  updatedAt?: Date | string;
  full_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  // API URL - will use environment variable or fallback to localhost
  private apiUrl = 'http://localhost:3000/api';

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
   * Returns mock data if backend is not available
   */
  getMyCases(): Observable<any> {
    // TODO: Replace with actual HTTP call when backend is ready
    // return this.http.get(`${this.apiUrl}/cases/my-cases`);
    
    // Return mock data for now
    return of({ data: this.mockCases }).pipe(delay(800));
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
    // TODO: Replace with actual HTTP call
    // return this.http.get(`${this.apiUrl}/cases/${id}`);
    
    const caseItem = this.mockCases.find(c => c.id === id);
    return of({ data: caseItem }).pipe(delay(600));
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
   * Upload document for a case
   */
  uploadDocument(caseId: string, file: File): Observable<any> {
    // TODO: Replace with actual HTTP call
    // const formData = new FormData();
    // formData.append('file', file);
    // return this.http.post(`${this.apiUrl}/cases/${caseId}/documents`, formData);
    
    return of({ 
      success: true, 
      fileName: file.name,
      fileSize: file.size 
    }).pipe(delay(1500));
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
    // TODO: Replace with actual HTTP call
    // return this.http.patch(`${this.apiUrl}/cases/${id}/status`, { status, note });
    
    const caseItem = this.mockCases.find(c => c.id === id);
    if (caseItem) {
      caseItem.status = status;
      return of({ data: caseItem }).pipe(delay(800));
    }
    return of({ error: 'Case not found' }).pipe(delay(800));
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
