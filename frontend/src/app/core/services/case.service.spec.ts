/**
 * Tests for CaseService — Sprint 003 new methods
 * Covers: listDocuments, uploadDocument, deleteDocument,
 *         getOperatorCases, getAvailableAttorneys, assignToAttorney,
 *         acceptCase, declineCase, getRecommendedAttorneys, selectAttorney
 */
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CaseService } from './case.service';

const API = 'http://localhost:3000/api';

describe('CaseService — Sprint 003 methods', () => {
  let service: CaseService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CaseService,
      ],
    });
    service = TestBed.inject(CaseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ----------------------------------------------------------------
  // listDocuments
  // ----------------------------------------------------------------
  describe('listDocuments', () => {
    it('GET /cases/:id/documents and returns response', () => {
      const mockDocs = { documents: [{ id: 'd1', fileName: 'ticket.pdf' }] };
      service.listDocuments('case-1').subscribe(res => {
        expect(res).toEqual(mockDocs);
      });
      const req = http.expectOne(`${API}/cases/case-1/documents`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDocs);
    });
  });

  // ----------------------------------------------------------------
  // uploadDocument
  // ----------------------------------------------------------------
  describe('uploadDocument', () => {
    it('POST /cases/:id/documents with FormData containing file', () => {
      const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
      const mockResponse = { id: 'f1', fileName: 'photo.jpg' };

      service.uploadDocument('case-1', file).subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = http.expectOne(`${API}/cases/case-1/documents`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      expect(req.request.body.get('file')).toBe(file);
      req.flush(mockResponse);
    });
  });

  // ----------------------------------------------------------------
  // deleteDocument
  // ----------------------------------------------------------------
  describe('deleteDocument', () => {
    it('DELETE /cases/:caseId/documents/:docId', () => {
      service.deleteDocument('case-1', 'doc-1').subscribe(res => {
        expect(res).toEqual({ message: 'Document deleted' });
      });
      const req = http.expectOne(`${API}/cases/case-1/documents/doc-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Document deleted' });
    });
  });

  // ----------------------------------------------------------------
  // getOperatorCases
  // ----------------------------------------------------------------
  describe('getOperatorCases', () => {
    it('GET /operator/cases with default status=new', () => {
      const mockResponse = { cases: [], summary: { newCount: 0, avgAgeHours: 0, assignedToday: 0 } };

      service.getOperatorCases().subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = http.expectOne(`${API}/operator/cases?status=new`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('GET /operator/cases with custom status', () => {
      service.getOperatorCases('reviewed').subscribe();
      const req = http.expectOne(`${API}/operator/cases?status=reviewed`);
      expect(req.request.urlWithParams).toContain('status=reviewed');
      req.flush({ cases: [], summary: {} });
    });
  });

  // ----------------------------------------------------------------
  // getAvailableAttorneys
  // ----------------------------------------------------------------
  describe('getAvailableAttorneys', () => {
    it('GET /operator/attorneys', () => {
      const mockResponse = { attorneys: [{ id: 'a1', fullName: 'Alice', activeCount: 2 }] };

      service.getAvailableAttorneys().subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = http.expectOne(`${API}/operator/attorneys`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // ----------------------------------------------------------------
  // assignToAttorney
  // ----------------------------------------------------------------
  describe('assignToAttorney', () => {
    it('POST /cases/:id/assign-attorney with attorney_id and attorney_price', () => {
      service.assignToAttorney('case-1', 'atty-1', 450).subscribe();

      const req = http.expectOne(`${API}/cases/case-1/assign-attorney`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ attorney_id: 'atty-1', attorney_price: 450 });
      req.flush({ message: 'Assigned' });
    });
  });

  // ----------------------------------------------------------------
  // acceptCase
  // ----------------------------------------------------------------
  describe('acceptCase', () => {
    it('POST /cases/:id/accept', () => {
      service.acceptCase('case-1').subscribe();

      const req = http.expectOne(`${API}/cases/case-1/accept`);
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Accepted' });
    });
  });

  // ----------------------------------------------------------------
  // declineCase
  // ----------------------------------------------------------------
  describe('declineCase', () => {
    it('POST /cases/:id/decline without reason', () => {
      service.declineCase('case-1').subscribe();
      const req = http.expectOne(`${API}/cases/case-1/decline`);
      expect(req.request.body).toEqual({ reason: undefined });
      req.flush({ message: 'Declined' });
    });

    it('POST /cases/:id/decline with reason', () => {
      service.declineCase('case-1', 'conflict of interest').subscribe();
      const req = http.expectOne(`${API}/cases/case-1/decline`);
      expect(req.request.body.reason).toBe('conflict of interest');
      req.flush({ message: 'Declined' });
    });
  });

  // ----------------------------------------------------------------
  // getRecommendedAttorneys
  // ----------------------------------------------------------------
  describe('getRecommendedAttorneys', () => {
    it('GET /cases/:id/attorneys', () => {
      const mockResponse = { attorneys: [{ id: 'a1', fullName: 'Alice', isRecommended: true }] };

      service.getRecommendedAttorneys('case-1').subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = http.expectOne(`${API}/cases/case-1/attorneys`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // ----------------------------------------------------------------
  // selectAttorney
  // ----------------------------------------------------------------
  describe('selectAttorney', () => {
    it('POST /cases/:id/select-attorney with attorney_id', () => {
      service.selectAttorney('case-1', 'atty-1').subscribe();

      const req = http.expectOne(`${API}/cases/case-1/select-attorney`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ attorney_id: 'atty-1' });
      req.flush({ message: 'Selected' });
    });
  });

  // ----------------------------------------------------------------
  // getMyCases — normalises {cases:[]} → {data:[]}
  // ----------------------------------------------------------------
  describe('getMyCases normalisation', () => {
    it('maps response.cases to response.data', () => {
      const raw = { cases: [{ id: 'c1', status: 'new' }] };
      service.getMyCases().subscribe((res: any) => {
        expect(res.data).toEqual(raw.cases);
      });
      const req = http.expectOne(`${API}/cases/my-cases`);
      req.flush(raw);
    });
  });

  // ----------------------------------------------------------------
  // getCaseById — normalises {case:{}} → {data:{}}
  // ----------------------------------------------------------------
  describe('getCaseById normalisation', () => {
    it('maps response.case to response.data', () => {
      const raw = { case: { id: 'c1', status: 'new' } };
      service.getCaseById('c1').subscribe((res: any) => {
        expect(res.data).toEqual(raw.case);
      });
      const req = http.expectOne(`${API}/cases/c1`);
      req.flush(raw);
    });
  });
});
