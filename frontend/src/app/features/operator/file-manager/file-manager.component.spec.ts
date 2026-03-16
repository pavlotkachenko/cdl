import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';

import { FileManagerComponent, CaseFile } from './file-manager.component';
import { CaseService } from '../../../core/services/case.service';

const MOCK_FILES: CaseFile[] = [
  {
    id: 'f1', file_name: 'ticket.jpg', file_type: 'image/jpeg',
    file_size: 500000, signed_url: 'https://example.com/ticket.jpg',
    uploaded_by: 'op-1', created_at: '2026-03-10T10:00:00Z',
  },
  {
    id: 'f2', file_name: 'court-order.pdf', file_type: 'application/pdf',
    file_size: 1200000, signed_url: 'https://example.com/court.pdf',
    uploaded_by: 'op-2', created_at: '2026-03-09T08:00:00Z',
  },
];

describe('FileManagerComponent', () => {
  let fixture: ComponentFixture<FileManagerComponent>;
  let component: FileManagerComponent;
  let caseServiceSpy: {
    listDocuments: ReturnType<typeof vi.fn>;
    uploadDocument: ReturnType<typeof vi.fn>;
    deleteDocument: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();

    caseServiceSpy = {
      listDocuments: vi.fn().mockReturnValue(of({ documents: MOCK_FILES })),
      uploadDocument: vi.fn().mockReturnValue(of({ id: 'f3', file_name: 'new.png' })),
      deleteDocument: vi.fn().mockReturnValue(of({ message: 'deleted' })),
    };

    await TestBed.configureTestingModule({
      imports: [FileManagerComponent, NoopAnimationsModule],
      providers: [
        { provide: CaseService, useValue: caseServiceSpy },
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FileManagerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('caseId', 'case-1');
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ----------------------------------------------------------------
  // Loading and displaying files
  // ----------------------------------------------------------------
  it('loads files on init', () => {
    expect(caseServiceSpy.listDocuments).toHaveBeenCalledWith('case-1');
  });

  it('sets loading to false after files load', () => {
    expect(component.loading()).toBe(false);
  });

  it('displays file cards after load', () => {
    const cards = fixture.nativeElement.querySelectorAll('.file-card');
    expect(cards.length).toBe(2);
  });

  it('shows empty text when no files', () => {
    caseServiceSpy.listDocuments.mockReturnValue(of({ documents: [] }));
    component.files.set([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty-text')).toBeTruthy();
  });

  // ----------------------------------------------------------------
  // Upload zone
  // ----------------------------------------------------------------
  it('shows upload zone when not readonly', () => {
    expect(fixture.nativeElement.querySelector('.drop-zone')).toBeTruthy();
  });

  it('hides upload zone when readonly', () => {
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.drop-zone')).toBeFalsy();
  });

  it('shows upload button when not readonly', () => {
    expect(fixture.nativeElement.querySelector('.upload-btn')).toBeTruthy();
  });

  // ----------------------------------------------------------------
  // Drag and drop
  // ----------------------------------------------------------------
  it('sets dragActive on dragover', () => {
    const event = new Event('dragover') as DragEvent;
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    component.onDragOver(event as DragEvent);
    expect(component.dragActive()).toBe(true);
  });

  it('clears dragActive on dragleave', () => {
    component.dragActive.set(true);
    component.onDragLeave();
    expect(component.dragActive()).toBe(false);
  });

  // ----------------------------------------------------------------
  // File size validation
  // ----------------------------------------------------------------
  it('rejects files over 10MB', () => {
    const bigFile = new File(['x'.repeat(100)], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 });

    // Trigger via onFileSelected with a mock event
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [bigFile] });
    component.onFileSelected({ target: input } as unknown as Event);

    expect(component.uploadError()).toBe('OPR.FILES.SIZE_EXCEEDED');
    expect(caseServiceSpy.uploadDocument).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // Preview
  // ----------------------------------------------------------------
  it('opens preview overlay for a file', () => {
    component.preview(MOCK_FILES[0]);
    expect(component.previewFile()).toBe(MOCK_FILES[0]);
  });

  it('closes preview on closePreview', () => {
    component.preview(MOCK_FILES[0]);
    component.closePreview();
    expect(component.previewFile()).toBeNull();
  });

  // ----------------------------------------------------------------
  // File type detection
  // ----------------------------------------------------------------
  it('isImage returns true for JPEG', () => {
    expect(component.isImage(MOCK_FILES[0])).toBe(true);
  });

  it('isPdf returns true for PDF', () => {
    expect(component.isPdf(MOCK_FILES[1])).toBe(true);
  });

  // ----------------------------------------------------------------
  // Delete
  // ----------------------------------------------------------------
  it('canDelete returns true when uploaded_by matches current user', () => {
    fixture.componentRef.setInput('currentUserId', 'op-1');
    fixture.detectChanges();
    expect(component.canDelete(MOCK_FILES[0])).toBe(true);
  });

  it('canDelete returns false when uploaded_by does not match', () => {
    fixture.componentRef.setInput('currentUserId', 'op-1');
    fixture.detectChanges();
    expect(component.canDelete(MOCK_FILES[1])).toBe(false);
  });

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  it('truncates long file names', () => {
    expect(component.truncateName('a-very-long-filename-for-test.jpg')).toContain('...');
  });

  it('getExtension returns uppercase extension', () => {
    expect(component.getExtension('ticket.jpg')).toBe('JPG');
    expect(component.getExtension('court.pdf')).toBe('PDF');
  });
});
