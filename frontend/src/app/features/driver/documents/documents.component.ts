import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DocumentUploadComponent } from './document-upload/document-upload.component';
import { DocumentsListComponent } from './documents-list/documents-list.component';
import { Document } from '../../../core/services/document.service';

@Component({
  selector: 'app-documents',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocumentUploadComponent, DocumentsListComponent],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
})
export class DocumentsComponent {
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  readonly caseId = signal('current-case');
  readonly showUploadPanel = signal(false);
  readonly refreshTrigger = signal(0);

  constructor() {
    this.route.params.subscribe(params => {
      this.caseId.set(params['id'] || 'current-case');
    });
  }

  toggleUploadPanel(): void {
    this.showUploadPanel.update(v => !v);
  }

  onDocumentsUploaded(docs: Document[]): void {
    this.showUploadPanel.set(false);
    this.refreshTrigger.update(v => v + 1);
    this.snackBar.open(`${docs.length} document(s) uploaded successfully`, 'Close', { duration: 3000 });
  }
}
