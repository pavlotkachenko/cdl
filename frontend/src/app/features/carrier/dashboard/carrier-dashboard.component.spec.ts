import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { CarrierDashboardComponent } from './carrier-dashboard.component';
import { CarrierService, FleetStats } from '../../../core/services/carrier.service';
import { AuthService } from '../../../core/services/auth.service';

const MOCK_STATS: FleetStats = {
  totalDrivers: 10,
  activeCases: 3,
  pendingCases: 2,
  resolvedCases: 8,
};

function makeCarrierServiceSpy(stats = MOCK_STATS) {
  return { getStats: vi.fn().mockReturnValue(of(stats)) };
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
    const spy = { getStats: vi.fn().mockReturnValue(throwError(() => new Error('network'))) };
    const { fixture } = await setup(spy as any);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Failed to load fleet stats');
  });
});
