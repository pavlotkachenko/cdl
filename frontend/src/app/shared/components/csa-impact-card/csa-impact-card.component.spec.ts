import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CsaImpactCardComponent } from './csa-impact-card.component';

async function setup(inputs: Record<string, unknown> = {}) {
  await TestBed.configureTestingModule({
    imports: [CsaImpactCardComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(CsaImpactCardComponent);
  fixture.componentRef.setInput('violationType', inputs['violationType'] ?? 'speeding');
  if ('typeSpecificData' in inputs) fixture.componentRef.setInput('typeSpecificData', inputs['typeSpecificData']);
  if ('violationDate' in inputs) fixture.componentRef.setInput('violationDate', inputs['violationDate']);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('CsaImpactCardComponent', () => {
  // ── Visibility ──────────────────────────────────────────────────

  it('renders card for violation types with csaBasic (speeding)', async () => {
    const { fixture } = await setup({ violationType: 'speeding' });
    expect(fixture.nativeElement.querySelector('.csa-card')).toBeTruthy();
  });

  it('renders card for DUI (Controlled Substances/Alcohol)', async () => {
    const { fixture } = await setup({ violationType: 'dui' });
    expect(fixture.nativeElement.querySelector('.csa-card')).toBeTruthy();
  });

  it('hides card for types without csaBasic (other)', async () => {
    const { fixture } = await setup({ violationType: 'other' });
    expect(fixture.nativeElement.querySelector('.csa-card')).toBeFalsy();
  });

  // ── BASIC category ─────────────────────────────────────────────

  it('shows correct BASIC category name for speeding', async () => {
    const { component } = await setup({ violationType: 'speeding' });
    expect(component.basicCategory()).toBe('Unsafe Driving');
  });

  it('shows correct BASIC category for hos_logbook', async () => {
    const { component } = await setup({ violationType: 'hos_logbook' });
    expect(component.basicCategory()).toBe('HOS Compliance');
  });

  it('BASIC badge renders in DOM', async () => {
    const { fixture } = await setup({ violationType: 'speeding' });
    const badge = fixture.nativeElement.querySelector('.basic-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent.trim()).toBe('Unsafe Driving');
  });

  // ── Intervention threshold ─────────────────────────────────────

  it('shows threshold 65 for Unsafe Driving', async () => {
    const { component } = await setup({ violationType: 'speeding' });
    expect(component.threshold()).toBe(65);
  });

  it('shows threshold 80 for Vehicle Maintenance', async () => {
    const { component } = await setup({ violationType: 'dot_inspection' });
    expect(component.threshold()).toBe(80);
  });

  it('threshold text renders in DOM', async () => {
    const { fixture } = await setup({ violationType: 'speeding' });
    const text = fixture.nativeElement.querySelector('.threshold-text');
    expect(text.textContent).toContain('65');
  });

  // ── Severity weight ────────────────────────────────────────────

  it('shows exact severity when severity_weight in typeSpecificData', async () => {
    const { component } = await setup({
      violationType: 'speeding',
      typeSpecificData: { severity_weight: 7 },
    });
    expect(component.exactSeverity()).toBe(7);
  });

  it('returns null for exactSeverity when no severity_weight', async () => {
    const { component } = await setup({ violationType: 'speeding' });
    expect(component.exactSeverity()).toBeNull();
  });

  it('severity estimate shown for speeding type', async () => {
    const { component } = await setup({ violationType: 'speeding' });
    expect(component.severityEstimate()).toContain('5');
    expect(component.severityEstimate()).toContain('7');
  });

  it('severity bar has correct width percentage for exact value', async () => {
    const { component } = await setup({
      violationType: 'speeding',
      typeSpecificData: { severity_weight: 5 },
    });
    expect(component.severityBarPercent()).toBe(50);
  });

  it('severity bar has role="meter" in DOM', async () => {
    const { fixture } = await setup({ violationType: 'speeding' });
    const bar = fixture.nativeElement.querySelector('[role="meter"]');
    expect(bar).toBeTruthy();
  });

  it('severity bar has correct aria attributes', async () => {
    const { fixture } = await setup({
      violationType: 'speeding',
      typeSpecificData: { severity_weight: 6 },
    });
    const bar = fixture.nativeElement.querySelector('[role="meter"]');
    expect(bar.getAttribute('aria-valuemin')).toBe('1');
    expect(bar.getAttribute('aria-valuemax')).toBe('10');
    expect(bar.getAttribute('aria-valuenow')).toBe('6');
  });

  it('severity bar class is severity-low for value <= 3', async () => {
    const { component } = await setup({
      violationType: 'speeding',
      typeSpecificData: { severity_weight: 2 },
    });
    expect(component.severityBarClass()).toContain('severity-low');
  });

  it('severity bar class is severity-critical for value > 8', async () => {
    const { component } = await setup({
      violationType: 'speeding',
      typeSpecificData: { severity_weight: 9 },
    });
    expect(component.severityBarClass()).toContain('severity-critical');
  });

  // ── Time weight ────────────────────────────────────────────────

  it('returns null when no violationDate', async () => {
    const { component } = await setup({ violationType: 'speeding' });
    expect(component.timeWeight()).toBeNull();
  });

  it('returns 3x for violation within last 6 months', async () => {
    const recent = new Date();
    recent.setMonth(recent.getMonth() - 2);
    const { component } = await setup({
      violationType: 'speeding',
      violationDate: recent.toISOString().slice(0, 10),
    });
    expect(component.timeWeight()!.multiplier).toBe('3');
  });

  it('returns 2x for violation 6-12 months ago', async () => {
    const moderate = new Date();
    moderate.setMonth(moderate.getMonth() - 9);
    const { component } = await setup({
      violationType: 'speeding',
      violationDate: moderate.toISOString().slice(0, 10),
    });
    expect(component.timeWeight()!.multiplier).toBe('2');
  });

  it('returns 1x for violation 12-24 months ago', async () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 18);
    const { component } = await setup({
      violationType: 'speeding',
      violationDate: old.toISOString().slice(0, 10),
    });
    expect(component.timeWeight()!.multiplier).toBe('1');
  });

  it('returns 0x for violation older than 24 months', async () => {
    const expired = new Date();
    expired.setMonth(expired.getMonth() - 30);
    const { component } = await setup({
      violationType: 'speeding',
      violationDate: expired.toISOString().slice(0, 10),
    });
    expect(component.timeWeight()!.multiplier).toBe('0');
  });

  it('shows missing message in DOM when no violation date', async () => {
    const { fixture } = await setup({ violationType: 'speeding' });
    const missing = fixture.nativeElement.querySelector('.time-missing');
    expect(missing).toBeTruthy();
    expect(missing.textContent).toContain('Violation date needed');
  });

  // ── OOS bonus ──────────────────────────────────────────────────

  it('shows OOS bonus when vehicle_oos is true', async () => {
    const { fixture } = await setup({
      violationType: 'dot_inspection',
      typeSpecificData: { vehicle_oos: true },
    });
    const oos = fixture.nativeElement.querySelector('.oos-section');
    expect(oos).toBeTruthy();
  });

  it('shows OOS bonus when driver_oos is true', async () => {
    const { fixture } = await setup({
      violationType: 'dot_inspection',
      typeSpecificData: { driver_oos: true },
    });
    expect(fixture.nativeElement.querySelector('.oos-section')).toBeTruthy();
  });

  it('hides OOS bonus when no OOS flags', async () => {
    const { fixture } = await setup({
      violationType: 'dot_inspection',
      typeSpecificData: {},
    });
    expect(fixture.nativeElement.querySelector('.oos-section')).toBeFalsy();
  });

  // ── Percentiles ────────────────────────────────────────────────

  it('shows percentile display when data available', async () => {
    const { fixture } = await setup({
      violationType: 'speeding',
      typeSpecificData: { current_percentile: 45, projected_percentile: 72 },
    });
    const display = fixture.nativeElement.querySelector('.percentile-display');
    expect(display).toBeTruthy();
  });

  it('shows informational text when percentiles unavailable', async () => {
    const { fixture } = await setup({ violationType: 'speeding' });
    const info = fixture.nativeElement.querySelector('.percentile-info');
    expect(info).toBeTruthy();
    expect(info.textContent).toContain('CSA percentiles');
  });

  it('shows warning when projected percentile exceeds threshold', async () => {
    const { fixture } = await setup({
      violationType: 'speeding',
      typeSpecificData: { current_percentile: 55, projected_percentile: 70 },
    });
    const warning = fixture.nativeElement.querySelector('.percentile-warning');
    expect(warning).toBeTruthy();
    expect(warning.textContent).toContain('Above intervention threshold');
  });

  it('no warning when projected percentile below threshold', async () => {
    const { fixture } = await setup({
      violationType: 'speeding',
      typeSpecificData: { current_percentile: 30, projected_percentile: 40 },
    });
    expect(fixture.nativeElement.querySelector('.percentile-warning')).toBeFalsy();
  });
});
