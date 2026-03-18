import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RevenueMetrics {
  total_revenue: number;
  monthly_recurring_revenue: number;
  success_rate: number;
  total_transactions: number;
  failed_transactions: number;
  refunded_amount: number;
  average_transaction: number;
}

export interface RevenueByDate {
  date: string;
  revenue: number;
  transactions: number;
}

export interface RevenueByMethod {
  method: string;
  revenue: number;
  percentage: number;
}

export interface RevenueByAttorney {
  attorney_id: string;
  attorney_name: string;
  revenue: number;
  transactions: number;
}

export interface RecentTransaction {
  date: string;
  client: string;
  amount: number;
  status: 'completed' | 'pending' | 'refunded' | 'failed';
  method: string;
}

export interface RevenueReport {
  metrics: RevenueMetrics;
  daily_revenue: RevenueByDate[];
  revenue_by_method: RevenueByMethod[];
  revenue_by_attorney: RevenueByAttorney[];
}

export interface DateRange {
  start_date: string;
  end_date: string;
}

@Injectable({
  providedIn: 'root'
})
export class RevenueService {
  private apiUrl = `${environment.apiUrl}/revenue`;

  constructor(private http: HttpClient) {}

  /**
   * Get revenue metrics for a date range
   */
  getRevenueMetrics(dateRange?: DateRange): Observable<RevenueMetrics> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('start_date', dateRange.start_date);
      params = params.set('end_date', dateRange.end_date);
    }
    return this.http.get<RevenueMetrics>(`${this.apiUrl}/metrics`, { params });
  }

  /**
   * Get daily revenue data
   */
  getDailyRevenue(dateRange?: DateRange): Observable<RevenueByDate[]> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('start_date', dateRange.start_date);
      params = params.set('end_date', dateRange.end_date);
    }
    return this.http.get<RevenueByDate[]>(`${this.apiUrl}/daily`, { params });
  }

  /**
   * Get revenue by payment method
   */
  getRevenueByMethod(dateRange?: DateRange): Observable<RevenueByMethod[]> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('start_date', dateRange.start_date);
      params = params.set('end_date', dateRange.end_date);
    }
    return this.http.get<RevenueByMethod[]>(`${this.apiUrl}/by-method`, { params });
  }

  /**
   * Get revenue by attorney
   */
  getRevenueByAttorney(dateRange?: DateRange): Observable<RevenueByAttorney[]> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('start_date', dateRange.start_date);
      params = params.set('end_date', dateRange.end_date);
    }
    return this.http.get<RevenueByAttorney[]>(`${this.apiUrl}/by-attorney`, { params });
  }

  /**
   * Get comprehensive revenue report
   */
  getRevenueReport(dateRange?: DateRange): Observable<RevenueReport> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('start_date', dateRange.start_date);
      params = params.set('end_date', dateRange.end_date);
    }
    return this.http.get<RevenueReport>(`${this.apiUrl}/report`, { params });
  }

  /**
   * Export revenue data to CSV
   */
  exportToCsv(dateRange?: DateRange): Observable<Blob> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('start_date', dateRange.start_date);
      params = params.set('end_date', dateRange.end_date);
    }
    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Get recent transactions
   */
  getRecentTransactions(dateRange?: DateRange): Observable<RecentTransaction[]> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('start_date', dateRange.start_date);
      params = params.set('end_date', dateRange.end_date);
    }
    return this.http.get<RecentTransaction[]>(`${this.apiUrl}/transactions`, { params });
  }

  /**
   * Get monthly growth rate
   */
  getMonthlyGrowth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/growth/monthly`);
  }

  /**
   * Get revenue forecast
   */
  getRevenueForecast(months: number = 3): Observable<any> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get(`${this.apiUrl}/forecast`, { params });
  }
}
