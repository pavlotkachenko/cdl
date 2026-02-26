// ============================================
// FILE SERVICE - Complete Implementation
// Location: frontend/src/app/core/services/file.service.ts
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface FileUpload {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  caseId?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface UploadProgress {
  progress: number;
  file: File;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  // Allowed file types
  private allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  private allowedDocumentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  // Maximum file size (10MB)
  private maxFileSize = 10 * 1024 * 1024;

  constructor(private http: HttpClient) {
    console.log('✅ FileService initialized');
  }

  // ============================================
  // Upload file with progress tracking
  // ============================================
  uploadFile(file: File, caseId?: string): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);
    if (caseId) {
      formData.append('caseId', caseId);
    }

    const req = new HttpRequest('POST', `${this.apiUrl}/files/upload`, formData, {
      reportProgress: true
    });

    return this.http.request(req);
  }

  // ============================================
  // Upload multiple files
  // ============================================
  uploadMultipleFiles(files: File[], caseId?: string): Observable<HttpEvent<any>> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });

    if (caseId) {
      formData.append('caseId', caseId);
    }

    const req = new HttpRequest('POST', `${this.apiUrl}/files/upload-multiple`, formData, {
      reportProgress: true
    });

    return this.http.request(req);
  }

  // ============================================
  // Download file
  // ============================================
  downloadFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/${fileId}/download`, {
      responseType: 'blob'
    });
  }

  // ============================================
  // Delete file
  // ============================================
  deleteFile(fileId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/files/${fileId}`);
  }

  // ============================================
  // Get files for a case
  // ============================================
  getCaseFiles(caseId: string): Observable<{ files: FileUpload[] }> {
    return this.http.get<{ files: FileUpload[] }>(`${this.apiUrl}/files/case/${caseId}`);
  }

  // ============================================
  // Get file metadata
  // ============================================
  getFileMetadata(fileId: string): Observable<FileUpload> {
    return this.http.get<FileUpload>(`${this.apiUrl}/files/${fileId}`);
  }

  // ============================================
  // Validate file
  // ============================================
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum limit of ${this.formatFileSize(this.maxFileSize)}`
      };
    }

    // Check file type
    const isValidType = this.isValidFileType(file.type);
    if (!isValidType) {
      return {
        valid: false,
        error: 'File type not supported. Please upload images or documents only.'
      };
    }

    return { valid: true };
  }

  // ============================================
  // Check if file type is valid
  // ============================================
  isValidFileType(fileType: string): boolean {
    return [...this.allowedImageTypes, ...this.allowedDocumentTypes].includes(fileType);
  }

  // ============================================
  // Check if file is an image
  // ============================================
  isImage(fileType: string): boolean {
    return this.allowedImageTypes.includes(fileType);
  }

  // ============================================
  // Get file icon based on type
  // ============================================
  getFileIcon(fileType: string): string {
    if (this.allowedImageTypes.includes(fileType)) {
      return 'image';
    }

    const iconMap: { [key: string]: string } = {
      'application/pdf': 'picture_as_pdf',
      'application/msword': 'description',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'description',
      'application/vnd.ms-excel': 'table_chart',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'table_chart',
      'text/plain': 'text_snippet'
    };

    return iconMap[fileType] || 'insert_drive_file';
  }

  // ============================================
  // Format file size
  // ============================================
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // ============================================
  // Get file extension
  // ============================================
  getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
  }

  // ============================================
  // Create thumbnail URL (for images)
  // ============================================
  getThumbnailUrl(fileUrl: string): string {
    // If using a storage service with thumbnail generation
    // you can modify the URL here to get thumbnails
    return fileUrl;
  }

  // ============================================
  // Download file with name
  // ============================================
  downloadFileWithName(fileId: string, fileName: string): void {
    this.downloadFile(fileId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('❌ Download error:', error);
      }
    });
  }

  // ============================================
  // Get upload progress percentage
  // ============================================
  getUploadProgress(event: HttpEvent<any>): number {
    if (event.type === HttpEventType.UploadProgress && event.total) {
      return Math.round((100 * event.loaded) / event.total);
    }
    return 0;
  }

  // ============================================
  // Check if upload is complete
  // ============================================
  isUploadComplete(event: HttpEvent<any>): boolean {
    return event.type === HttpEventType.Response;
  }

  // ============================================
  // Get allowed file types string for input accept
  // ============================================
  getAllowedFileTypesString(): string {
    return [...this.allowedImageTypes, ...this.allowedDocumentTypes].join(',');
  }
}
