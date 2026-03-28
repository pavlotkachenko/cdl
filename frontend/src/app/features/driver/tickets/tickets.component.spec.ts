import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { TicketsComponent } from './tickets.component';
import { CaseService } from '../../../core/services/case.service';
import { ACTIVE_VIOLATION_TYPES } from '../../../core/constants/violation-type-registry';

function makeCaseServiceSpy() {
  return {
    getMyCases: vi.fn().mockReturnValue(of({
      cases: [
        {
          id: 'c1', case_number: 'CDL-001', status: 'new', violation_type: 'speeding',
          state: 'TX', created_at: '2026-01-15', violation_date: '2026-01-10',
          location: 'I-35', driver_name: 'Miguel',
        },
        {
          id: 'c2', case_number: 'CDL-002', status: 'resolved', violation_type: 'dui',
          state: 'CA', created_at: '2026-01-20', violation_date: '2026-01-18',
          location: 'Hwy 101', driver_name: 'Miguel',
          violation_severity: 'critical',
        },
      ],
    })),
  };
}

async function setup() {
  const caseSpy = makeCaseServiceSpy();

  await TestBed.configureTestingModule({
    imports: [TicketsComponent, NoopAnimationsModule],
    providers: [
      { provide: CaseService, useValue: caseSpy },
      provideRouter([]),
      provideTranslateService(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(TicketsComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, caseSpy };
}

describe('TicketsComponent', () => {
  // ── Type options ────────────────────────────────────────────────

  it('typeOptions includes all 14 active violation types', async () => {
    const { component } = await setup();
    // typeOptions starts with {value:'all'} then all active types
    const activeCount = ACTIVE_VIOLATION_TYPES.length;
    // Should have "All" + each active type
    expect(component.typeOptions.length).toBe(activeCount + 1);
  });

  it('typeOptions labels include emoji icons from registry', async () => {
    const { component } = await setup();
    const speedingOption = component.typeOptions.find((o: { value: string }) => o.value === 'speeding');
    expect(speedingOption).toBeTruthy();
    expect(speedingOption!.label).toContain('🚗');
    expect(speedingOption!.label).toContain('Speeding');
  });

  // ── Type label helper ───────────────────────────────────────────

  it('getTypeLabel returns emoji + label for known type', async () => {
    const { component } = await setup();
    const label = component.getTypeLabel('speeding');
    expect(label).toContain('🚗');
    expect(label).toContain('Speeding');
  });

  it('getTypeLabel returns formatted unknown type', async () => {
    const { component } = await setup();
    const label = component.getTypeLabel('unknown_xyz');
    expect(label).toBeTruthy();
  });

  it('getTypeLabel handles undefined', async () => {
    const { component } = await setup();
    const label = component.getTypeLabel(undefined);
    expect(label).toBeTruthy();
  });

  // ── Severity badge helper ───────────────────────────────────────

  it('getSeverityBadge returns correct label and class for critical', async () => {
    const { component } = await setup();
    const badge = component.getSeverityBadge({ violation_type: 'dui', violation_severity: 'critical' });
    expect(badge.label).toBe('Critical');
    expect(badge.cssClass).toContain('severity-critical');
  });

  it('getSeverityBadge falls back to registry severity', async () => {
    const { component } = await setup();
    const badge = component.getSeverityBadge({ violation_type: 'speeding' });
    expect(badge.label).toBe('Serious');
    expect(badge.cssClass).toContain('severity-serious');
  });

  it('getSeverityBadge returns "Standard" for unknown type', async () => {
    const { component } = await setup();
    const badge = component.getSeverityBadge({ violation_type: 'nonexistent' });
    expect(badge.label).toBe('Standard');
    expect(badge.cssClass).toContain('severity-standard');
  });

  // ── Data loading ────────────────────────────────────────────────

  it('loads cases on init', async () => {
    const { caseSpy } = await setup();
    expect(caseSpy.getMyCases).toHaveBeenCalled();
  });
});
