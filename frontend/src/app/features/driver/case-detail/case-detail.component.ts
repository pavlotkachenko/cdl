// ============================================
// Case Detail Component - Sprint 065 CD-4/5/6/7
// Angular 21 signals, inject(), OnPush, no Material modules
// Location: frontend/src/app/features/driver/case-detail/case-detail.component.ts
// ============================================

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  NonNullableFormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Services
import { CaseService, Case } from '../../../core/services/case.service';
import { PdfGeneratorService } from '../../../core/services/pdf-generator.service';
import { SocketService } from '../../../core/services/socket.service';

// Shared Components
import { DocumentViewerComponent } from '../../../shared/components/document-viewer/document-viewer.component';
import { ImageLightboxComponent } from '../../../shared/components/image-lightbox/image-lightbox.component';
import { PenaltyImpactCardComponent } from '../../../shared/components/penalty-impact-card/penalty-impact-card.component';
import { CsaImpactCardComponent } from '../../../shared/components/csa-impact-card/csa-impact-card.component';
import { DisqualificationTimelineComponent } from '../../../shared/components/disqualification-timeline/disqualification-timeline.component';

// Violation Type Registry
import {
  VIOLATION_TYPE_REGISTRY,
  resolveSelectLabel,
  type ConditionalField,
  type ViolationTypeConfig,
} from '../../../core/constants/violation-type-registry';

// ── Status emoji mapping (replaces mat-icon names) ──────────────
const STATUS_EMOJIS: Record<string, string> = {
  'new': '\u{1F195}',
  'reviewed': '\uD83D\uDC41\uFE0F',
  'assigned_to_attorney': '\uD83D\uDC64',
  'waiting_for_driver': '\u231B',
  'send_info_to_attorney': '\u2696\uFE0F',
  'attorney_paid': '\u2705',
  'call_court': '\uD83C\uDFDB\uFE0F',
  'check_with_manager': '\uD83D\uDCCB',
  'pay_attorney': '\uD83D\uDCB3',
  'closed': '\u2705',
};

