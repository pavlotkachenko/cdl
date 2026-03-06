import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { ComplianceReportComponent } from './compliance-report.component';
import { CarrierService, ComplianceReport } from '../../../core/services/carrier.service';
import { MatSnackBar } from '@angular/material/snack-bar';

const MOCK_REPORT: ComplianceReport = {
  generated_at: '2026-03-06T10:00:00.000Z',
  report: [
    {
      case_number: 'CDL-001', driver_name: 'Alice', cdl_number: 'CDL123',
      violation_type: 'Speeding', state: 'TX', status: 'resolved',
      incident_date: '2026-01-15', attorney_name: 'J. Law',
    },
  ],
};

function makeServiceSpy() {
  return {
    getComplianceReport: vi.fn().mockReturnValue(of(MOCK_REPORT)),
  };
}

async function setup(spy = makeServiceSpy()) {
  await TestBed.configureTestingModule({
    imports: [ComplianceReportComponent, NoopAnimationsModule],
    providers: [
      { provide: CarrierService, useValue: spy },
      provideRouter([]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ComplianceReportComponent);
  // Spy before detectChanges so ngOnInit error paths are captured
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, spy, snackBar };
}

describe('ComplianceReportComponent', () => {
  it('loads report on init and calls getComplianceReport', async () => {
    const { spy } = await setup();
    expect(spy.getComplianceReport).toHaveBeenCalled();
  });

  it('displays report row data after load', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('CDL-001');
    expect(el.textContent).toContain('Alice');
    expect(el.textContent).toContain('Speeding');
  });

  it('shows Print button when report has rows', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Print');
  });

  it('shows empty state when report is empty', async () => {
    const spy = makeServiceSpy();
    spy.getComplianceReport = vi.fn().mockReturnValue(of({ generated_at: '2026-03-06T00:00:00Z', report: [] }));
    const { fixture } = await setup(spy);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('No violations found');
  });

  it('shows error snackbar when getComplianceReport fails', async () => {
    const spy = makeServiceSpy();
    spy.getComplianceReport = vi.fn().mockReturnValue(throwError(() => new Error('fail')));
    const { snackBar } = await setup(spy);
    expect(snackBar.open).toHaveBeenCalledWith('Failed to generate report.', 'Close', expect.any(Object));
  });

  it('passes from/to params when load() is called with dates', async () => {
    const { component, spy } = await setup();
    component.fromDate = '2026-01-01';
    component.toDate = '2026-03-01';
    component.load();
    expect(spy.getComplianceReport).toHaveBeenCalledWith('2026-01-01', '2026-03-01');
  });
});
