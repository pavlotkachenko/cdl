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
}

export interface CaseDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  url?: string;
}

@Injectable({ providedIn: 'root' })
export class AttorneyService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/cases`;

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
}
