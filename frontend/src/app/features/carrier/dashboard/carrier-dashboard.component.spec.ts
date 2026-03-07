import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { CarrierDashboardComponent } from './carrier-dashboard.component';
import { CarrierService, FleetStats, CsaScoreResponse } from '../../../core/services/carrier.service';
import { AuthService } from '../../../core/services/auth.service';

const MOCK_STATS: FleetStats = {
  totalDrivers: 10,
  activeCases: 3,
  pendingCases: 2,
  resolvedCases: 8,
};

const MOCK_CSA: CsaScoreResponse = {
  csaScore: 42,
  riskLevel: 'medium',
  openViolations: 3,
  breakdown: { hos: 1, maintenance: 1, speeding_major: 0, speeding_minor: 1, other: 0 },
};

function makeCarrierServiceSpy(stats = MOCK_STATS, csa = MOCK_CSA) {
  return {
    getStats: vi.fn().mockReturnValue(of(stats)),
    getCsaScore: vi.fn().mockReturnValue(of(csa)),
  };
}

function makeAuthServiceSpy(name = 'ACME Trucking') {
  return { currentUser$: of({ name, role: 'carrier' }) };
}

async function setup(
  carrierSpy = makeCarrierServiceSpy(),
  authSpy = makeAuthServiceSpy(),
) {
  await TestBed.configureTestingModule({
    imports: [CarrierDashboardComponent, NoopAnimationsModule],
    providers: [
      { provide: CarrierService, useValue: carrierSpy },
      { provide: AuthService, useValue: authSpy },
      provideRouter([]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CarrierDashboardComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('CarrierDashboardComponent', () => {
  it('renders company name from auth service', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('ACME Trucking');
  });

  it('displays fleet stats after load', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('10'); // totalDrivers
    expect(el.textContent).toContain('3');  // activeCases
    expect(el.textContent).toContain('2');  // pendingCases
    expect(el.textContent).toContain('8');  // resolvedCases
  });

  it('computes riskScore as activeCases + pendingCases', async () => {
    const { component } = await setup();
    expect(component.riskScore()).toBe(5);
  });

  it('sets riskLevel to yellow when score is 5–15', async () => {
    const { component } = await setup();
    expect(component.riskLevel()).toBe('yellow');
  });

  it('sets riskLevel to green when score < 5', async () => {
    const spy = makeCarrierServiceSpy({ totalDrivers: 5, activeCases: 1, pendingCases: 2, resolvedCases: 0 });
    const { component } = await setup(spy);
    expect(component.riskLevel()).toBe('green');
  });

  it('shows error message on stats load failure', async () => {
    const spy = {
      getStats: vi.fn().mockReturnValue(throwError(() => new Error('network'))),
      getCsaScore: vi.fn().mockReturnValue(of(MOCK_CSA)),
    };
    const { fixture } = await setup(spy as any);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Failed to load fleet stats');
  });

  // ── CSA Score widget (CS-1) ─────────────────────────────────────────────────

  it('csaData signal is populated from getCsaScore()', async () => {
    const { component } = await setup();
    expect(component.csaData().csaScore).toBe(42);
    expect(component.csaData().riskLevel).toBe('medium');
  });

  it('renders CSA score number in template', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('42');
  });

  it('still loads when getCsaScore errors (graceful degradation)', async () => {
    const spy = {
      getStats: vi.fn().mockReturnValue(of(MOCK_STATS)),
      getCsaScore: vi.fn().mockReturnValue(throwError(() => new Error('csa error'))),
    };
    const { component } = await setup(spy as any);
    // csaData should retain default value (score 0)
    expect(component.csaData().csaScore).toBe(0);
  });
});
