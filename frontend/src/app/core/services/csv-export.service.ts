// ============================================
// CSV Export Service
// Location: frontend/src/app/core/services/csv-export.service.ts
// ============================================

import { Injectable } from '@angular/core';

interface ExportColumn {
  key: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class CsvExportService {

  /**
   * Export data to CSV file
   */
  exportToCsv<T>(
    data: T[],
    filename: string,
    columns?: ExportColumn[]
  ): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Determine columns
    const cols = columns || this.getColumnsFromData(data[0]);
    
    // Generate CSV content
    const csvContent = this.generateCsvContent(data, cols);
    
    // Download file
    this.downloadCsv(csvContent, filename);
  }

  /**
   * Auto-detect columns from data
   */
  private getColumnsFromData(item: any): ExportColumn[] {
    return Object.keys(item).map(key => ({
      key,
      label: this.formatColumnLabel(key)
    }));
  }

  /**
   * Format column label (camelCase -> Title Case)
   */
  private formatColumnLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Generate CSV content
   */
  private generateCsvContent<T>(
    data: T[],
    columns: ExportColumn[]
  ): string {
    // CSV Header
    const header = columns.map(col => this.escapeCsvValue(col.label)).join(',');
    
    // CSV Rows
    const rows = data.map(item => {
      return columns.map(col => {
        const value = (item as any)[col.key];
        return this.escapeCsvValue(this.formatValue(value));
      }).join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Format value for CSV
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return value.toLocaleDateString('en-US');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Escape CSV value (handle commas, quotes, newlines)
   */
  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Download CSV file
   */
  private downloadCsv(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Export cases to CSV with custom columns
   */
  exportCasesToCsv(cases: any[], filename: string = 'tickets-export.csv'): void {
    const columns: ExportColumn[] = [
      { key: 'ticketNumber', label: 'Ticket #' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'citationNumber', label: 'Citation #' },
      { key: 'violationDate', label: 'Violation Date' },
      { key: 'location', label: 'Location' },
      { key: 'state', label: 'State' },
      { key: 'description', label: 'Description' },
      { key: 'createdAt', label: 'Submitted Date' }
    ];

    // Map data to include computed fields
    const exportData = cases.map(c => ({
      ticketNumber: c.ticketNumber || c.id?.substring(0, 8).toUpperCase() || '',
      type: c.type || c.violation_type || '',
      status: c.status || '',
      citationNumber: c.citationNumber || '',
      violationDate: c.violationDate || '',
      location: c.location || '',
      state: c.state || '',
      description: c.description || '',
      createdAt: c.createdAt || c.created_at || ''
    }));

    this.exportToCsv(exportData, filename, columns);
  }
}
