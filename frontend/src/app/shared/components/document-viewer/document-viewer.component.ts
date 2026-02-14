// ============================================
// Document Viewer Component - PDF & Image Viewer
// Location: frontend/src/app/shared/components/document-viewer/document-viewer.component.ts
// ============================================

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Document {
  id?: string;
  fileName: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  uploadedAt?: Date | string;
}

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  templateUrl: './document-viewer.component.html',
  styleUrls: ['./document-viewer.component.scss'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ]
})
export class DocumentViewerComponent implements OnInit {
  @Input() document!: Document;
  @Input() showToolbar: boolean = true;
  @Output() close = new EventEmitter<void>();
  @Output() download = new EventEmitter<Document>();

  safeUrl: SafeResourceUrl | null = null;
  loading = true;
  error = false;
  currentPage = 1;
  totalPages = 1;
  zoomLevel = 100;
  rotation = 0;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadDocument();
  }

  private loadDocument(): void {
    if (!this.document || !this.document.fileUrl) {
      this.error = true;
      this.loading = false;
      return;
    }

    // Sanitize URL for iframe
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.document.fileUrl);
    this.loading = false;
  }

  get isPdf(): boolean {
    return this.getFileType() === 'pdf';
  }

  get isImage(): boolean {
    const type = this.getFileType();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type);
  }

  get isSupported(): boolean {
    return this.isPdf || this.isImage;
  }

  private getFileType(): string {
    if (this.document.fileType) {
      return this.document.fileType.toLowerCase();
    }
    
    const extension = this.document.fileName.split('.').pop()?.toLowerCase() || '';
    return extension;
  }

  onClose(): void {
    this.close.emit();
  }

  onDownload(): void {
    this.download.emit(this.document);
  }

  zoomIn(): void {
    if (this.zoomLevel < 200) {
      this.zoomLevel += 10;
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 50) {
      this.zoomLevel -= 10;
    }
  }

  resetZoom(): void {
    this.zoomLevel = 100;
  }

  rotate(): void {
    this.rotation = (this.rotation + 90) % 360;
  }

  print(): void {
    if (this.isPdf && this.document.fileUrl) {
      // Open in new window for printing
      window.open(this.document.fileUrl, '_blank');
    } else if (this.isImage) {
      // Print image
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Print ${this.document.fileName}</title></head>
            <body onload="window.print(); window.close();">
              <img src="${this.document.fileUrl}" style="max-width: 100%;" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  }

  getFileIcon(): string {
    if (this.isPdf) return 'picture_as_pdf';
    if (this.isImage) return 'image';
    return 'insert_drive_file';
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
