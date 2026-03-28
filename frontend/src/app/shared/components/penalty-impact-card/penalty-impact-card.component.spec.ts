import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PenaltyImpactCardComponent } from './penalty-impact-card.component';

async function setup(inputs: Record<string, unknown> = {}) {
  await TestBed.configureTestingModule({
    imports: [PenaltyImpactCardComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(PenaltyImpactCardComponent);
  fixture.componentRef.setInput('violationType', inputs['violationType'] ?? 'speeding');
  if ('typeSpecificData' in inputs) fixture.componentRef.setInput('typeSpecificData', inputs['typeSpecificData']);
  if ('fineAmount' in inputs) fixture.componentRef.setInput('fineAmount', inputs['fineAmount']);
  if ('hasAttorney' in inputs) fixture.componentRef.setInput('hasAttorney', inputs['hasAttorney']);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('PenaltyImpactCardComponent', () => {
  // ── Rendering ───────────────────────────────────────────────────

  it('renders card for a known violation type', async () => {
    const { fixture } = await setup({ violationType: 'speeding' });
    expect(fixture.nativeElement.querySelector('.penalty-card')).toBeTruthy();
  });

  it('hides card when config() returns null for unknown type', async () => {
    const { fixture } = await setup({ violationType: 'nonexistent_type_xyz' });
    expect(fixture.nativeElement.querySelector('.penalty-card')).toBeFalsy();
  });

  it('renders heading with "Potential Penalties"', async () => {
    const { fixture } = await setup();
    const heading = fixture.nativeElement.querySelector('#penalty-heading');
    expect(heading.textContent).toContain('Potential Penalties');
  });

  // ── Fine display ────────────────────────────────────────────────

  it('displays fine amount when provided', async () => {
    const { fixture } = await setup({ violationType: 'speeding', fineAmount: 500 });
    const assessed = fixture.nativeElement.querySelector('.fine-assessed');
    expect(assessed).toBeTruthy();
    expect(assessed.textContent).toContain('500');
  });

  it('shows fine range from registry when no fine amount', async () => {
    const { fixture } = await setup({ violationType: 'speeding' });
    const estimated = fixture.nativeElement.querySelector('.fine-estimated');
    expect(estimated).toBeTruthy();
    expect(estimated.textContent).toContain('150');
    expect(estimated.textContent).toContain('2,500');
  });

  it('shows typical range note alongside assessed fine', async () => {
    const { fixture } = await setup({ violationType: 'speeding', fineAmount: 500 });
    const rangeNote = fixture.nativeElement.querySelector('.fine-range-note');
    expect(rangeNote).toBeTruthy();
    expect(rangeNote.textContent).toContain('Typical range');
  });

  it('shows "No fine typically assessed" for zero-range types', async () => {
    const { fixture } = await setup({ violationType: 'csa_score' });
    const noFine = fixture.nativeElement.querySelector('.fine-na');
    expect(noFine).toBeTruthy();
    expect(noFine.textContent).toContain('No fine');
  });

  // ── Disqualification risk ───────────────────────────────────────

  it('shows disqualification section for DUI', async () => {
    const { fixture } = await setup({ violationType: 'dui' });
    const section = fixture.nativeElement.querySelector('.disqualification-section');
    expect(section).toBeTruthy();
  });

  it('shows disqualification section for railroad_crossing', async () => {
    const { fixture } = await setup({ violationType: 'railroad_crossing' });
    expect(fixture.nativeElement.querySelector('.disqualification-section')).toBeTruthy();
  });

  it('shows disqualification section for suspension', async () => {
    const { fixture } = await setup({ violationType: 'suspension' });
    expect(fixture.nativeElement.querySelector('.disqualification-section')).toBeTruthy();
  });

  it('hides disqualification section for speeding', async () => {
    const { fixture } = await setup({ violationType: 'speeding' });
    expect(fixture.nativeElement.querySelector('.disqualification-section')).toBeFalsy();
  });

  it('DUI with hazmat shows 3-year duration', async () => {
    const { component } = await setup({
      violationType: 'dui',
      typeSpecificData: { hazmat_at_time: true },
    });
    expect(component.disqualificationDuration()).toContain('3-year');
  });

  it('DUI without hazmat shows 1-year duration', async () => {
    const { component } = await setup({ violationType: 'dui' });
    expect(component.disqualificationDuration()).toContain('1-year');
  });

  it('railroad_crossing with 1 prior offense shows 120-day', async () => {
    const { component } = await setup({
      violationType: 'railroad_crossing',
      typeSpecificData: { prior_rr_offenses: 1 },
    });
    expect(component.disqualificationDuration()).toContain('120-day');
  });

  it('railroad_crossing first offense shows 60-day', async () => {
    const { component } = await setup({ violationType: 'railroad_crossing' });
    expect(component.disqualificationDuration()).toContain('60-day');
  });

  it('railroad_crossing with 2+ priors shows 1-year', async () => {
    const { component } = await setup({
      violationType: 'railroad_crossing',
      typeSpecificData: { prior_rr_offenses: 2 },
    });
    expect(component.disqualificationDuration()).toContain('1-year');
  });

  it('suspension with disqualification_duration field resolves label', async () => {
    const { component } = await setup({
      violationType: 'suspension',
      typeSpecificData: { disqualification_duration: '120_day' },
    });
    expect(component.disqualificationDuration()).toContain('120-day');
  });

  it('suspension without duration says "depends on history"', async () => {
    const { component } = await setup({ violationType: 'suspension' });
    expect(component.disqualificationDuration()).toContain('depends on violation history');
  });

  // ── License points ──────────────────────────────────────────────

  it('shows points estimate for speeding', async () => {
    const { component } = await setup({ violationType: 'speeding' });
    expect(component.pointsEstimate()).toContain('4');
    expect(component.pointsEstimate()).toContain('6');
  });

  it('shows "Varies by state" for types without estimate', async () => {
    const { component } = await setup({ violationType: 'dot_inspection' });
    expect(component.pointsEstimate()).toBe('Varies by state');
  });

  // ── FMCSA consequences ─────────────────────────────────────────

  it('shows FMCSA section for speeding', async () => {
    const { fixture } = await setup({ violationType: 'speeding' });
    const list = fixture.nativeElement.querySelector('.fmcsa-list');
    expect(list).toBeTruthy();
  });

  it('hides FMCSA section for dot_inspection', async () => {
    const { fixture } = await setup({ violationType: 'dot_inspection' });
    expect(fixture.nativeElement.querySelector('.fmcsa-list')).toBeFalsy();
  });

  // ── Attorney CTA ────────────────────────────────────────────────

  it('renders "Message Your Attorney" when hasAttorney is true', async () => {
    const { fixture } = await setup({ violationType: 'speeding', hasAttorney: true });
    const btn = fixture.nativeElement.querySelector('.btn-cta');
    expect(btn.textContent).toContain('Message Your Attorney');
  });

  it('renders "Learn More" when hasAttorney is false', async () => {
    const { fixture } = await setup({ violationType: 'speeding', hasAttorney: false });
    const btn = fixture.nativeElement.querySelector('.btn-cta-learn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Learn More');
  });

  // ── Graceful handling ───────────────────────────────────────────

  it('handles missing typeSpecificData gracefully', async () => {
    const { fixture } = await setup({ violationType: 'dui' });
    expect(fixture.nativeElement.querySelector('.penalty-card')).toBeTruthy();
  });
});
