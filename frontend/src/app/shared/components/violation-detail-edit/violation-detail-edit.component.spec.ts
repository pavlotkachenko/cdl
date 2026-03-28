import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ViolationDetailEditComponent, ViolationDetailSaveEvent } from './violation-detail-edit.component';

async function setup(inputs: Record<string, unknown> = {}) {
  await TestBed.configureTestingModule({
    imports: [ViolationDetailEditComponent, NoopAnimationsModule],
  }).compileComponents();

  const fixture = TestBed.createComponent(ViolationDetailEditComponent);
  fixture.componentRef.setInput('violationType', inputs['violationType'] ?? 'speeding');
  fixture.componentRef.setInput('caseId', inputs['caseId'] ?? 'case-1');
  if ('typeSpecificData' in inputs) fixture.componentRef.setInput('typeSpecificData', inputs['typeSpecificData']);
  if ('violationRegulationCode' in inputs) fixture.componentRef.setInput('violationRegulationCode', inputs['violationRegulationCode']);
  if ('violationSeverity' in inputs) fixture.componentRef.setInput('violationSeverity', inputs['violationSeverity']);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('ViolationDetailEditComponent', () => {
  // ── Read-only mode ──────────────────────────────────────────────

  it('renders in read-only mode by default', async () => {
    const { fixture } = await setup({ violationType: 'speeding' });
    expect(fixture.nativeElement.querySelector('.edit-btn')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('form')).toBeFalsy();
  });

  it('shows violation type label in read-only mode', async () => {
    const { fixture } = await setup({ violationType: 'speeding' });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Speeding');
  });

  it('shows severity in read-only mode when provided', async () => {
    const { fixture } = await setup({
      violationType: 'speeding',
      violationSeverity: 'serious',
    });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('serious');
  });

  it('shows regulation code in read-only mode when provided', async () => {
    const { fixture } = await setup({
      violationType: 'speeding',
      violationRegulationCode: '49 CFR 392.2',
    });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('49 CFR 392.2');
  });

  it('shows type-specific data fields in read-only mode', async () => {
    const { fixture } = await setup({
      violationType: 'speeding',
      typeSpecificData: { alleged_speed: 82, posted_speed_limit: 65 },
    });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('82');
    expect(text).toContain('65');
  });

  it('shows "No violation details available" when config is null', async () => {
    const { fixture } = await setup({ violationType: 'nonexistent_xyz' });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('No violation details available');
  });

  // ── Edit mode ───────────────────────────────────────────────────

  it('enters edit mode on edit button click', async () => {
    const { fixture, component } = await setup({ violationType: 'speeding' });
    component.startEdit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
  });

  it('edit mode shows violation type selector', async () => {
    const { fixture, component } = await setup({ violationType: 'speeding' });
    component.startEdit();
    fixture.detectChanges();
    const selects = fixture.nativeElement.querySelectorAll('mat-select');
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it('edit mode shows severity selector', async () => {
    const { fixture, component } = await setup({ violationType: 'speeding' });
    component.startEdit();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Severity');
  });

  it('edit mode shows regulation code input', async () => {
    const { fixture, component } = await setup({ violationType: 'speeding' });
    component.startEdit();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Regulation Code');
  });

  it('edit mode renders conditional fields for speeding', async () => {
    const { fixture, component } = await setup({
      violationType: 'speeding',
      typeSpecificData: { alleged_speed: 82 },
    });
    component.startEdit();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Alleged Speed');
  });

  // ── Cancel ──────────────────────────────────────────────────────

  it('cancel exits edit mode', async () => {
    const { fixture, component } = await setup({ violationType: 'speeding' });
    component.startEdit();
    fixture.detectChanges();
    expect(component.editing()).toBe(true);

    component.cancelEdit();
    fixture.detectChanges();
    expect(component.editing()).toBe(false);
    expect(fixture.nativeElement.querySelector('form')).toBeFalsy();
  });

  // ── Save ────────────────────────────────────────────────────────

  it('save emits ViolationDetailSaveEvent', async () => {
    const { component } = await setup({
      violationType: 'speeding',
      typeSpecificData: { alleged_speed: 82 },
    });
    component.startEdit();

    const emitted: ViolationDetailSaveEvent[] = [];
    component.saved.subscribe(e => emitted.push(e));

    component.save();
    expect(emitted.length).toBe(1);
    expect(emitted[0].type_specific_data).toBeDefined();
  });

  it('save includes changed regulation code', async () => {
    const { component } = await setup({
      violationType: 'speeding',
      violationRegulationCode: '49 CFR 392.2',
    });
    component.startEdit();
    component.editForm.patchValue({ violation_regulation_code: '49 CFR 395.3' });

    const emitted: ViolationDetailSaveEvent[] = [];
    component.saved.subscribe(e => emitted.push(e));

    component.save();
    expect(emitted[0].violation_regulation_code).toBe('49 CFR 395.3');
  });

  it('save omits unchanged regulation code', async () => {
    const { component } = await setup({
      violationType: 'speeding',
      violationRegulationCode: '49 CFR 392.2',
    });
    component.startEdit();

    const emitted: ViolationDetailSaveEvent[] = [];
    component.saved.subscribe(e => emitted.push(e));

    component.save();
    expect(emitted[0].violation_regulation_code).toBeUndefined();
  });

  it('saving flag prevents double-submit', async () => {
    const { component } = await setup({ violationType: 'speeding' });
    component.startEdit();
    component.saving.set(true);

    const emitted: ViolationDetailSaveEvent[] = [];
    component.saved.subscribe(e => emitted.push(e));
    component.save();
    expect(emitted.length).toBe(0);
  });

  // ── Callbacks ───────────────────────────────────────────────────

  it('onSaveComplete exits edit mode and clears saving', async () => {
    const { component } = await setup({ violationType: 'speeding' });
    component.startEdit();
    component.saving.set(true);

    component.onSaveComplete();
    expect(component.saving()).toBe(false);
    expect(component.editing()).toBe(false);
  });

  it('onSaveError clears saving but stays in edit mode', async () => {
    const { component } = await setup({ violationType: 'speeding' });
    component.startEdit();
    component.saving.set(true);

    component.onSaveError();
    expect(component.saving()).toBe(false);
    expect(component.editing()).toBe(true);
  });

  // ── Format value helper ─────────────────────────────────────────

  it('formatValue returns "Yes" for boolean true', async () => {
    const { component } = await setup();
    const field = { key: 'test', label: 'Test', type: 'boolean' as const, required: false };
    expect(component.formatValue(field, true)).toBe('Yes');
  });

  it('formatValue returns "No" for boolean false', async () => {
    const { component } = await setup();
    const field = { key: 'test', label: 'Test', type: 'boolean' as const, required: false };
    expect(component.formatValue(field, false)).toBe('No');
  });

  it('formatValue returns "Not set" for null', async () => {
    const { component } = await setup();
    const field = { key: 'test', label: 'Test', type: 'text' as const, required: false };
    expect(component.formatValue(field, null)).toBe('Not set');
  });

  it('formatValue formats numbers with locale string', async () => {
    const { component } = await setup();
    const field = { key: 'test', label: 'Test', type: 'number' as const, required: false };
    expect(component.formatValue(field, 1234)).toBe('1,234');
  });

  it('formatValue resolves select option labels', async () => {
    const { component } = await setup();
    const field = {
      key: 'test', label: 'Test', type: 'select' as const, required: false,
      options: [{ value: 'radar', label: 'Radar' }],
    };
    expect(component.formatValue(field, 'radar')).toBe('Radar');
  });
});
