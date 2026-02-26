/**
 * OCR Service - Optical Character Recognition for ticket upload
 * Location: frontend/src/app/core/services/ocr.service.ts
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface OCRResult {
  success: boolean;
  confidence: number;
  extractedData: {
    ticketNumber?: string;
    violationType?: string;
    violationDate?: string;
    violationTime?: string;
    location?: string;
    state?: string;
    officerName?: string;
    officerBadge?: string;
    fineAmount?: number;
    courtDate?: string;
    courtLocation?: string;
    licensePlate?: string;
    vehicleInfo?: string;
  };
  rawText: string;
  imageUrl?: string;
}

export interface OCRValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class OcrService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  /**
   * Process uploaded ticket image with OCR
   */
  processTicketImage(file: File): Observable<OCRResult> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<OCRResult>(`${this.apiUrl}/ocr/process`, formData);
  }

  /**
   * Process image from camera/base64
   */
  processBase64Image(base64Image: string): Observable<OCRResult> {
    return this.http.post<OCRResult>(`${this.apiUrl}/ocr/process-base64`, {
      image: base64Image
    });
  }

  /**
   * Validate OCR extracted data
   */
  validateOCRData(data: any): OCRValidationError[] {
    const errors: OCRValidationError[] = [];

    // Required fields validation
    if (!data.ticketNumber || data.ticketNumber.trim() === '') {
      errors.push({
        field: 'ticketNumber',
        message: 'Ticket number is required',
        severity: 'error'
      });
    }

    if (!data.violationType || data.violationType.trim() === '') {
      errors.push({
        field: 'violationType',
        message: 'Violation type is required',
        severity: 'error'
      });
    }

    if (!data.violationDate) {
      errors.push({
        field: 'violationDate',
        message: 'Violation date is required',
        severity: 'error'
      });
    } else {
      // Validate date format
      const date = new Date(data.violationDate);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'violationDate',
          message: 'Invalid date format',
          severity: 'error'
        });
      }
    }

    if (!data.state || data.state.trim() === '') {
      errors.push({
        field: 'state',
        message: 'State is required',
        severity: 'error'
      });
    }

    // Warning validations
    if (!data.fineAmount || data.fineAmount <= 0) {
      errors.push({
        field: 'fineAmount',
        message: 'Fine amount should be specified',
        severity: 'warning'
      });
    }

    if (!data.courtDate) {
      errors.push({
        field: 'courtDate',
        message: 'Court date may be missing',
        severity: 'warning'
      });
    }

    return errors;
  }

  /**
   * Re-process image with different settings
   */
  reprocessImage(imageId: string, settings: any): Observable<OCRResult> {
    return this.http.post<OCRResult>(`${this.apiUrl}/ocr/reprocess/${imageId}`, settings);
  }

  /**
   * Get supported violation types for autocomplete
   */
  getViolationTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/violation-types`);
  }

  /**
   * Get US states list
   */
  getStates(): Observable<Array<{ code: string; name: string }>> {
    return this.http.get<Array<{ code: string; name: string }>>(`${this.apiUrl}/states`);
  }

  /**
   * Extract data from multiple images (batch processing)
   */
  processBatchImages(files: File[]): Observable<OCRResult[]> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`image_${index}`, file);
    });

    return this.http.post<OCRResult[]>(`${this.apiUrl}/ocr/batch-process`, formData);
  }

  /**
   * Save OCR result with corrections
   */
  saveOCRResult(ocrResultId: string, correctedData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/ocr/results/${ocrResultId}`, {
      correctedData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get confidence score interpretation
   */
  getConfidenceLevel(confidence: number): {
    level: 'high' | 'medium' | 'low';
    color: string;
    message: string;
  } {
    if (confidence >= 0.9) {
      return {
        level: 'high',
        color: '#4caf50',
        message: 'High confidence - Data appears accurate'
      };
    } else if (confidence >= 0.7) {
      return {
        level: 'medium',
        color: '#ff9800',
        message: 'Medium confidence - Please verify data'
      };
    } else {
      return {
        level: 'low',
        color: '#f44336',
        message: 'Low confidence - Manual entry recommended'
      };
    }
  }

  /**
   * Format extracted data for display
   */
  formatExtractedData(data: any): Array<{ label: string; value: string; confidence?: number }> {
    const formatted: Array<{ label: string; value: string; confidence?: number }> = [];

    const fieldMapping: { [key: string]: string } = {
      ticketNumber: 'Ticket Number',
      violationType: 'Violation Type',
      violationDate: 'Violation Date',
      violationTime: 'Time',
      location: 'Location',
      state: 'State',
      officerName: 'Officer Name',
      officerBadge: 'Badge Number',
      fineAmount: 'Fine Amount',
      courtDate: 'Court Date',
      courtLocation: 'Court Location',
      licensePlate: 'License Plate',
      vehicleInfo: 'Vehicle Info'
    };

    Object.entries(fieldMapping).forEach(([key, label]) => {
      if (data[key]) {
        let value = data[key];
        
        // Format specific fields
        if (key === 'fineAmount' && typeof value === 'number') {
          value = `$${value.toFixed(2)}`;
        } else if ((key === 'violationDate' || key === 'courtDate') && value) {
          value = new Date(value).toLocaleDateString();
        }

        formatted.push({
          label,
          value: value.toString(),
          confidence: data[`${key}Confidence`]
        });
      }
    });

    return formatted;
  }
}
