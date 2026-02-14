// ============================================
// Document Service
// Location: frontend/src/app/core/services/document.service.ts
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Document Models
export interface Document {
  id: string;
  caseId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  category: DocumentCategory;
  uploadedAt: Date;
  uploadedBy: string;
  description?: string;
  tags?: string[];
  version: number;
  isLatestVersion: boolean;
  url: string;
  thumbnailUrl?: string;
  ocrText?: string;
  metadata?: DocumentMetadata;
  status: 'processing' | 'ready' | 'error';
}

export interface DocumentMetadata {
  width?: number;
  height?: number;
  pages?: number;
  extractedText?: string;
  confidence?: number;
}

export type DocumentCategory = 
  | 'citation'
  | 'evidence'
  | 'correspondence'
  | 'legal_document'
  | 'photo'
  | 'receipt'
  | 'license'
  | 'other';

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  documentId?: string;
}

export interface DocumentFilter {
  caseId?: string;
  category?: DocumentCategory;
  searchTerm?: string;
  startDate?: Date;
  endDate?: Date;
  uploadedBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  
  // Upload progress tracking
  private uploadProgressSubject = new BehaviorSubject<Map<string, UploadProgress>>(new Map());
  public uploadProgress$ = this.uploadProgressSubject.asObservable();

  // Allowed file types
  private allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  // Max file size (10MB)
  private maxFileSize = 10 * 1024 * 1024;

  constructor(private http: HttpClient) {}

  // ============================================
  // Document Upload
  // ============================================

