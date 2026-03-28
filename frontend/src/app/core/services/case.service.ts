// ============================================
// Case Service - Backend Integration Service
// Location: frontend/src/app/core/services/case.service.ts
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  attorney?: { id: string; full_name: string; email?: string; phone?: string; win_rate?: number; years_experience?: number; cases_won?: number } | null;
  attorney_price?: number;
  resolution?: string;
  createdAt?: Date | string;
  created_at?: Date | string;
  updatedAt?: Date | string;
  full_name?: string;
  driver_id?: string;
  type_specific_data?: Record<string, unknown>;
  violation_regulation_code?: string;
  violation_severity?: string;
  fine_amount?: number;
  alleged_speed?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  // API URL - will use environment variable or fallback to localhost
  private apiUrl = '/api';

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
    return this.http.get<any>(`${this.apiUrl}/cases/my-cases`).pipe(
      map(response => ({ data: (response.cases || []).slice(0, limit) }))
    );
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
    return this.http.patch<any>(`${this.apiUrl}/cases/${id}`, caseData).pipe(
      map(response => ({ data: response.case || response }))
    );
  }

  /**
   * Delete a case
   */
  deleteCase(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/cases/${id}`);
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
   * Get operator's own assigned cases
   */
  getOperatorCases(status?: string): Observable<any> {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.http.get<any>(`${this.apiUrl}/operator/cases`, { params });
  }

  /**
   * Get unassigned cases for operator queue
   */
  getUnassignedCases(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/operator/unassigned`);
  }

  /**
   * Get all active (non-closed) cases for team view
   */
  getTeamCases(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/operator/team-cases`);
  }

  /**
   * Get operator's own closed/resolved cases (archive)
   */
  getClosedCases(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/operator/closed-cases`);
  }

  /**
   * Operator requests assignment to an unassigned case
   */
  requestAssignment(caseId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/operator/cases/${caseId}/request-assignment`, {});
  }

  /**
   * Get operator case detail (driver, attorney, court dates, activity)
   */
  getOperatorCaseDetail(caseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/operator/cases/${caseId}`);
  }

  /**
   * Patch case fields (operator inline edit)
   */
  patchCase(caseId: string, fields: Record<string, unknown>): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/cases/${caseId}`, fields);
  }

  /**
   * Update case status (operator action)
   */
  updateOperatorCaseStatus(caseId: string, status: string, note?: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/operator/cases/${caseId}/status`, { status, note });
  }

  /**
   * Get ranked attorneys for a case (assignment scoring)
   */
  getRankedAttorneys(caseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/assignment/cases/${caseId}/attorneys`);
  }

  /**
   * Auto-assign case to best-scoring attorney
   */
  autoAssignCase(caseId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/assignment/cases/${caseId}/auto-assign`, {});
  }

  /**
   * Manually assign case to a specific attorney
   */
  manualAssignCase(caseId: string, attorneyId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/assignment/cases/${caseId}/manual-assign`, { attorneyId });
  }

  // ── OC-4: Operator messaging ────────────────────────────────────

  getCaseConversation(caseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/operator/cases/${caseId}/conversation`);
  }

  getCaseMessages(caseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/operator/cases/${caseId}/messages`).pipe(
      map(r => r.data ?? r),
    );
  }

  sendCaseMessage(caseId: string, content: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/operator/cases/${caseId}/messages`, { content });
  }

  // ── CD-2: Driver-accessible case messaging ─────────────────────

  getCaseConversationForDriver(caseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/cases/${caseId}/conversation`);
  }

  getCaseMessagesForDriver(caseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/cases/${caseId}/messages`);
  }

  sendCaseMessageForDriver(caseId: string, content: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cases/${caseId}/messages`, { content });
  }

  // ── CD-5: Activity log ─────────────────────────────────────────

  getCaseActivity(caseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/cases/${caseId}/activity`);
  }

  // ── CT-5: Operator All-Cases Table ──────────────────────────────

  getOperatorAllCases(params?: Record<string, string | number>): Observable<{ cases: any[]; total: number }> {
    return this.http.get<{ cases: any[]; total: number }>(`${this.apiUrl}/operator/all-cases`, { params: params as any });
  }

  // ── OC-5: Batch OCR ────────────────────────────────────────────

  batchOcr(files: File[]): Observable<any> {
    const fd = new FormData();
    files.forEach(f => fd.append('tickets', f));
    return this.http.post<any>(`${this.apiUrl}/operator/batch-ocr`, fd);
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
    return this.http.get<any>(`${this.apiUrl}/cases/stats`);
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
    const params: Record<string, string> = {};
    if (filters.status) params['status'] = filters.status;
    if (filters.type) params['type'] = filters.type;
    if (filters.dateFrom) params['dateFrom'] = filters.dateFrom;
    if (filters.dateTo) params['dateTo'] = filters.dateTo;

    return this.http.get<any>(`${this.apiUrl}/cases`, { params });
  }
}
