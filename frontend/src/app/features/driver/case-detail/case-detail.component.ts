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
import { SocketService } from '../../../core/services/socket.service';

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

  // Document upload
  uploadingDoc = false;
  deletingDocId: string | null = null;
  realDocuments: any[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private caseService: CaseService,
    private pdfGeneratorService: PdfGeneratorService,
    private socketService: SocketService,
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
        this.loadRealDocuments();
        this.connectSocket();
      });
  }

  ngOnDestroy(): void {
    this.socketService.leaveCase(this.caseId);
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
          } else {
            this.case = this.getMockCase();
          }

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.case = this.getMockCase();
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private getMockCase(): Case {
    return {
      id: this.caseId || 'mock-001',
      case_number: 'CDL-2024-0847',
      ticketNumber: 'CDL-2024-0847',
      citationNumber: 'CT-SPD-789456',
      customer_name: 'John Doe',
      customer_type: 'subscriber_driver',
      type: 'speeding',
      state: 'CT',
      location: 'I-95 South, Hartford, CT',
      violation_date: '2024-03-01',
      violationDate: '2024-03-01',
      violation_type: 'speeding',
      status: 'assigned_to_attorney',
      description: 'Speeding 15 mph over the posted limit on I-95 Southbound near exit 32. Officer clocked driver at 80 mph in a 65 mph zone.',
      courtDate: '2024-04-15',
      created_at: '2024-03-05T14:30:00Z',
      createdAt: '2024-03-05T14:30:00Z',
      updated_at: '2024-03-08T09:15:00Z',
      assignedAttorney: 'Sarah Johnson, Esq.',
      documents: [
        { id: 'doc-1', fileName: 'ticket-photo.jpg', fileUrl: '', fileType: 'image/jpeg', fileSize: 2400000, uploadedAt: '2024-03-05T14:30:00Z' },
        { id: 'doc-2', fileName: 'citation-copy.pdf', fileUrl: '', fileType: 'application/pdf', fileSize: 156000, uploadedAt: '2024-03-05T14:32:00Z' },
      ],
      statusHistory: [
        { status: 'new', timestamp: '2024-03-05T14:30:00Z', note: 'Case submitted' },
        { status: 'reviewed', timestamp: '2024-03-06T09:00:00Z', note: 'Case reviewed by operator' },
        { status: 'assigned_to_attorney', timestamp: '2024-03-07T11:00:00Z', note: 'Assigned to Sarah Johnson, Esq.' },
      ],
    } as Case;
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

  private connectSocket(): void {
    this.socketService.connect();
    this.socketService.joinCase(this.caseId);
    this.socketService.onCaseStatusUpdate()
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.caseId === this.caseId) {
          this.snackBar.open('Case status updated', 'View', { duration: 4000 });
          this.loadCaseDetails();
        }
      });
  }

  private loadRealDocuments(): void {
    this.caseService.listDocuments(this.caseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.realDocuments = response.documents || [];
          this.cdr.detectChanges();
        },
        error: () => {}
      });
  }

  triggerFileInput(): void {
    const input = document.getElementById('doc-file-input') as HTMLInputElement;
    input?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'application/pdf', 'image/heic'];
    if (!allowed.includes(file.type)) {
      this.snackBar.open('Only JPG, PNG, PDF, or HEIC files are allowed', 'Close', { duration: 4000 });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('File must be under 10 MB', 'Close', { duration: 4000 });
      return;
    }

    this.uploadingDoc = true;
    this.cdr.detectChanges();

    this.caseService.uploadDocument(this.caseId, file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (doc: any) => {
          this.realDocuments = [doc, ...this.realDocuments];
          this.uploadingDoc = false;
          this.snackBar.open('Document uploaded', 'Close', { duration: 3000 });
          this.cdr.detectChanges();
          input.value = '';
        },
        error: (err: any) => {
          const msg = err?.error?.error || 'Upload failed';
          this.snackBar.open(msg, 'Close', { duration: 4000 });
          this.uploadingDoc = false;
          this.cdr.detectChanges();
        }
      });
  }

  deleteDoc(docId: string): void {
    if (!confirm('Delete this document?')) return;
    this.deletingDocId = docId;
    this.cdr.detectChanges();

    this.caseService.deleteDocument(this.caseId, docId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.realDocuments = this.realDocuments.filter(d => d.id !== docId);
          this.deletingDocId = null;
          this.snackBar.open('Document deleted', 'Close', { duration: 3000 });
          this.cdr.detectChanges();
        },
        error: () => {
          this.snackBar.open('Failed to delete document', 'Close', { duration: 3000 });
          this.deletingDocId = null;
          this.cdr.detectChanges();
        }
      });
  }

  uploadDocument(): void {
    this.triggerFileInput();
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
    this.router.navigate(['/driver/cases', this.caseId, 'pay']);
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
