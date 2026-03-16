import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { StatusWorkflowService } from './status-workflow.service';

describe('StatusWorkflowService', () => {
  let service: StatusWorkflowService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        StatusWorkflowService,
      ],
    });
    service = TestBed.inject(StatusWorkflowService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ----------------------------------------------------------------
  // getNextStatuses (API call)
  // ----------------------------------------------------------------
  describe('getNextStatuses', () => {
    it('GET /api/cases/:id/next-statuses', () => {
      const mock = {
        currentStatus: 'new',
        nextStatuses: ['reviewed'],
        requiresNote: {},
      };
      service.getNextStatuses('case-1').subscribe(res => {
        expect(res).toEqual(mock);
      });
      const req = http.expectOne('/api/cases/case-1/next-statuses');
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });
  });

  // ----------------------------------------------------------------
  // changeStatus (API call)
  // ----------------------------------------------------------------
  describe('changeStatus', () => {
    it('POST /api/cases/:id/status with body', () => {
      service.changeStatus('case-1', 'reviewed', 'note text').subscribe();
      const req = http.expectOne('/api/cases/case-1/status');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ status: 'reviewed', comment: 'note text' });
      req.flush({ message: 'ok' });
    });
  });

  // ----------------------------------------------------------------
  // getPhaseForStatus (client-side)
  // ----------------------------------------------------------------
  describe('getPhaseForStatus', () => {
    it('returns intake phase for "reviewed"', () => {
      const phase = service.getPhaseForStatus('reviewed');
      expect(phase?.key).toBe('intake');
    });

    it('returns processing phase for "call_court"', () => {
      const phase = service.getPhaseForStatus('call_court');
      expect(phase?.key).toBe('processing');
    });

    it('returns undefined for unknown status', () => {
      expect(service.getPhaseForStatus('nonexistent')).toBeUndefined();
    });
  });

  // ----------------------------------------------------------------
  // getPhaseIndex (client-side)
  // ----------------------------------------------------------------
  describe('getPhaseIndex', () => {
    it('returns 0 for "new"', () => {
      expect(service.getPhaseIndex('new')).toBe(0);
    });

    it('returns 1 for "assigned_to_attorney"', () => {
      expect(service.getPhaseIndex('assigned_to_attorney')).toBe(1);
    });

    it('returns 4 for "closed"', () => {
      expect(service.getPhaseIndex('closed')).toBe(4);
    });

    it('returns -1 for unknown status', () => {
      expect(service.getPhaseIndex('nonexistent')).toBe(-1);
    });
  });

  // ----------------------------------------------------------------
  // getStatusConfig (client-side)
  // ----------------------------------------------------------------
  describe('getStatusConfig', () => {
    it('returns label key, color, and icon for each known status', () => {
      const config = service.getStatusConfig('new');
      expect(config.label).toBe('OPR.STATUS_NEW');
      expect(config.color).toBeTruthy();
      expect(config.icon).toBeTruthy();
    });

    it('returns fallback for unknown status', () => {
      const config = service.getStatusConfig('nonexistent');
      expect(config.label).toBe('nonexistent');
      expect(config.icon).toBe('help_outline');
    });
  });

  // ----------------------------------------------------------------
  // getPhases (client-side)
  // ----------------------------------------------------------------
  describe('getPhases', () => {
    it('returns 5 phases', () => {
      expect(service.getPhases()).toHaveLength(5);
    });

    it('phases are in order: intake → resolution', () => {
      const keys = service.getPhases().map(p => p.key);
      expect(keys).toEqual(['intake', 'assignment', 'processing', 'payment', 'resolution']);
    });
  });
});