  /**
   * Upload single document
   */
  uploadDocument(
    file: File,
    caseId: string,
    category: DocumentCategory,
    description?: string
  ): Observable<Document> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error));
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', caseId);
    formData.append('category', category);
    if (description) {
      formData.append('description', description);
    }

    // Track upload progress
    const uploadKey = `${file.name}-${Date.now()}`;
    this.updateUploadProgress(uploadKey, {
      file,
      progress: 0,
      status: 'uploading'
    });

    const req = new HttpRequest('POST', `${this.apiUrl}/documents/upload`, formData, {
      reportProgress: true
    });

    return this.http.request<Document>(req).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const progress = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
            this.updateUploadProgress(uploadKey, {
              file,
              progress,
              status: 'uploading'
            });
            break;
          case HttpEventType.Response:
            this.updateUploadProgress(uploadKey, {
              file,
              progress: 100,
              status: 'success',
              documentId: event.body.id
            });
            return event.body;
        }
        return null as any;
      }),
      catchError(error => {
        this.updateUploadProgress(uploadKey, {
          file,
          progress: 0,
          status: 'error',
          error: error.message
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Upload multiple documents
   */
  uploadDocuments(
    files: File[],
    caseId: string,
    category: DocumentCategory,
    description?: string
  ): Observable<Document[]> {
    const uploads = files.map(file => 
      this.uploadDocument(file, caseId, category, description)
    );

    // Return array of observables
    return new Observable(observer => {
      const results: Document[] = [];
      let completed = 0;

      uploads.forEach((upload$, index) => {
        upload$.subscribe({
          next: (doc) => {
            if (doc) {
              results[index] = doc;
              completed++;
              if (completed === files.length) {
                observer.next(results.filter(d => d));
                observer.complete();
              }
            }
          },
          error: (err) => {
            console.error(`Upload failed for file ${index}:`, err);
            completed++;
            if (completed === files.length) {
              observer.next(results.filter(d => d));
              observer.complete();
            }
          }
        });
      });
    });
  }

  // ============================================
  // Document Retrieval
  // ============================================

  /**
   * Get documents for a case
   */
  getDocuments(caseId: string, filter?: DocumentFilter): Observable<Document[]> {
    const params: any = { caseId, ...filter };
    return this.http.get<Document[]>(`${this.apiUrl}/documents`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching documents:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get document by ID
   */
  getDocument(documentId: string): Observable<Document> {
    return this.http.get<Document>(`${this.apiUrl}/documents/${documentId}`).pipe(
      catchError(error => {
        console.error('Error fetching document:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get document versions
   */
  getDocumentVersions(documentId: string): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}/documents/${documentId}/versions`).pipe(
      catchError(error => {
        console.error('Error fetching versions:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Document Management
  // ============================================

  /**
   * Update document metadata
   */
  updateDocument(documentId: string, updates: Partial<Document>): Observable<Document> {
    return this.http.patch<Document>(`${this.apiUrl}/documents/${documentId}`, updates).pipe(
      catchError(error => {
        console.error('Error updating document:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete document
   */
  deleteDocument(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/documents/${documentId}`).pipe(
      catchError(error => {
        console.error('Error deleting document:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Download document
   */
  downloadDocument(documentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/documents/${documentId}/download`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error downloading document:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // OCR & Text Extraction
  // ============================================

  /**
   * Extract text from document (OCR)
   */
  extractText(documentId: string): Observable<string> {
    return this.http.post<{ text: string }>(`${this.apiUrl}/documents/${documentId}/ocr`, {}).pipe(
      map(response => response.text),
      catchError(error => {
        console.error('Error extracting text:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Validation
  // ============================================

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: Images, PDF, Word, Text`
      };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File size ${this.formatFileSize(file.size)} exceeds maximum ${this.formatFileSize(this.maxFileSize)}`
      };
    }

    return { valid: true };
  }

  // ============================================
  // Utilities
  // ============================================

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file icon based on type
   */
  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType === 'application/pdf') return 'picture_as_pdf';
    if (fileType.includes('word')) return 'description';
    if (fileType === 'text/plain') return 'article';
    return 'insert_drive_file';
  }

  /**
   * Get category label
   */
  getCategoryLabel(category: DocumentCategory): string {
    const labels: Record<DocumentCategory, string> = {
      citation: 'Citation',
      evidence: 'Evidence',
      correspondence: 'Correspondence',
      legal_document: 'Legal Document',
      photo: 'Photo',
      receipt: 'Receipt',
      license: 'License',
      other: 'Other'
    };
    return labels[category] || category;
  }

  /**
   * Get category icon
   */
  getCategoryIcon(category: DocumentCategory): string {
    const icons: Record<DocumentCategory, string> = {
      citation: 'gavel',
      evidence: 'fact_check',
      correspondence: 'mail',
      legal_document: 'description',
      photo: 'photo_camera',
      receipt: 'receipt',
      license: 'badge',
      other: 'folder'
    };
    return icons[category] || 'folder';
  }

  private updateUploadProgress(key: string, progress: UploadProgress): void {
    const current = this.uploadProgressSubject.value;
    current.set(key, progress);
    this.uploadProgressSubject.next(new Map(current));
  }

  // ============================================
  // Mock Methods (for development)
  // ============================================

  /**
   * Mock upload for development
   */
  mockUploadDocument(
    file: File,
    caseId: string,
    category: DocumentCategory,
    description?: string
  ): Observable<Document> {
    return new Observable(observer => {
      // Simulate upload progress
      const uploadKey = `${file.name}-${Date.now()}`;
      let progress = 0;

      const interval = setInterval(() => {
        progress += 10;
        this.updateUploadProgress(uploadKey, {
          file,
          progress: Math.min(progress, 100),
          status: progress < 100 ? 'uploading' : 'success'
        });

        if (progress >= 100) {
          clearInterval(interval);
          
          const mockDoc: Document = {
            id: 'doc-' + Date.now(),
            caseId,
            fileName: file.name,
            originalName: file.name,
            fileSize: file.size,
            fileType: file.type,
            category,
            uploadedAt: new Date(),
            uploadedBy: 'current-user',
            description,
            version: 1,
            isLatestVersion: true,
            url: URL.createObjectURL(file),
            status: 'ready'
          };

          observer.next(mockDoc);
          observer.complete();
        }
      }, 200);
    });
  }

  /**
   * Mock get documents
   */
  mockGetDocuments(caseId: string): Observable<Document[]> {
    return of([
      {
        id: 'doc-1',
        caseId,
        fileName: 'speeding_ticket.pdf',
        originalName: 'speeding_ticket.pdf',
        fileSize: 245678,
        fileType: 'application/pdf',
        category: 'citation',
        uploadedAt: new Date('2024-01-15'),
        uploadedBy: 'John Doe',
        description: 'Original speeding citation',
        version: 1,
        isLatestVersion: true,
        url: '/assets/mock/doc1.pdf',
        status: 'ready'
      },
      {
        id: 'doc-2',
        caseId,
        fileName: 'speed_limit_sign.jpg',
        originalName: 'speed_limit_sign.jpg',
        fileSize: 1234567,
        fileType: 'image/jpeg',
        category: 'evidence',
        uploadedAt: new Date('2024-01-16'),
        uploadedBy: 'John Doe',
        description: 'Photo of speed limit sign',
        version: 1,
        isLatestVersion: true,
        url: '/assets/mock/photo1.jpg',
        thumbnailUrl: '/assets/mock/photo1-thumb.jpg',
        status: 'ready'
      }
    ]);
  }
}
