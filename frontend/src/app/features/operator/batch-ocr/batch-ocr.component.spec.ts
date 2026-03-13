/**
 * Tests for BatchOcrComponent — Sprint 051 / OC-5
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BatchOcrComponent, OcrResult } from './batch-ocr.component';
import { CaseService } from '../../../core/services/case.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';

function makeFile(name: string, size = 1024, type = 'image/jpeg'): File {
  const blob = new Blob([new ArrayBuffer(size)], { type });
  return new File([blob], name, { type });
}

const mockResults: OcrResult[] = [
  {
    filename: 'ticket1.jpg', success: true,
    data: { violation_type: 'Speeding', violation_date: '2026-02-15', state: 'TX', county: 'Harris', fine_amount: 350, court_date: '2026-04-10', citation_number: 'CIT-001', confidence: 87 },
  },
  { filename: 'ticket2.jpg', success: false, error: 'Could not extract text from image' },
];

describe('BatchOcrComponent', () => {
  let fixture: ComponentFixture<BatchOcrComponent>;
  let component: BatchOcrComponent;
  let caseServiceSpy: { batchOcr: ReturnType<typeof vi.fn> };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    TestBed.resetTestingModule();

    caseServiceSpy = {
      batchOcr: vi.fn().mockReturnValue(of({
        data: { results: mockResults, summary: { total: 2, successful: 1, failed: 1 } },
      })),
    };
    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [BatchOcrComponent, NoopAnimationsModule],
      providers: [
        { provide: CaseService, useValue: caseServiceSpy },
        { provide: Router, useValue: routerSpy },
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchOcrComponent);
    component = fixture.componentInstance;

    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    snackBarSpy = vi.spyOn(snackBar, 'open').mockReturnValue(null as any);

    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders upload zone initially', () => {
    const zone = fixture.nativeElement.querySelector('.drop-zone');
    expect(zone).toBeTruthy();
  });

  it('files added via onFilesSelected appear in list', () => {
    const f1 = makeFile('test.jpg');
    const f2 = makeFile('test2.png', 2048, 'image/png');
    component.onFilesSelected({ target: { files: [f1, f2] } } as any);
    fixture.detectChanges();
    expect(component.files().length).toBe(2);
    const items = fixture.nativeElement.querySelectorAll('.file-item');
    expect(items.length).toBe(2);
  });

  it('removeFile removes file from list', () => {
    component.files.set([makeFile('a.jpg'), makeFile('b.jpg')]);
    component.removeFile(0);
    expect(component.files().length).toBe(1);
    expect(component.files()[0].name).toBe('b.jpg');
  });

  it('processAll disabled when no files selected', () => {
    component.files.set([]);
    fixture.detectChanges();
    // No files card should be rendered
    const processBtn = fixture.nativeElement.querySelector('.process-btn');
    expect(processBtn).toBeNull();
  });

  it('processAll calls batch OCR endpoint', async () => {
    component.files.set([makeFile('t1.jpg'), makeFile('t2.jpg')]);
    fixture.detectChanges();
    component.processAll();
    await fixture.whenStable();
    expect(caseServiceSpy.batchOcr).toHaveBeenCalled();
  });

  it('successful results show extracted fields', async () => {
    component.files.set([makeFile('t1.jpg')]);
    component.processAll();
    await fixture.whenStable();
    fixture.detectChanges();
    const successItems = fixture.nativeElement.querySelectorAll('.result-success');
    expect(successItems.length).toBe(1);
  });

  it('failed results show error message', async () => {
    component.files.set([makeFile('t1.jpg')]);
    component.processAll();
    await fixture.whenStable();
    fixture.detectChanges();
    const failItems = fixture.nativeElement.querySelectorAll('.result-failure');
    expect(failItems.length).toBe(1);
    const errorText = failItems[0].querySelector('.result-error');
    expect(errorText.textContent).toContain('Could not extract');
  });

  it('summary bar shows correct counts', async () => {
    component.files.set([makeFile('t1.jpg')]);
    component.processAll();
    await fixture.whenStable();
    fixture.detectChanges();
    const summary = fixture.nativeElement.querySelector('.summary-bar');
    expect(summary).toBeTruthy();
    expect(summary.textContent).toContain('2');
  });

  it('drag-and-drop adds files via onDrop', () => {
    const file = makeFile('dropped.jpg');
    const event = new Event('drop') as any;
    event.preventDefault = vi.fn();
    event.stopPropagation = vi.fn();
    event.dataTransfer = { files: [file] };
    component.onDrop(event);
    expect(component.files().length).toBe(1);
    expect(component.files()[0].name).toBe('dropped.jpg');
  });

  it('rejects non-image files', () => {
    const file = makeFile('doc.txt', 1024, 'text/plain');
    component.onFilesSelected({ target: { files: [file] } } as any);
    expect(component.files().length).toBe(0);
  });

  it('enforces max 10 files', () => {
    const files = Array.from({ length: 12 }, (_, i) => makeFile(`file${i}.jpg`));
    component.onFilesSelected({ target: { files } } as any);
    expect(component.files().length).toBe(10);
  });

  it('formatSize formats bytes correctly', () => {
    expect(component.formatSize(500)).toBe('500 B');
    expect(component.formatSize(2048)).toBe('2 KB');
    expect(component.formatSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('goBack navigates to dashboard', () => {
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/operator/dashboard']);
  });

  it('error state shown on batch failure', async () => {
    caseServiceSpy.batchOcr.mockReturnValue(throwError(() => ({ error: { error: { message: 'OCR failed' } } })));
    component.files.set([makeFile('t1.jpg')]);
    component.processAll();
    await fixture.whenStable();
    fixture.detectChanges();
    const errorEl = fixture.nativeElement.querySelector('.ocr-error');
    expect(errorEl).toBeTruthy();
  });
});
