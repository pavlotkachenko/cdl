import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { ColumnToggleComponent } from './column-toggle.component';
import { ALL_COLUMNS, DEFAULT_VISIBLE_COLUMNS, COLUMN_GROUPS } from './case-table.models';

async function setup(visibleKeys: string[] = [...DEFAULT_VISIBLE_COLUMNS]) {
  await TestBed.configureTestingModule({
    imports: [ColumnToggleComponent, NoopAnimationsModule],
    providers: [provideTranslateService()],
  }).compileComponents();

  const fixture = TestBed.createComponent(ColumnToggleComponent);
  fixture.componentRef.setInput('allColumns', ALL_COLUMNS);
  fixture.componentRef.setInput('visibleKeys', visibleKeys);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('ColumnToggleComponent', () => {
  it('creates successfully', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('exposes all 6 column groups in order', async () => {
    const { component } = await setup();
    expect(component.orderedGroups).toEqual(COLUMN_GROUPS);
    expect(component.orderedGroups).toHaveLength(6);
  });

  it('getGroupColumns returns columns for a specific group', async () => {
    const { component } = await setup();
    const core = component.getGroupColumns('core');
    expect(core).toHaveLength(3);
    expect(core.map(c => c.key)).toEqual(['customer_name', 'case_number', 'status']);
  });

  it('core group checkboxes are disabled (isGroupAllChecked returns true for core)', async () => {
    const { component } = await setup();
    // Core columns are in DEFAULT_VISIBLE_COLUMNS
    expect(component.isGroupAllChecked('core')).toBe(true);
  });

  it('isVisible returns true for visible keys', async () => {
    const { component } = await setup(['customer_name', 'status']);
    expect(component.isVisible('customer_name')).toBe(true);
    expect(component.isVisible('status')).toBe(true);
    expect(component.isVisible('driver_phone')).toBe(false);
  });

  it('toggleColumn emits updated array with column removed', async () => {
    const { component } = await setup(['customer_name', 'case_number', 'status', 'state']);
    const emitted: string[][] = [];
    component.columnsChange.subscribe(v => emitted.push(v));

    component.toggleColumn('state');
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).not.toContain('state');
    expect(emitted[0]).toContain('customer_name');
  });

  it('toggleColumn emits updated array with column added', async () => {
    const { component } = await setup(['customer_name', 'case_number', 'status']);
    const emitted: string[][] = [];
    component.columnsChange.subscribe(v => emitted.push(v));

    component.toggleColumn('driver_phone');
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toContain('driver_phone');
  });

  it('toggleGroup checks all columns when none are checked', async () => {
    // Start with only core columns visible (no financial)
    const { component } = await setup(['customer_name', 'case_number', 'status']);
    const emitted: string[][] = [];
    component.columnsChange.subscribe(v => emitted.push(v));

    component.toggleGroup('financial');
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toContain('attorney_price');
    expect(emitted[0]).toContain('price_cdl');
    expect(emitted[0]).toContain('subscriber_paid');
    expect(emitted[0]).toContain('court_fee');
    expect(emitted[0]).toContain('court_fee_paid_by');
  });

  it('toggleGroup unchecks all columns when all are checked', async () => {
    const financialKeys = ALL_COLUMNS.filter(c => c.group === 'financial').map(c => c.key);
    const { component } = await setup([...DEFAULT_VISIBLE_COLUMNS, ...financialKeys]);
    const emitted: string[][] = [];
    component.columnsChange.subscribe(v => emitted.push(v));

    component.toggleGroup('financial');
    expect(emitted).toHaveLength(1);
    for (const k of financialKeys) {
      expect(emitted[0]).not.toContain(k);
    }
  });

  it('toggleGroup on core is a no-op', async () => {
    const { component } = await setup();
    const emitted: string[][] = [];
    component.columnsChange.subscribe(v => emitted.push(v));

    component.toggleGroup('core');
    expect(emitted).toHaveLength(0);
  });

  it('isGroupAllChecked returns false when no columns in group are visible', async () => {
    const { component } = await setup(['customer_name', 'case_number', 'status']);
    expect(component.isGroupAllChecked('financial')).toBe(false);
  });

  it('isGroupIndeterminate returns true when partially checked', async () => {
    const { component } = await setup([...DEFAULT_VISIBLE_COLUMNS, 'attorney_price']);
    expect(component.isGroupIndeterminate('financial')).toBe(true);
  });

  it('isGroupIndeterminate returns false when all checked', async () => {
    const financialKeys = ALL_COLUMNS.filter(c => c.group === 'financial').map(c => c.key);
    const { component } = await setup([...DEFAULT_VISIBLE_COLUMNS, ...financialKeys]);
    expect(component.isGroupIndeterminate('financial')).toBe(false);
  });

  it('isGroupIndeterminate returns false when none checked', async () => {
    const { component } = await setup(['customer_name', 'case_number', 'status']);
    expect(component.isGroupIndeterminate('financial')).toBe(false);
  });

  it('resetToDefaults emits DEFAULT_VISIBLE_COLUMNS', async () => {
    const allKeys = ALL_COLUMNS.map(c => c.key);
    const { component } = await setup(allKeys);
    const emitted: string[][] = [];
    component.columnsChange.subscribe(v => emitted.push(v));

    component.resetToDefaults();
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual(DEFAULT_VISIBLE_COLUMNS);
  });

  it('group labels use i18n keys', async () => {
    const { component } = await setup();
    expect(component.groupLabels['core']).toBe('TABLE.GROUP_CORE');
    expect(component.groupLabels['financial']).toBe('TABLE.GROUP_FINANCIAL');
  });

  it('toggle button has aria-label', async () => {
    const { fixture } = await setup();
    const btn = fixture.nativeElement.querySelector('button[mat-icon-button]');
    expect(btn.getAttribute('aria-label')).toBeTruthy();
  });

  it('renders view_column icon on trigger button', async () => {
    const { fixture } = await setup();
    const icon = fixture.nativeElement.querySelector('button[mat-icon-button] mat-icon');
    expect(icon.textContent.trim()).toBe('view_column');
  });
});
