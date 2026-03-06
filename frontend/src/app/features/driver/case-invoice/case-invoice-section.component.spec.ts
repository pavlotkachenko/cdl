import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi, describe, it, expect, afterEach } from 'vitest';

import { CaseInvoiceSectionComponent } from './case-invoice-section.component';
import { environment } from '../../../../environments/environment';

const MOCK_INVOICE = {
  invoice_number: 'INV-CDL-001',
  case_number: 'CDL-001',
  customer_name: 'John Doe',
  attorney_name: 'Jane Smith',
  amount: 250,
  currency: 'usd',
  issued_at: '2026-01-15T00:00:00.000Z',
  status: 'closed',
};

async function setup() {
  await TestBed.configureTestingModule({
    imports: [CaseInvoiceSectionComponent, NoopAnimationsModule],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  }).compileComponents();

  const fixture = TestBed.createComponent(CaseInvoiceSectionComponent);
  fixture.componentRef.setInput('caseId', 'c1');
  fixture.detectChanges();
  const httpMock = TestBed.inject(HttpTestingController);
  return { fixture, component: fixture.componentInstance, httpMock };
}

describe('CaseInvoiceSectionComponent (IN-2)', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('fetches invoice on init', async () => {
    const { httpMock } = await setup();
    const req = httpMock.expectOne(`${environment.apiUrl}/invoices/case/c1`);
    expect(req.request.method).toBe('GET');
    req.flush({ invoice: MOCK_INVOICE });
  });

  it('displays invoice number and amount after load', async () => {
    const { fixture, httpMock } = await setup();
    const req = httpMock.expectOne(`${environment.apiUrl}/invoices/case/c1`);
    req.flush({ invoice: MOCK_INVOICE });
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('INV-CDL-001');
    expect(el.textContent).toContain('Download Invoice');
  });

  it('hides invoice section when API returns error (no invoice)', async () => {
    const { fixture, httpMock } = await setup();
    const req = httpMock.expectOne(`${environment.apiUrl}/invoices/case/c1`);
    req.flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.inv-card')).toBeNull();
  });

  it('printInvoice() calls window.print()', async () => {
    const { component, httpMock } = await setup();
    const req = httpMock.expectOne(`${environment.apiUrl}/invoices/case/c1`);
    req.flush({ invoice: MOCK_INVOICE });

    const printSpy = vi.spyOn(window, 'print').mockReturnValue(undefined);
    component.printInvoice();
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