@Component({
  selector: 'app-case-detail',
  templateUrl: './case-detail.component.html',
  styleUrls: ['./case-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    DatePipe,
    UpperCasePipe,
    DocumentViewerComponent,
    ImageLightboxComponent,
    PenaltyImpactCardComponent,
    CsaImpactCardComponent,
    DisqualificationTimelineComponent,
  ],
})
export class CaseDetailComponent implements OnInit, OnDestroy {
  // ── Injected dependencies ───────────────────────────────────────
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private caseService = inject(CaseService);
  private pdfGeneratorService = inject(PdfGeneratorService);
  private socketService = inject(SocketService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(NonNullableFormBuilder);

  // ── State signals ───────────────────────────────────────────────
  caseData = signal<Case | null>(null);
  loading = signal(true);
  error = signal('');
  realDocuments = signal<any[]>([]);
  uploadingDoc = signal(false);
  deletingDocId = signal<string | null>(null);
  exportingPdf = signal(false);
  toastMessage = signal('');
  toastVisible = signal(false);
  selectedDocument = signal<any>(null);
  isDocumentViewerOpen = signal(false);
  lightboxImages = signal<any[]>([]);
  currentLightboxIndex = signal(0);
  isLightboxOpen = signal(false);

  // ── CD-5: Messaging signals ─────────────────────────────────────
  messages = signal<any[]>([]);
  sendingMessage = signal(false);
  messageError = signal('');

  // ── CD-5: Activity log signals ──────────────────────────────────
  activityLog = signal<any[]>([]);
  activityExpanded = signal(false);

  // ── CD-6: Edit mode signals ─────────────────────────────────────
  isEditing = signal(false);
  saving = signal(false);

  // ── CD-7: Share case signal ─────────────────────────────────────
  shareCopyFeedback = signal(false);

  // ── Computed signals ────────────────────────────────────────────
  caseNumber = computed(() => {
    const c = this.caseData();
    return c?.case_number || c?.ticketNumber || '';
  });

  violationType = computed(() => {
    const c = this.caseData();
    return c?.violation_type || c?.type || '';
  });

  statusInfo = computed<{ label: string; cssClass: string; emoji: string }>(() => {
    const status = this.caseData()?.status || '';
    return {
      label: this.getStatusLabel(status),
      cssClass: this.getStatusClass(status),
      emoji: STATUS_EMOJIS[status] || '\u2139\uFE0F',
    };
  });

  // ── VD-2: Severity Banner ─────────────────────────────────────
  severityInfo = computed<{ level: string; label: string; icon: string; cssClass: string } | null>(() => {
    const type = this.violationType();
    if (!type) return null;
    const severity = this.caseData()?.violation_severity
      || VIOLATION_TYPE_REGISTRY[type]?.severity
      || 'standard';
    const map: Record<string, { label: string; icon: string; cssClass: string }> = {
      critical: { label: 'Critical Violation \u2014 CDL at risk', icon: '\u26D4', cssClass: 'severity-critical' },
      serious:  { label: 'Serious Violation \u2014 May affect CDL status', icon: '\u26A0\uFE0F', cssClass: 'severity-serious' },
      standard: { label: 'Standard Violation', icon: '\u2139\uFE0F', cssClass: 'severity-standard' },
      minor:    { label: 'Minor Violation', icon: '\u2713', cssClass: 'severity-minor' },
    };
    const info = map[severity] || map['standard'];
    return { level: severity, ...info };
  });

  // ── VD-2: Regulation Badge ────────────────────────────────────
  regulationRef = computed<string>(() => {
    const c = this.caseData();
    const type = this.violationType();
    return c?.violation_regulation_code
      || VIOLATION_TYPE_REGISTRY[type]?.regulationRef
      || '';
  });

  regulationUrl = computed<string>(() => {
    const ref = this.regulationRef();
    if (!ref) return '';
    const match = ref.match(/(\d+)/);
    if (!match) return '';
    return `https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-${match[1]}`;
  });

  attorney = computed(() => {
    const c = this.caseData();
    return c?.attorney || null;
  });

  attorneyName = computed(() => {
    const att = this.attorney();
    if (att?.full_name) return att.full_name;
    return this.caseData()?.assignedAttorney || '';
  });

  attorneyInitials = computed(() => {
    const name = this.attorneyName();
    if (!name) return '';
    return name
      .split(/\s+/)
      .map((word: string) => word.charAt(0))
      .join('')
      .toUpperCase();
  });

  statusHistory = computed(() => {
    const c = this.caseData();
    return c?.statusHistory || [];
  });

  daysUntilCourt = computed<number | null>(() => {
    const c = this.caseData();
    const courtDate = c?.courtDate || c?.court_date;
    if (!courtDate) return null;
    const today = new Date();
    const court = new Date(courtDate as string);
    const diffTime = court.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  daysOpen = computed<number>(() => {
    const c = this.caseData();
    const created = c?.created_at || c?.createdAt;
    if (!created) return 0;
    const start = new Date(created as string);
    const today = new Date();
    const diffTime = today.getTime() - start.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  });

  documentCount = computed(() => this.realDocuments().length);

  showPayAttorney = computed(() => {
    const c = this.caseData();
    return c?.status === 'pay_attorney';
  });

  showCourtAlert = computed(() => {
    const courtDate = this.caseData()?.courtDate || this.caseData()?.court_date;
    const days = this.daysUntilCourt();
    return !!courtDate && days !== null && days > 0;
  });

  // ── VD-1: Violation Detail Card ───────────────────────────────
  violationTypeConfig = computed<ViolationTypeConfig | null>(() => {
    const type = this.violationType();
    return type ? (VIOLATION_TYPE_REGISTRY[type] ?? null) : null;
  });

  /** Visible violation detail fields: registry fields with values in type_specific_data */
  violationDetailFields = computed<{ field: ConditionalField; value: unknown }[]>(() => {
    const config = this.violationTypeConfig();
    const tsd = this.caseData()?.type_specific_data as Record<string, unknown> | undefined;
    if (!config || !tsd) return [];
    return config.conditionalFields
      .map(field => ({ field, value: tsd[field.key] }))
      .filter(item => item.value !== undefined && item.value !== null && item.value !== '');
  });

  showViolationDetailCard = computed(() => {
    return this.violationDetailFields().length > 0
      || !!this.caseData()?.violation_regulation_code;
  });

  /** Speeding: mph over the limit */
  speedingMphOver = computed<number | null>(() => {
    const tsd = this.caseData()?.type_specific_data as Record<string, unknown> | undefined;
    if (this.violationType() !== 'speeding' || !tsd) return null;
    const alleged = Number(tsd['alleged_speed']);
    const posted = Number(tsd['posted_speed_limit']);
    if (isNaN(alleged) || isNaN(posted)) return null;
    return alleged - posted;
  });

  /** Overweight: pounds over permitted */
  overweightPoundsOver = computed<number | null>(() => {
    const tsd = this.caseData()?.type_specific_data as Record<string, unknown> | undefined;
    if (this.violationType() !== 'overweight_oversize' || !tsd) return null;
    const actual = Number(tsd['actual_weight']);
    const permitted = Number(tsd['permitted_weight']);
    if (isNaN(actual) || isNaN(permitted)) return null;
    return actual - permitted;
  });

  // ── CD-5: Message form ──────────────────────────────────────────
  messageForm = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(10)]],
  });

  // ── CD-6: Edit form ─────────────────────────────────────────────
  editForm = this.fb.group({
    description: [''],
    location: [''],
  });

  // ── Private state ──────────────────────────────────────────────
  private caseId = '';
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;
  private shareFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.caseId = params['caseId'];
        this.loadCaseDetails();
        this.loadRealDocuments();
        this.loadMessages();
        this.loadActivity();
        this.connectSocket();
      });
  }

  ngOnDestroy(): void {
    this.socketService.leaveCase(this.caseId);
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    if (this.shareFeedbackTimeout) {
      clearTimeout(this.shareFeedbackTimeout);
    }
  }

  // ── Data loading ───────────────────────────────────────────────
  loadCaseDetails(): void {
    this.loading.set(true);
    this.error.set('');

    this.caseService
      .getCaseById(this.caseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const caseObj: Case | null = response.data || response;

          if (caseObj) {
            caseObj.documents = caseObj.documents || [];
            caseObj.statusHistory = caseObj.statusHistory || [];
          }

          this.caseData.set(caseObj);
          this.loading.set(false);
        },
        error: (err: any) => {
          const msg =
            err?.error?.error?.message ||
            err?.error?.message ||
            err?.message ||
            'Failed to load case details';
          this.error.set(msg);
          this.loading.set(false);
        },
      });
  }

  private loadRealDocuments(): void {
    this.caseService
      .listDocuments(this.caseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.realDocuments.set(response.documents || []);
        },
        error: () => {
          // Silently fail — documents section simply stays empty
        },
      });
  }

  // ── CD-5: Load messages ─────────────────────────────────────────
  private loadMessages(): void {
    this.caseService
      .getCaseMessagesForDriver(this.caseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const msgs = response?.data?.messages || response?.messages || response?.data || [];
          this.messages.set(Array.isArray(msgs) ? msgs : []);
        },
        error: () => {
          // Silently fail — messaging section simply stays empty
        },
      });
  }

  // ── CD-5: Send message ──────────────────────────────────────────
  sendMessage(): void {
    if (this.messageForm.invalid) return;
    const content = this.messageForm.value.content!;

    this.sendingMessage.set(true);
    this.messageError.set('');

    this.caseService
      .sendCaseMessageForDriver(this.caseId, content)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const newMsg = response?.data || response;
          this.messages.update(msgs => [...msgs, newMsg]);
          this.messageForm.reset();
          this.sendingMessage.set(false);
        },
        error: (err: any) => {
          const msg = err?.error?.error?.message || err?.error?.message || 'Failed to send message';
          this.messageError.set(msg);
          this.sendingMessage.set(false);
        },
      });
  }

  // ── CD-5: Load activity log ─────────────────────────────────────
  private loadActivity(): void {
    this.caseService
      .getCaseActivity(this.caseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const activities = response?.activities || response?.data || [];
          this.activityLog.set(Array.isArray(activities) ? activities : []);
        },
        error: () => {
          // Silently fail
        },
      });
  }

  toggleActivity(): void {
    this.activityExpanded.update(v => !v);
  }

  private connectSocket(): void {
    this.socketService.connect();
    this.socketService.joinCase(this.caseId);
    this.socketService
      .onCaseStatusUpdate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event.caseId === this.caseId) {
          this.showToast('Case status updated');
          this.loadCaseDetails();
        }
      });
  }

  // ── CD-6: Edit mode ─────────────────────────────────────────────
  toggleEdit(): void {
    if (this.isEditing()) {
      this.cancelEdit();
    } else {
      const c = this.caseData();
      this.editForm.patchValue({
        description: c?.description || '',
        location: c?.location || '',
      });
      this.isEditing.set(true);
    }
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editForm.reset();
  }

  saveEdit(): void {
    if (this.saving()) return;
    const c = this.caseData();
    if (!c) return;

    const updates: Record<string, string> = {};
    const desc = this.editForm.value.description ?? '';
    const loc = this.editForm.value.location ?? '';

    if (desc !== (c.description || '')) updates['description'] = desc;
    if (loc !== (c.location || '')) updates['location'] = loc;

    if (Object.keys(updates).length === 0) {
      this.cancelEdit();
      return;
    }

    this.saving.set(true);

    this.caseService
      .updateCase(this.caseId, updates)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const updated = response?.data || response?.case || response;
          if (updated) {
            this.caseData.update(current => current ? { ...current, ...updates } : current);
          }
          this.saving.set(false);
          this.isEditing.set(false);
          this.showToast('Changes saved');
        },
        error: (err: any) => {
          const msg = err?.error?.error?.message || err?.error?.message || 'Failed to save changes';
          this.showToast(msg);
          this.saving.set(false);
        },
      });
  }

  // ── CD-7: Share case ────────────────────────────────────────────
  async shareCase(): Promise<void> {
    const c = this.caseData();
    if (!c) return;

    const caseNum = this.caseNumber();
    const statusLabel = this.statusInfo().label;
    const violation = this.violationType();
    const location = c.location || '';
    const courtDate = c.courtDate || c.court_date;
    const attName = this.attorneyName();

    let summary = `Case #${caseNum}\nStatus: ${statusLabel}`;
    if (violation || location) {
      summary += `\nViolation: ${violation}`;
      if (location) summary += ` \u2014 ${location}`;
    }
    if (courtDate) {
      summary += `\nCourt Date: ${this.formatDate(courtDate)}`;
    }
    if (attName) {
      summary += `\nAttorney: ${attName}`;
    }
    summary += `\n\nView at: ${window.location.origin}/driver/cases/${this.caseId}`;

    try {
      await navigator.clipboard.writeText(summary);
      this.shareCopyFeedback.set(true);
      if (this.shareFeedbackTimeout) clearTimeout(this.shareFeedbackTimeout);
      this.shareFeedbackTimeout = setTimeout(() => {
        this.shareCopyFeedback.set(false);
        this.shareFeedbackTimeout = null;
      }, 2000);
    } catch {
      this.showToast('Copy not supported in this browser');
    }
  }

  // ── PDF Export ─────────────────────────────────────────────────
  exportToPDF(): void {
    const c = this.caseData();
    if (!c) return;

    this.exportingPdf.set(true);
    this.showToast('Generating PDF...');

    setTimeout(() => {
      const pdfData = {
        ticketNumber: c.ticketNumber || c.id.substring(0, 8).toUpperCase(),
        type: c.type || c.violation_type || 'Case',
        status: c.status,
        citationNumber: c.citationNumber,
        violationDate: c.violationDate,
        location: c.location,
        state: c.state,
        description: c.description,
        createdAt: c.createdAt || c.created_at,
        courtDate: c.courtDate,
        assignedAttorney: c.assignedAttorney,
        documents: c.documents,
        statusHistory: c.statusHistory,
        resolution: c.resolution,
      };

      this.pdfGeneratorService.generateCasePdf(pdfData);

      this.exportingPdf.set(false);
      this.showToast('PDF generated successfully!');
    }, 500);
  }

  // ── Document Viewing ───────────────────────────────────────────
  viewDocument(doc: any): void {
    this.selectedDocument.set(doc);

    if (this.isImage(doc.fileName)) {
      this.openLightboxForDocument(doc);
    } else {
      this.isDocumentViewerOpen.set(true);
    }
  }

  closeDocumentViewer(): void {
    this.isDocumentViewerOpen.set(false);
    this.selectedDocument.set(null);
  }

  downloadDocument(doc: any): void {
    if (doc.fileUrl) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.fileName;
      link.click();

      this.showToast(`Downloading ${doc.fileName}...`);
    }
  }

  // ── Image Lightbox ─────────────────────────────────────────────
  private openLightboxForDocument(doc: any): void {
    const c = this.caseData();
    const allDocs = c?.documents || [];
    const imageIndex = allDocs
      .filter(d => this.isImage(d.fileName))
      .findIndex(d => d.id === doc.id);

    this.openLightbox(imageIndex >= 0 ? imageIndex : 0);
  }

  openLightbox(imageIndex: number): void {
    const c = this.caseData();
    const allDocs = c?.documents || [];

    this.lightboxImages.set(
      allDocs
        .filter(d => this.isImage(d.fileName))
        .map(d => ({
          url: d.fileUrl || '',
          title: d.fileName,
          description: `Uploaded: ${this.formatDate(d.uploadedAt)}`,
        })),
    );

    this.currentLightboxIndex.set(imageIndex);
    this.isLightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.isLightboxOpen.set(false);
  }

  downloadLightboxImage(image: any): void {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.title;
    link.click();
  }

  // ── File Upload ────────────────────────────────────────────────
  uploadDocument(): void {
    this.triggerFileInput();
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
      this.showToast('Only JPG, PNG, PDF, or HEIC files are allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.showToast('File must be under 10 MB');
      return;
    }

    this.uploadingDoc.set(true);

    this.caseService
      .uploadDocument(this.caseId, file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doc: any) => {
          this.realDocuments.update(docs => [doc, ...docs]);
          this.uploadingDoc.set(false);
          this.showToast('Document uploaded');
          input.value = '';
        },
        error: (err: any) => {
          const msg = err?.error?.error || 'Upload failed';
          this.showToast(msg);
          this.uploadingDoc.set(false);
        },
      });
  }

  // ── Document Deletion ──────────────────────────────────────────
  deleteDoc(docId: string): void {
    if (!confirm('Delete this document?')) return;

    this.deletingDocId.set(docId);

    this.caseService
      .deleteDocument(this.caseId, docId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.realDocuments.update(docs => docs.filter(d => d.id !== docId));
          this.deletingDocId.set(null);
          this.showToast('Document deleted');
        },
        error: () => {
          this.showToast('Failed to delete document');
          this.deletingDocId.set(null);
        },
      });
  }

  // ── Navigation ─────────────────────────────────────────────────
  goBack(): void {
    this.router.navigate(['/driver/tickets']);
  }

  payAttorneyFee(): void {
    this.router.navigate(['/driver/cases', this.caseId, 'pay']);
  }

  // ── Status helpers ─────────────────────────────────────────────
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
      'closed': 'Case Closed',
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
      'closed': 'status-success',
    };
    return classes[status] || 'status-default';
  }

  // ── File emoji mapping (replaces mat-icon file type icons) ─────
  getFileEmoji(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '\uD83D\uDCC4';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return '\uD83D\uDDBC\uFE0F';
    if (['doc', 'docx'].includes(ext || '')) return '\uD83D\uDCDD';
    return '\uD83D\uDCC1';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(/\s+/).map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  // ── Toast (replaces MatSnackBar) ───────────────────────────────
  showToast(message: string): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastMessage.set(message);
    this.toastVisible.set(true);

    this.toastTimeout = setTimeout(() => {
      this.toastVisible.set(false);
      this.toastTimeout = null;
    }, 3000);
  }

  // ── Formatting helpers ─────────────────────────────────────────
  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ── VD-1: Violation Detail Card helpers ──────────────────────
  formatFieldValue(field: ConditionalField, value: unknown): string {
    if (value === null || value === undefined || value === '') return 'Not provided';
    if (field.type === 'boolean') return value ? 'Yes' : 'No';
    if (field.type === 'select') return resolveSelectLabel(field, String(value));
    if (field.type === 'number') return Number(value).toLocaleString();
    if (field.type === 'date') return this.formatDate(String(value));
    return String(value);
  }

  getSpeedOverClass(mphOver: number): string {
    if (mphOver >= 15) return 'speed-over-high';
    if (mphOver >= 10) return 'speed-over-medium';
    return 'speed-over-low';
  }

  getRoadZoneIcon(zone: string): string {
    if (zone === 'school') return '\uD83C\uDFEB';
    if (zone === 'construction') return '\uD83D\uDEA7';
    return '';
  }

  // ── Private helpers ────────────────────────────────────────────
  private isImage(fileName: string): boolean {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  }
}
