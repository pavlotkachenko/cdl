import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AttorneyCase {
  id: string;
  case_number: string;
  status: string;
  violation_type: string;
  state: string;
  driver_name: string;
  created_at: string;
  attorney_price?: number;
  type_specific_data?: Record<string, unknown>;
  violation_regulation_code?: string;
  violation_severity?: string;
}

export interface CaseDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  url?: string;
}

export interface CaseNote {
  id: string;
  content: string;
  created_at: string;
  author?: string;
}

export interface CourtDate {
  id?: string;
  court_date: string;
  location?: string;
  notes?: string;
}

export interface AttorneyRating {
  attorney_id: string;
  average_score: number | null;
  total_ratings: number;
}

@Injectable({ providedIn: 'root' })
export class AttorneyService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/cases`;
  private ratingsApi = `${environment.apiUrl}/ratings`;

  getMyCases(): Observable<{ cases: AttorneyCase[] }> {
    return this.http.get<{ cases: AttorneyCase[] }>(`${this.api}/my-cases`);
  }

  getCaseById(id: string): Observable<{ data: AttorneyCase }> {
    return this.http.get<{ data: AttorneyCase }>(`${this.api}/${id}`);
  }

  getDocuments(caseId: string): Observable<{ documents: CaseDocument[] }> {
    return this.http.get<{ documents: CaseDocument[] }>(`${this.api}/${caseId}/documents`);
  }

  acceptCase(caseId: string): Observable<void> {
    return this.http.post<void>(`${this.api}/${caseId}/accept`, {});
  }

  declineCase(caseId: string, reason?: string): Observable<void> {
    return this.http.post<void>(`${this.api}/${caseId}/decline`, { reason });
  }

  updateStatus(caseId: string, status: string, comment?: string): Observable<void> {
    return this.http.post<void>(`${this.api}/${caseId}/status`, { status, comment });
  }

  getCaseNotes(caseId: string): Observable<{ notes: CaseNote[] }> {
    return this.http.get<{ notes: CaseNote[] }>(`${this.api}/${caseId}/notes`);
  }

  addNote(caseId: string, content: string): Observable<{ note: CaseNote }> {
    return this.http.post<{ note: CaseNote }>(`${this.api}/${caseId}/notes`, { content });
  }

  getCourtDate(caseId: string): Observable<{ court_date: CourtDate | null }> {
    return this.http.get<{ court_date: CourtDate | null }>(`${this.api}/${caseId}/court-date`);
  }

  setCourtDate(caseId: string, date: string, location?: string, notes?: string): Observable<void> {
    return this.http.post<void>(`${this.api}/${caseId}/court-date`, { court_date: date, location, notes });
  }

  uploadDocument(caseId: string, file: File): Observable<{ document: CaseDocument }> {
    const formData = new FormData();
    formData.append('document', file);
    return this.http.post<{ document: CaseDocument }>(`${this.api}/${caseId}/documents`, formData);
  }

  getMyRating(): Observable<AttorneyRating> {
    return this.http.get<AttorneyRating>(`${this.ratingsApi}/me`);
  }
}
