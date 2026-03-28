import { TestBed } from '@angular/core/testing';
import { DisqualificationTimelineComponent } from './disqualification-timeline.component';

async function setup(inputs: Record<string, unknown> = {}) {
  await TestBed.configureTestingModule({
    imports: [DisqualificationTimelineComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(DisqualificationTimelineComponent);
  fixture.componentRef.setInput('violationType', inputs['violationType'] ?? 'dui');
  if ('typeSpecificData' in inputs) fixture.componentRef.setInput('typeSpecificData', inputs['typeSpecificData']);
  if ('violationDate' in inputs) fixture.componentRef.setInput('violationDate', inputs['violationDate']);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('DisqualificationTimelineComponent', () => {
  // ── Visibility ──────────────────────────────────────────────────

  it('renders for dui type', async () => {
    const { fixture } = await setup({ violationType: 'dui' });
    expect(fixture.nativeElement.querySelector('.disqualification-card')).toBeTruthy();
  });

  it('renders for railroad_crossing type', async () => {
    const { fixture } = await setup({ violationType: 'railroad_crossing' });
    expect(fixture.nativeElement.querySelector('.disqualification-card')).toBeTruthy();
  });

  it('renders for suspension type', async () => {
    const { fixture } = await setup({ violationType: 'suspension' });
    expect(fixture.nativeElement.querySelector('.disqualification-card')).toBeTruthy();
  });

  it('hidden for speeding type', async () => {
    const { fixture } = await setup({ violationType: 'speeding' });
    expect(fixture.nativeElement.querySelector('.disqualification-card')).toBeFalsy();
  });

  it('hidden for hos_logbook type', async () => {
    const { fixture } = await setup({ violationType: 'hos_logbook' });
    expect(fixture.nativeElement.querySelector('.disqualification-card')).toBeFalsy();
  });

  it('hidden for other type', async () => {
    const { fixture } = await setup({ violationType: 'other' });
    expect(fixture.nativeElement.querySelector('.disqualification-card')).toBeFalsy();
  });

  // ── DUI duration ────────────────────────────────────────────────

  it('DUI default: 1-year (365 days)', async () => {
    const { component } = await setup({ violationType: 'dui' });
    expect(component.durationText()).toContain('1 year');
  });

  it('DUI with hazmat: 3-year (1095 days)', async () => {
    const { component } = await setup({
      violationType: 'dui',
      typeSpecificData: { hazmat_at_time: true },
    });
    expect(component.durationText()).toContain('3 years');
  });

  it('DUI with prior offense: lifetime', async () => {
    const { component } = await setup({
      violationType: 'dui',
      typeSpecificData: { prior_dui_offenses: 1 },
    });
    expect(component.durationText()).toContain('Lifetime');
  });

  // ── Railroad crossing duration ──────────────────────────────────

  it('railroad first offense: 60 days', async () => {
    const { component } = await setup({ violationType: 'railroad_crossing' });
    expect(component.durationText()).toContain('60 days');
  });

  it('railroad second offense: 120 days', async () => {
    const { component } = await setup({
      violationType: 'railroad_crossing',
      typeSpecificData: { prior_rr_offenses: 1 },
    });
    expect(component.durationText()).toContain('120 days');
  });

  it('railroad third+ offense: 1 year', async () => {
    const { component } = await setup({
      violationType: 'railroad_crossing',
      typeSpecificData: { prior_rr_offenses: 2 },
    });
    expect(component.durationText()).toContain('1 year');
  });

  // ── Suspension duration ─────────────────────────────────────────

  it('suspension reads duration from type_specific_data', async () => {
    const { component } = await setup({
      violationType: 'suspension',
      typeSpecificData: { disqualification_duration: '120_day' },
    });
    expect(component.durationText()).toContain('120 days');
  });

  it('suspension with lifetime shows lifetime text', async () => {
    const { component } = await setup({
      violationType: 'suspension',
      typeSpecificData: { disqualification_duration: 'lifetime' },
    });
    expect(component.durationText()).toContain('Lifetime');
  });

  // ── Timeline nodes ──────────────────────────────────────────────

  it('has at least 3 timeline nodes for DUI', async () => {
    const { component } = await setup({ violationType: 'dui' });
    expect(component.timelineNodes().length).toBeGreaterThanOrEqual(3);
  });

  it('lifetime DUI shows "Lifetime Disqualification" node', async () => {
    const { component } = await setup({
      violationType: 'dui',
      typeSpecificData: { prior_dui_offenses: 1 },
    });
    const labels = component.timelineNodes().map(n => n.label);
    expect(labels).toContain('Lifetime Disqualification');
  });

  it('non-lifetime shows "Reinstatement Eligible" node', async () => {
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 2);
    const { component } = await setup({
      violationType: 'dui',
      violationDate: pastDate.toISOString().slice(0, 10),
    });
    const labels = component.timelineNodes().map(n => n.label);
    expect(labels).toContain('Reinstatement Eligible');
  });

  it('reinstated case shows 4 nodes', async () => {
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 2);
    const { component } = await setup({
      violationType: 'dui',
      violationDate: pastDate.toISOString().slice(0, 10),
      typeSpecificData: { reinstatement_status: 'reinstated' },
    });
    expect(component.timelineNodes().length).toBe(4);
    const labels = component.timelineNodes().map(n => n.label);
    expect(labels).toContain('Reinstatement Complete');
  });

  // ── Timeline has role="list" ────────────────────────────────────

  it('timeline has role="list"', async () => {
    const { fixture } = await setup({ violationType: 'dui' });
    const list = fixture.nativeElement.querySelector('[role="list"]');
    expect(list).toBeTruthy();
  });

  it('timeline items have role="listitem"', async () => {
    const { fixture } = await setup({ violationType: 'dui' });
    const items = fixture.nativeElement.querySelectorAll('[role="listitem"]');
    expect(items.length).toBeGreaterThanOrEqual(3);
  });

  // ── Status badge ────────────────────────────────────────────────

  it('shows "Disqualified" badge for active disqualification', async () => {
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 1);
    const { component } = await setup({
      violationType: 'dui',
      violationDate: recentDate.toISOString().slice(0, 10),
    });
    expect(component.statusBadge().label).toBe('Disqualified');
  });

  it('shows "Reinstated" badge when reinstatement_status is reinstated', async () => {
    const { component } = await setup({
      violationType: 'dui',
      typeSpecificData: { reinstatement_status: 'reinstated' },
    });
    expect(component.statusBadge().label).toBe('Reinstated');
  });

  it('shows "Pending" badge when no violation date', async () => {
    const { component } = await setup({ violationType: 'dui' });
    expect(component.statusBadge().label).toContain('Pending');
  });

  // ── Card class ──────────────────────────────────────────────────

  it('active disqualification gets card-active class', async () => {
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 1);
    const { component } = await setup({
      violationType: 'dui',
      violationDate: recentDate.toISOString().slice(0, 10),
    });
    expect(component.cardClass()).toContain('card-active');
  });

  it('reinstated gets card-reinstated class', async () => {
    const { component } = await setup({
      violationType: 'dui',
      typeSpecificData: { reinstatement_status: 'reinstated' },
    });
    expect(component.cardClass()).toContain('card-reinstated');
  });

  // ── Contested note ──────────────────────────────────────────────

  it('contested note shown for active (non-reinstated, non-eligible) case', async () => {
    const { fixture } = await setup({ violationType: 'dui' });
    const note = fixture.nativeElement.querySelector('.contested-note');
    expect(note).toBeTruthy();
    expect(note.textContent).toContain('successfully contested');
  });

  // ── Reinstatement checklist ─────────────────────────────────────

  it('DUI reinstatement has 5 items', async () => {
    const { component } = await setup({ violationType: 'dui' });
    expect(component.reinstatementItems().length).toBe(5);
  });

  it('DUI reinstatement includes SAP evaluation', async () => {
    const { component } = await setup({ violationType: 'dui' });
    const labels = component.reinstatementItems().map(i => i.label);
    expect(labels.some(l => l.includes('SAP'))).toBe(true);
  });

  it('railroad reinstatement has 3 items', async () => {
    const { component } = await setup({ violationType: 'railroad_crossing' });
    expect(component.reinstatementItems().length).toBe(3);
  });

  it('suspension reinstatement has 3 items', async () => {
    const { component } = await setup({ violationType: 'suspension' });
    expect(component.reinstatementItems().length).toBe(3);
  });

  it('reinstatement list renders in DOM', async () => {
    const { fixture } = await setup({ violationType: 'dui' });
    const list = fixture.nativeElement.querySelector('.reinstatement-list');
    expect(list).toBeTruthy();
    const items = list.querySelectorAll('li');
    expect(items.length).toBe(5);
  });

  // ── Missing violation_date handling ─────────────────────────────

  it('timeline shows "Not set" for offense date when no violationDate', async () => {
    const { component } = await setup({ violationType: 'dui' });
    const nodes = component.timelineNodes();
    expect(nodes[0].date).toBe('Not set');
  });
});
