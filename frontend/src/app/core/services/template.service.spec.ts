/**
 * Tests for TemplateService — Sprint 051 / OC-4
 */
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TemplateService } from './template.service';

describe('TemplateService', () => {
  let service: TemplateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        TemplateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TemplateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getTemplates() calls correct endpoint', () => {
    service.getTemplates().subscribe();
    const req = httpMock.expectOne('/api/templates');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('getTemplates(category) passes category query param', () => {
    service.getTemplates('operator').subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/templates' && r.params.get('category') === 'operator');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('getTemplate(id) calls correct endpoint', () => {
    service.getTemplate('t1').subscribe();
    const req = httpMock.expectOne('/api/templates/t1');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { id: 't1', name: 'Test' } });
  });

  it('getTemplatesByCategory calls correct endpoint', () => {
    service.getTemplatesByCategory('operator').subscribe();
    const req = httpMock.expectOne('/api/templates/category/operator');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('renderForCase calls correct endpoint', () => {
    service.renderForCase('t1', 'c1').subscribe();
    const req = httpMock.expectOne('/api/templates/t1/render/c1');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { rendered: 'text' } });
  });
});
