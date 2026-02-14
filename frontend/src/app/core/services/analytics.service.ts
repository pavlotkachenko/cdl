// ============================================
// Analytics Service - Data Processing & Calculations
// Location: frontend/src/app/core/services/analytics.service.ts
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AnalyticsSummary {
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  winRate: number;
  avgResolutionDays: number;
  pendingCases: number;
}

export interface CasesByType {
  type: string;
  count: number;
  percentage: number;
}

export interface CasesByStatus {
  status: string;
  count: number;
  color: string;
}

export interface TimeSeriesData {
  date: string;
  cases: number;
  resolved: number;
}

export interface LocationData {
  state: string;
  count: number;
  successRate: number;
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface PredictionData {
  estimatedDays: number;
  confidence: number;
  factors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  
  private summarySubject = new BehaviorSubject<AnalyticsSummary | null>(null);
  public summary$ = this.summarySubject.asObservable();

  constructor(private http: HttpClient) {}

  // ============================================
  // Summary Statistics
  // ============================================

  getSummary(dateRange?: { from: Date; to: Date }): Observable<AnalyticsSummary> {
    // In production: GET /api/analytics/summary?from=...&to=...
    return this.http.get<{data: AnalyticsSummary}>(`${this.apiUrl}/analytics/summary`)
      .pipe(
        map(response => response.data),
        catchError(() => of(this.getMockSummary()))
      );
  }

  private getMockSummary(): AnalyticsSummary {
    return {
      totalCases: 47,
      activeCases: 12,
      resolvedCases: 28,
      winRate: 85.7, // percentage
      avgResolutionDays: 34,
      pendingCases: 7
    };
  }

  // ============================================
  // Cases by Type
  // ============================================

  getCasesByType(dateRange?: { from: Date; to: Date }): Observable<CasesByType[]> {
    return this.http.get<{data: CasesByType[]}>(`${this.apiUrl}/analytics/by-type`)
      .pipe(
        map(response => response.data),
        catchError(() => of(this.getMockCasesByType()))
      );
  }

  private getMockCasesByType(): CasesByType[] {
    const data = [
      { type: 'Speeding', count: 18 },
      { type: 'CDL Violation', count: 12 },
      { type: 'DUI', count: 8 },
      { type: 'Reckless Driving', count: 5 },
      { type: 'Improper Lane Change', count: 4 }
    ];

    const total = data.reduce((sum, item) => sum + item.count, 0);
    
    return data.map(item => ({
      ...item,
      percentage: (item.count / total) * 100
    }));
  }

  // ============================================
  // Cases by Status
  // ============================================

  getCasesByStatus(): Observable<CasesByStatus[]> {
    return this.http.get<{data: CasesByStatus[]}>(`${this.apiUrl}/analytics/by-status`)
      .pipe(
        map(response => response.data),
        catchError(() => of(this.getMockCasesByStatus()))
      );
  }

  private getMockCasesByStatus(): CasesByStatus[] {
    return [
      { status: 'New', count: 7, color: '#3b82f6' },
      { status: 'Under Review', count: 5, color: '#f59e0b' },
      { status: 'In Progress', count: 8, color: '#8b5cf6' },
      { status: 'Resolved', count: 28, color: '#10b981' },
      { status: 'Rejected', count: 2, color: '#ef4444' }
    ];
  }

  // ============================================
  // Time Series Data
  // ============================================

  getTimeSeriesData(
    period: 'week' | 'month' | 'quarter' | 'year'
  ): Observable<TimeSeriesData[]> {
    return this.http.get<{data: TimeSeriesData[]}>(`${this.apiUrl}/analytics/timeseries?period=${period}`)
      .pipe(
        map(response => response.data),
        catchError(() => of(this.getMockTimeSeriesData(period)))
      );
  }

  private getMockTimeSeriesData(period: string): TimeSeriesData[] {
    const now = new Date();
    const data: TimeSeriesData[] = [];

    if (period === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          cases: Math.floor(Math.random() * 5) + 1,
          resolved: Math.floor(Math.random() * 3)
        });
      }
    } else if (period === 'month') {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          cases: Math.floor(Math.random() * 3) + 1,
          resolved: Math.floor(Math.random() * 2)
        });
      }
    } else if (period === 'quarter') {
      // Last 3 months
      for (let i = 2; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'long' }),
          cases: Math.floor(Math.random() * 20) + 10,
          resolved: Math.floor(Math.random() * 15) + 5
        });
      }
    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          cases: Math.floor(Math.random() * 15) + 5,
          resolved: Math.floor(Math.random() * 10) + 3
        });
      }
    }

    return data;
  }

  // ============================================
  // Location Data
  // ============================================

  getLocationData(): Observable<LocationData[]> {
    return this.http.get<{data: LocationData[]}>(`${this.apiUrl}/analytics/locations`)
      .pipe(
        map(response => response.data),
        catchError(() => of(this.getMockLocationData()))
      );
  }

  private getMockLocationData(): LocationData[] {
    return [
      { state: 'California', count: 18, successRate: 88.9 },
      { state: 'Nevada', count: 12, successRate: 83.3 },
      { state: 'Arizona', count: 8, successRate: 87.5 },
      { state: 'Oregon', count: 5, successRate: 80.0 },
      { state: 'Utah', count: 4, successRate: 100.0 }
    ];
  }

  // ============================================
  // Trends Analysis
  // ============================================

  getTrends(): Observable<{
    caseVolume: TrendData;
    resolutionTime: TrendData;
    winRate: TrendData;
  }> {
    return this.http.get<any>(`${this.apiUrl}/analytics/trends`)
      .pipe(
        map(response => response.data),
        catchError(() => of(this.getMockTrends()))
      );
  }

  private getMockTrends() {
    return {
      caseVolume: {
        period: 'This Month',
        value: 12,
        change: 3,
        changePercent: 33.3
      },
      resolutionTime: {
        period: 'This Month',
        value: 28,
        change: -6,
        changePercent: -17.6
      },
      winRate: {
        period: 'This Month',
        value: 91.7,
        change: 5.9,
        changePercent: 6.9
      }
    };
  }

  // ============================================
  // Predictions
  // ============================================

  predictResolutionTime(caseType: string, state: string): Observable<PredictionData> {
    return this.http.post<{data: PredictionData}>(`${this.apiUrl}/analytics/predict`, {
      caseType,
      state
    }).pipe(
      map(response => response.data),
      catchError(() => of(this.getMockPrediction(caseType)))
    );
  }

  private getMockPrediction(caseType: string): PredictionData {
    const baseTime: Record<string, number> = {
      'Speeding': 25,
      'CDL Violation': 45,
      'DUI': 60,
      'Reckless Driving': 50,
      'Improper Lane Change': 30
    };

    return {
      estimatedDays: baseTime[caseType] || 35,
      confidence: 78,
      factors: [
        'Historical average for this violation type',
        'Court backlog in your jurisdiction',
        'Similar cases resolved in 20-35 days'
      ]
    };
  }

  // ============================================
  // Custom Reports
  // ============================================

  generateCustomReport(params: {
    dateFrom: Date;
    dateTo: Date;
    types?: string[];
    statuses?: string[];
    states?: string[];
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/analytics/custom-report`, params)
      .pipe(
        catchError(() => of({
          summary: this.getMockSummary(),
          byType: this.getMockCasesByType(),
          byStatus: this.getMockCasesByStatus(),
          timeline: this.getMockTimeSeriesData('month')
        }))
      );
  }

  // ============================================
  // Utility Methods
  // ============================================

  calculateWinRate(resolved: number, successful: number): number {
    if (resolved === 0) return 0;
    return (successful / resolved) * 100;
  }

  calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  formatDuration(days: number): string {
    if (days < 1) return 'Less than a day';
    if (days === 1) return '1 day';
    if (days < 7) return `${Math.round(days)} days`;
    if (days < 30) return `${Math.round(days / 7)} weeks`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  }

  getChangeIcon(change: number): string {
    if (change > 0) return 'trending_up';
    if (change < 0) return 'trending_down';
    return 'trending_flat';
  }

  getChangeColor(change: number, inverse: boolean = false): string {
    const positive = inverse ? change < 0 : change > 0;
    if (positive) return '#10b981'; // green
    if (change === 0) return '#6b7280'; // gray
    return '#ef4444'; // red
  }
}
