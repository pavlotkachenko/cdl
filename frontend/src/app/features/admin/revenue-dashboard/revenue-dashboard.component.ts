import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  RevenueService,
  RevenueMetrics,
  RevenueByDate,
  RevenueByMethod,
  RevenueByAttorney,
  DateRange
} from '../../../services/revenue.service';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-revenue-dashboard',
  standalone: true,
  templateUrl: './revenue-dashboard.component.html',
  styleUrls: ['./revenue-dashboard.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
  ],
})
export class RevenueDashboardComponent implements OnInit {
  metrics: RevenueMetrics | null = null;
  loading = false;

  // Charts
  revenueChart: Chart | null = null;
  methodChart: Chart | null = null;
  attorneyChart: Chart | null = null;

  // Date Range Form
  dateRangeForm = new FormGroup({
    startDate: new FormControl(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    endDate: new FormControl(new Date())
  });

  constructor(
    private revenueService: RevenueService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    const dateRange = this.getDateRange();

    // Load all data concurrently
    Promise.all([
      this.loadMetrics(dateRange),
      this.loadRevenueOverTime(dateRange),
      this.loadRevenueByMethod(dateRange),
      this.loadRevenueByAttorney(dateRange)
    ]).then(() => {
      this.loading = false;
    }).catch(error => {
      console.error('Error loading dashboard data:', error);
      this.loading = false;
      this.snackBar.open('Error loading dashboard data', 'Close', { duration: 3000 });
    });
  }

  private getDateRange(): DateRange {
    const startDate = this.dateRangeForm.value.startDate;
    const endDate = this.dateRangeForm.value.endDate;
    
    return {
      start_date: startDate ? startDate.toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: endDate ? endDate.toISOString() : new Date().toISOString()
    };
  }

  private async loadMetrics(dateRange: DateRange): Promise<void> {
    try {
      this.metrics = await this.revenueService.getRevenueMetrics(dateRange).toPromise() ?? null;
    } catch (error) {
      console.error('Error loading metrics:', error);
      throw error;
    }
  }

  private async loadRevenueOverTime(dateRange: DateRange): Promise<void> {
    try {
      const data = await this.revenueService.getDailyRevenue(dateRange).toPromise();
      this.createRevenueChart(data || []);
    } catch (error) {
      console.error('Error loading revenue over time:', error);
      throw error;
    }
  }

  private async loadRevenueByMethod(dateRange: DateRange): Promise<void> {
    try {
      const data = await this.revenueService.getRevenueByMethod(dateRange).toPromise();
      this.createMethodChart(data || []);
    } catch (error) {
      console.error('Error loading revenue by method:', error);
      throw error;
    }
  }

  private async loadRevenueByAttorney(dateRange: DateRange): Promise<void> {
    try {
      const data = await this.revenueService.getRevenueByAttorney(dateRange).toPromise();
      this.createAttorneyChart(data || []);
    } catch (error) {
      console.error('Error loading revenue by attorney:', error);
      throw error;
    }
  }

  private createRevenueChart(data: RevenueByDate[]): void {
    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [{
          label: 'Revenue',
          data: data.map(d => d.revenue / 100),
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Revenue: $${(context.parsed.y ?? 0).toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `$${value}`
            }
          }
        }
      }
    };

    this.revenueChart = new Chart(ctx, config);
  }

  private createMethodChart(data: RevenueByMethod[]): void {
    const ctx = document.getElementById('methodChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.methodChart) {
      this.methodChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: data.map(d => d.method),
        datasets: [{
          data: data.map(d => d.revenue / 100),
          backgroundColor: [
            '#2196f3',
            '#4caf50',
            '#ff9800',
            '#f44336',
            '#9c27b0',
            '#00bcd4'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const percentage = data[context.dataIndex].percentage;
                return `${label}: $${value.toFixed(2)} (${percentage.toFixed(1)}%)`;
              }
            }
          }
        }
      }
    };

    this.methodChart = new Chart(ctx, config);
  }

  private createAttorneyChart(data: RevenueByAttorney[]): void {
    const ctx = document.getElementById('attorneyChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.attorneyChart) {
      this.attorneyChart.destroy();
    }

    // Sort by revenue and take top 10
    const sortedData = [...data].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: sortedData.map(d => d.attorney_name),
        datasets: [{
          label: 'Revenue',
          data: sortedData.map(d => d.revenue / 100),
          backgroundColor: '#4caf50',
          borderColor: '#388e3c',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const attorney = sortedData[context.dataIndex];
                return [
                  `Revenue: $${(context.parsed.x ?? 0).toFixed(2)}`,
                  `Transactions: ${attorney.transactions}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `$${value}`
            }
          }
        }
      }
    };

    this.attorneyChart = new Chart(ctx, config);
  }

  onDateRangeChange(): void {
    this.loadDashboardData();
  }

  exportToCsv(): void {
    const dateRange = this.getDateRange();
    this.revenueService.exportToCsv(dateRange).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Report exported successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error exporting report:', error);
        this.snackBar.open('Error exporting report', 'Close', { duration: 3000 });
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  ngOnDestroy(): void {
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }
    if (this.methodChart) {
      this.methodChart.destroy();
    }
    if (this.attorneyChart) {
      this.attorneyChart.destroy();
    }
  }
}
