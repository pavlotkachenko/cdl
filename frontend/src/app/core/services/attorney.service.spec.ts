import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AttorneyService } from './attorney.service';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/cases`;

const MOCK_CASE = {
  id: 'c1', case_number: 'CASE-001', status: 'assigned_to_attorney',
  violation_type: 'Speeding', state: 'TX', driver_name: 'Alice', created_at: '2026-01-01',
};

describe('AttorneyService', () => {
  let service: AttorneyService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AttorneyService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('getMyCases() calls GET /my-cases', () => {
    service.getMyCases().subscribe(r => {
      expect(r.cases.length).toBe(1);
      expect(r.cases[0].id).toBe('c1');
    });
    controller.expectOne(`${API}/my-cases`).flush({ cases: [MOCK_CASE] });
  });

  it('getCaseById() calls GET /:id', () => {
    service.getCaseById('c1').subscribe(r => {
      expect(r.data.case_number).toBe('CASE-001');
    });
    controller.expectOne(`${API}/c1`).flush({ data: MOCK_CASE });
  });

  it('getDocuments() calls GET /:id/documents', () => {
    const docs = [{ id: 'd1', file_name: 'ticket.pdf', file_type: 'application/pdf', file_size: 1024, uploaded_at: '2026-01-01' }];
    service.getDocuments('c1').subscribe(r => {
      expect(r.documents.length).toBe(1);
    });
    controller.expectOne(`${API}/c1/documents`).flush({ documents: docs });
  });

  it('acceptCase() calls POST /:id/accept', () => {
    service.acceptCase('c1').subscribe();
    const req = controller.expectOne(`${API}/c1/accept`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('declineCase() calls POST /:id/decline with optional reason', () => {
    service.declineCase('c1', 'Out of jurisdiction').subscribe();
    const req = controller.expectOne(`${API}/c1/decline`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.reason).toBe('Out of jurisdiction');
    req.flush(null);
  });

  it('updateStatus() calls POST /:id/status with status and comment', () => {
    service.updateStatus('c1', 'call_court', 'Scheduled for March').subscribe();
    const req = controller.expectOne(`${API}/c1/status`);
    expect(req.request.body.status).toBe('call_court');
    expect(req.request.body.comment).toBe('Scheduled for March');
    req.flush(null);
  });

  it('getCaseNotes() calls GET /:id/notes', () => {
    const notes = [{ id: 'n1', content: 'Review done.', created_at: '2026-01-02' }];
    service.getCaseNotes('c1').subscribe(r => {
      expect(r.notes.length).toBe(1);
      expect(r.notes[0].id).toBe('n1');
    });
    controller.expectOne(`${API}/c1/notes`).flush({ notes });
  });

  it('addNote() calls POST /:id/notes with content', () => {
    service.addNote('c1', 'Reviewed evidence').subscribe();
    const req = controller.expectOne(`${API}/c1/notes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.content).toBe('Reviewed evidence');
    req.flush({ note: { id: 'n2', content: 'Reviewed evidence', created_at: '2026-01-03' } });
  });

  it('getCourtDate() calls GET /:id/court-date', () => {
    const courtDate = { id: 'cd1', court_date: '2026-04-15', location: 'Travis County' };
    service.getCourtDate('c1').subscribe(r => {
      expect(r.court_date?.court_date).toBe('2026-04-15');
    });
    controller.expectOne(`${API}/c1/court-date`).flush({ court_date: courtDate });
  });

  it('setCourtDate() calls POST /:id/court-date with date and location', () => {
    service.setCourtDate('c1', '2026-06-01', 'Travis County').subscribe();
    const req = controller.expectOne(`${API}/c1/court-date`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.court_date).toBe('2026-06-01');
    expect(req.request.body.location).toBe('Travis County');
    req.flush(null);
  });

  it('uploadDocument() calls POST /:id/documents with FormData', () => {
    const file = new File(['content'], 'ticket.pdf', { type: 'application/pdf' });
    service.uploadDocument('c1', file).subscribe(r => {
      expect(r.document.file_name).toBe('ticket.pdf');
    });
    const req = controller.expectOne(`${API}/c1/documents`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ document: { id: 'd1', file_name: 'ticket.pdf', file_type: 'application/pdf', file_size: 7, uploaded_at: '2026-01-01' } });
  });
});
