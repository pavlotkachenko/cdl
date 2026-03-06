import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DriverAnalytics {
  totalCases: number;
  openCases: number;
  resolvedCases: number;
  successRate: number;
  casesByMonth: { month: string; count: number }[];
  violationBreakdown: { type: string; count: number; pct: number }[];
}

@Injectable({ providedIn: 'root' })
export class DriverAnalyticsService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/drivers/me`;

  getAnalytics(): Observable<DriverAnalytics> {
    return this.http.get<DriverAnalytics>(`${this.api}/analytics`);
  }
}
