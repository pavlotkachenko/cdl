// ============================================
// Enhanced Case Detail Component - WITH PDF EXPORT & DOCUMENT VIEWER
// Location: frontend/src/app/features/driver/case-detail/case-detail.component.ts
// ============================================

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services
import { CaseService, Case } from '../../../core/services/case.service';
import { PdfGeneratorService } from '../../../core/services/pdf-generator.service';

// Shared Components
import { DocumentViewerComponent } from '../../../shared/components/document-viewer/document-viewer.component';
import { ImageLightboxComponent } from '../../../shared/components/image-lightbox/image-lightbox.component';

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: Date;
  isStaff: boolean;
}

@Component({
  selector: 'app-case-detail',
  standalone: true,
  templateUrl: './case-detail.component.html',
  styleUrls: ['./case-detail.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTabsModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    DocumentViewerComponent,
    ImageLightboxComponent
  ]
})
export class CaseDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  caseId: string = '';
  case: Case | null = null;
  loading = true;
  error = '';
  
  // Comments
  comments: Comment[] = [];
  commentForm!: FormGroup;
  addingComment = false;
  
  // Document Viewer
  selectedDocument: any = null;
  isDocumentViewerOpen = false;
  
  // Image Lightbox
  lightboxImages: any[] = [];
  currentLightboxIndex = 0;
  isLightboxOpen = false;
  
  // Edit mode
  isEditing = false;
  
  // PDF Export
  exportingPdf = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private caseService: CaseService,
    private pdfGeneratorService: PdfGeneratorService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeCommentForm();
    this.loadMockComments();
    
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.caseId = params['id'];
        this.loadCaseDetails();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeCommentForm(): void {
    this.commentForm = this.fb.group({
      comment: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  private loadMockComments(): void {
    this.comments = [
      {
        id: 'c1',
        author: 'Sarah Johnson (Attorney)',
        text: 'I\'ve reviewed your case and we have a strong defense. The citation location shows the speed limit sign was obstructed.',
        timestamp: new Date('2026-02-06T10:30:00'),
        isStaff: true
      },
      {
        id: 'c2',
        author: 'You',
        text: 'Thank you for the update! When should I expect the next steps?',
        timestamp: new Date('2026-02-06T14:15:00'),
        isStaff: false
      },
      {
        id: 'c3',
        author: 'Sarah Johnson (Attorney)',
        text: 'We\'ll file the motion to dismiss by end of week. I\'ll keep you posted on the court\'s response.',
        timestamp: new Date('2026-02-07T09:00:00'),
        isStaff: true
      }
    ];
  }

  private loadCaseDetails(): void {
    this.loading = true;
    
    this.caseService.getCaseById(this.caseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.case = response.data || response;
          
          if (this.case) {
            this.case.documents = this.case.documents || [];
            this.case.statusHistory = this.case.statusHistory || [];
          }
          
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to load case details';
          this.loading = false;
          console.error('Error loading case:', err);
        }
      });
  }

  // PDF Export
  exportToPDF(): void {
    if (!this.case) return;
    
    this.exportingPdf = true;
    this.snackBar.open('Generating PDF...', '', { duration: 2000 });

    setTimeout(() => {
      const caseData = {
        ticketNumber: this.case!.ticketNumber || this.case!.id.substring(0, 8).toUpperCase(),
        type: this.case!.type || this.case!.violation_type || 'Case',
        status: this.case!.status,
        citationNumber: this.case!.citationNumber,
        violationDate: this.case!.violationDate,
        location: this.case!.location,
        state: this.case!.state,
        description: this.case!.description,
        createdAt: this.case!.createdAt || this.case!.created_at,
        courtDate: this.case!.courtDate,
        assignedAttorney: this.case!.assignedAttorney,
        documents: this.case!.documents,
        statusHistory: this.case!.statusHistory,
        comments: this.comments,
        resolution: this.case!.resolution
      };

      this.pdfGeneratorService.generateCasePdf(caseData);
      
      this.exportingPdf = false;
      this.snackBar.open('PDF generated successfully!', 'Close', {
        duration: 3000
      });
    }, 500);
  }

  // Document Viewing
  viewDocument(doc: any): void {
    this.selectedDocument = doc;
    
    // Check if it's an image - open lightbox instead
    if (this.isImage(doc.fileName)) {
      this.openLightboxForDocument(doc);
    } else {
      this.isDocumentViewerOpen = true;
    }
  }

  closeDocumentViewer(): void {
    this.isDocumentViewerOpen = false;
    this.selectedDocument = null;
  }

  downloadDocument(doc: any): void {
    // Real download implementation
    if (doc.fileUrl) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.fileName;
      link.click();
      
      this.snackBar.open(`Downloading ${doc.fileName}...`, 'Close', {
        duration: 3000
      });
    }
  }

  // Image Lightbox
  openLightboxForDocument(doc: any): void {
    const imageIndex = this.case!.documents!
      .filter(d => this.isImage(d.fileName))
      .findIndex(d => d.id === doc.id);
    
    this.openLightbox(imageIndex >= 0 ? imageIndex : 0);
  }

  openLightbox(imageIndex: number): void {
    this.lightboxImages = this.case!.documents!
      .filter(d => this.isImage(d.fileName))
      .map(d => ({
        url: d.fileUrl || '',
        title: d.fileName,
        description: `Uploaded: ${this.formatDate(d.uploadedAt)}`
      }));
    
    this.currentLightboxIndex = imageIndex;
    this.isLightboxOpen = true;
  }

  closeLightbox(): void {
    this.isLightboxOpen = false;
  }

  downloadLightboxImage(image: any): void {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.title;
    link.click();
  }

  private isImage(fileName: string): boolean {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  }

  uploadDocument(): void {
    this.snackBar.open('Upload feature coming soon', 'Close', {
      duration: 3000
    });
  }

  // Comments
  addComment(): void {
    if (this.commentForm.invalid) return;

    this.addingComment = true;

    const newComment: Comment = {
      id: `c${Date.now()}`,
      author: 'You',
      text: this.commentForm.value.comment,
      timestamp: new Date(),
      isStaff: false
    };

    setTimeout(() => {
      this.comments.push(newComment);
      this.commentForm.reset();
      this.addingComment = false;
      this.snackBar.open('Comment added successfully', 'Close', {
        duration: 3000
      });
    }, 500);
  }

  // Edit Methods
  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.loadCaseDetails();
    }
  }

  saveChanges(): void {
    this.snackBar.open('Saving changes...', 'Close', {
      duration: 2000
    });

    setTimeout(() => {
      this.isEditing = false;
      this.snackBar.open('Changes saved successfully', 'Close', {
        duration: 3000
      });
    }, 1000);
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/driver/tickets']);
  }

  // Status Methods
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'new': 'Submitted',
      'reviewed': 'Under Review',
      'assigned_to_attorney': 'Attorney Assigned',
      'waiting_for_driver': 'Response Needed',
      'send_info_to_attorney': 'With Your Attorney',
      'attorney_paid': 'Attorney Confirmed',
      'call_court': 'Court Proceedings',
      'check_with_manager': 'Reviewing Options',
      'pay_attorney': 'Payment Due',
      'closed': 'Case Closed'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'new': 'status-new',
      'reviewed': 'status-progress',
      'assigned_to_attorney': 'status-progress',
      'waiting_for_driver': 'status-warning',
      'send_info_to_attorney': 'status-progress',
      'attorney_paid': 'status-progress',
      'call_court': 'status-warning',
      'check_with_manager': 'status-warning',
      'pay_attorney': 'status-warning',
      'closed': 'status-success'
    };
    return classes[status] || 'status-default';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'new': 'fiber_new',
      'reviewed': 'visibility',
      'assigned_to_attorney': 'person_add',
      'waiting_for_driver': 'schedule',
      'send_info_to_attorney': 'gavel',
      'attorney_paid': 'payment',
      'call_court': 'gavel',
      'check_with_manager': 'supervisor_account',
      'pay_attorney': 'payment',
      'closed': 'done_all'
    };
    return icons[status] || 'info';
  }

  payAttorneyFee(): void {
    this.router.navigate(['/driver/cases', this.caseId, 'payment']);
  }

  // Helper Methods
  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getDaysUntilCourt(): number | null {
    if (!this.case?.courtDate) return null;
    const today = new Date();
    const court = new Date(this.case.courtDate);
    const diffTime = court.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'picture_as_pdf';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return 'image';
    if (['doc', 'docx'].includes(ext || '')) return 'description';
    return 'insert_drive_file';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
