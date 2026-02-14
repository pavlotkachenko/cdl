// ============================================
// Documents Page Component (Main)
// Location: frontend/src/app/features/driver/documents/documents.component.ts
// ============================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

// Angular Material
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

// Child Components
import { DocumentUploadComponent } from './document-upload/document-upload.component';
import { DocumentsListComponent } from './documents-list/documents-list.component';

// Models
import { Document } from '../../../core/services/document.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss'],
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    DocumentUploadComponent,
    DocumentsListComponent
  ]
})
export class DocumentsComponent implements OnInit {
  caseId: string = '';
  selectedTabIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Get case ID from route params
    this.route.params.subscribe(params => {
      this.caseId = params['id'] || 'current-case';
    });
  }

  onDocumentsUploaded(documents: Document[]): void {
    console.log('Documents uploaded:', documents);
    
    // Switch to list view to see uploaded documents
    this.selectedTabIndex = 1;

    // Refresh the documents list
    // The list component will automatically refresh through its lifecycle
  }

  onDocumentSelected(document: Document): void {
    console.log('Document selected:', document);
    // Open document viewer/preview
  }

  openUploadDialog(): void {
    const dialogRef = this.dialog.open(DocumentUploadComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { caseId: this.caseId }
    });

    dialogRef.componentInstance.caseId = this.caseId;
    dialogRef.componentInstance.uploaded.subscribe((docs: Document[]) => {
      this.onDocumentsUploaded(docs);
      dialogRef.close();
    });
  }
}
