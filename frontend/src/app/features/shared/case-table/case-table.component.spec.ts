import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService, TranslateModule } from '@ngx-translate/core';
import { CaseTableComponent } from './case-table.component';
import { CaseTableRow, ALL_COLUMNS, DEFAULT_VISIBLE_COLUMNS } from './case-table.models';

function makeMockRow(overrides: Partial<CaseTableRow> = {}): CaseTableRow {
  return {
    id: 'c1',
    case_number: 'CDL-001',
    customer_name: 'Miguel Santos',
    status: 'reviewed',
    state: 'TX',
    violation_type: 'Speeding',
    violation_date: '2026-01-15',
    court_date: '2026-04-01',
    next_action_date: '2026-03-20',
    driver_phone: '555-1234',
    customer_type: 'driver',
    who_sent: 'driver',
    carrier: 'Swift Transport',
    attorney_name: 'James H.',
    attorney_price: 350,
    price_cdl: 150,
    subscriber_paid: true,
    court_fee: 75,
    court_fee_paid_by: 'driver',
    operator_name: 'Lisa M.',
    file_count: 3,
    ageHours: 48,
    assigned_operator_id: 'op-1',
    assigned_attorney_id: 'att-1',
    ...overrides,
  };
}

async function setup(rows: CaseTableRow[] = [makeMockRow()], extras: Record<string, unknown> = {}) {
  await TestBed.configureTestingModule({
    imports: [CaseTableComponent, NoopAnimationsModule],
    providers: [provideTranslateService()],
  }).compileComponents();

  const fixture = TestBed.createComponent(CaseTableComponent);
  fixture.componentRef.setInput('cases', rows);
  fixture.componentRef.setInput('totalCount', rows.length);
  for (const [key, val] of Object.entries(extras)) {
    fixture.componentRef.setInput(key, val);
  }
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('CaseTableComponent', () => {
  it('renders correct number of rows from input data', async () => {
    const rows = [makeMockRow({ id: 'c1' }), makeMockRow({ id: 'c2', case_number: 'CDL-002' })];
    const { fixture } = await setup(rows);
    const dataRows = fixture.nativeElement.querySelectorAll('tr.case-row');
    expect(dataRows.length).toBe(2);
  });

  it('renders only columns listed in visibleColumns input (plus expand column)', async () => {
    const cols = ['customer_name', 'case_number', 'status'];
    const { fixture } = await setup([makeMockRow()], { visibleColumns: cols });
    const headers = fixture.nativeElement.querySelectorAll('th.mat-mdc-header-cell');
    // 3 data columns + 1 expand column = 4
    expect(headers.length).toBe(4);
  });

  it('uses DEFAULT_VISIBLE_COLUMNS when visibleColumns not provided', async () => {
    const { component } = await setup();
    expect(component.displayedColumns()).toEqual(DEFAULT_VISIBLE_COLUMNS);
  });

  it('sticky columns (customer_name, case_number) are marked sticky in definitions', async () => {
    const { component } = await setup();
    const customerDef = component.getColumnDef('customer_name');
    const caseDef = component.getColumnDef('case_number');
    expect(customerDef?.sticky).toBe(true);
    expect(caseDef?.sticky).toBe(true);
  });

  it('sort header click emits sortChange output', async () => {
    const { component } = await setup();
    const emitted: { active: string; direction: string }[] = [];
    component.sortChange.subscribe(v => emitted.push(v));

    component.onSortChange({ active: 'customer_name', direction: 'asc' });
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual({ active: 'customer_name', direction: 'asc' });
  });

  it('paginator page change emits pageChange output', async () => {
    const { component } = await setup();
    const emitted: { pageIndex: number; pageSize: number }[] = [];
    component.pageChange.subscribe(v => emitted.push(v));

    component.onPageChange({ pageIndex: 2, pageSize: 50, length: 100 });
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual({ pageIndex: 2, pageSize: 50 });
  });

  it('row click emits rowClick output', async () => {
    const row = makeMockRow();
    const { component } = await setup([row]);
    const emitted: CaseTableRow[] = [];
    component.rowClick.subscribe(v => emitted.push(v));

    component.onRowClicked(row);
    expect(emitted).toHaveLength(1);
    expect(emitted[0].id).toBe('c1');
  });

  it('row keyboard Enter emits rowClick output', async () => {
    const row = makeMockRow();
    const { fixture } = await setup([row]);
    const emitted: CaseTableRow[] = [];
    fixture.componentInstance.rowClick.subscribe((v: CaseTableRow) => emitted.push(v));

    const dataRow = fixture.nativeElement.querySelector('tr.case-row');
    dataRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(emitted).toHaveLength(1);
  });

  it('currency columns format as $X.XX', async () => {
    const { component } = await setup();
    expect(component.formatCurrency(350)).toBe('$350.00');
    expect(component.formatCurrency(1234.5)).toBe('$1,234.50');
    expect(component.formatCurrency(null)).toBe('—');
  });

  it('date columns format correctly', async () => {
    const { component } = await setup();
    // Use ISO datetime to avoid timezone shift from date-only strings
    const result = component.formatDate('2026-01-15T12:00:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('2026');
    expect(component.formatDate(null)).toBe('—');
    expect(component.formatDate('')).toBe('—');
  });

  it('boolean columns render check/cancel icons in DOM', async () => {
    const allCols = ALL_COLUMNS.map(c => c.key);
    const { fixture } = await setup([makeMockRow({ subscriber_paid: true })], { visibleColumns: allCols });
    const icons = fixture.nativeElement.querySelectorAll('.bool-yes');
    expect(icons.length).toBeGreaterThanOrEqual(1);
  });

  it('status column shows chip with status class', async () => {
    const { fixture } = await setup([makeMockRow({ status: 'reviewed' })]);
    const chip = fixture.nativeElement.querySelector('.status-reviewed');
    expect(chip).toBeTruthy();
  });

  it('file count column shows icon + number', async () => {
    const allCols = ALL_COLUMNS.map(c => c.key);
    const { fixture } = await setup([makeMockRow({ file_count: 5 })], { visibleColumns: allCols });
    const fileCount = fixture.nativeElement.querySelector('.file-count');
    expect(fileCount).toBeTruthy();
    expect(fileCount.textContent).toContain('5');
  });

  it('no data message shown when cases is empty', async () => {
    const { fixture } = await setup([]);
    const noData = fixture.nativeElement.querySelector('.no-data');
    expect(noData).toBeTruthy();
  });

  it('loading overlay shown when loading=true', async () => {
    const { fixture } = await setup([], { loading: true });
    const overlay = fixture.nativeElement.querySelector('.loading-overlay');
    expect(overlay).toBeTruthy();
  });

  it('loading overlay hidden when loading=false', async () => {
    const { fixture } = await setup([makeMockRow()], { loading: false });
    const overlay = fixture.nativeElement.querySelector('.loading-overlay');
    expect(overlay).toBeFalsy();
  });

  it('density class applied to container', async () => {
    const { fixture } = await setup([], { density: 'compact' });
    const container = fixture.nativeElement.querySelector('.density-compact');
    expect(container).toBeTruthy();
  });

  it('phone column shows dash for null value', async () => {
    const allCols = ALL_COLUMNS.map(c => c.key);
    const { fixture } = await setup([makeMockRow({ driver_phone: null })], { visibleColumns: allCols });
    fixture.detectChanges();
    const cells = fixture.nativeElement.querySelectorAll('td.mat-mdc-cell');
    // +1 offset for the expand column prepended before data columns
    const phoneIdx = allCols.indexOf('driver_phone') + 1;
    if (phoneIdx > 0 && cells[phoneIdx]) {
      expect(cells[phoneIdx].textContent.trim()).toBe('—');
    }
  });

  it('null/undefined values render as em-dash', async () => {
    const { component } = await setup();
    expect(component.formatCurrency(null)).toBe('—');
    expect(component.formatDate(null)).toBe('—');
  });

  it('displayedColumns computed filters invalid keys', async () => {
    const { component } = await setup([], { visibleColumns: ['customer_name', 'INVALID_KEY', 'status'] });
    expect(component.displayedColumns()).toEqual(['customer_name', 'status']);
  });

  it('paginator shows correct total count', async () => {
    const { fixture } = await setup([makeMockRow()], { totalCount: 42 });
    const paginator = fixture.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeTruthy();
    // The paginator component receives totalCount via input binding
    expect(fixture.componentInstance.totalCount()).toBe(42);
  });

  it('rows have tabindex=0 for keyboard navigation', async () => {
    const { fixture } = await setup([makeMockRow()]);
    const row = fixture.nativeElement.querySelector('tr.case-row');
    expect(row.getAttribute('tabindex')).toBe('0');
  });

  it('rows have aria-label with case number', async () => {
    const { fixture } = await setup([makeMockRow({ case_number: 'CDL-042' })]);
    const row = fixture.nativeElement.querySelector('tr.case-row');
    const ariaLabel = row.getAttribute('aria-label');
    expect(ariaLabel).toContain('CDL-042');
  });

  // ── Expandable row detail tests (CT-4) ──

  it('expand icon column is rendered in header', async () => {
    const { fixture } = await setup([makeMockRow()]);
    const expandHeader = fixture.nativeElement.querySelector('th.expand-cell');
    expect(expandHeader).toBeTruthy();
  });

  it('expand button is rendered for each data row', async () => {
    const rows = [makeMockRow({ id: 'r1' }), makeMockRow({ id: 'r2', case_number: 'CDL-002' })];
    const { fixture } = await setup(rows);
    const expandBtns = fixture.nativeElement.querySelectorAll('td.expand-cell button');
    expect(expandBtns.length).toBe(2);
  });

  it('clicking expand shows detail panel', async () => {
    const row = makeMockRow();
    const { fixture, component } = await setup([row]);
    component.toggleExpand(row, new Event('click'));
    fixture.detectChanges();
    expect(component.expandedRowId()).toBe(row.id);
    const detail = fixture.nativeElement.querySelector('.expanded-detail');
    expect(detail).toBeTruthy();
  });

  it('clicking expand again collapses the panel', async () => {
    const row = makeMockRow();
    const { fixture, component } = await setup([row]);
    component.toggleExpand(row, new Event('click'));
    fixture.detectChanges();
    expect(component.expandedRowId()).toBe(row.id);

    component.toggleExpand(row, new Event('click'));
    fixture.detectChanges();
    expect(component.expandedRowId()).toBeNull();
    const detail = fixture.nativeElement.querySelector('.expanded-detail');
    expect(detail).toBeFalsy();
  });

  it('only one row can be expanded at a time', async () => {
    const row1 = makeMockRow({ id: 'r1' });
    const row2 = makeMockRow({ id: 'r2', case_number: 'CDL-002' });
    const { fixture, component } = await setup([row1, row2]);

    component.toggleExpand(row1, new Event('click'));
    fixture.detectChanges();
    expect(component.expandedRowId()).toBe('r1');

    component.toggleExpand(row2, new Event('click'));
    fixture.detectChanges();
    expect(component.expandedRowId()).toBe('r2');
  });

  it('detail panel shows all 19 column fields', async () => {
    const row = makeMockRow();
    const { fixture, component } = await setup([row]);
    component.toggleExpand(row, new Event('click'));
    fixture.detectChanges();

    const detailItems = fixture.nativeElement.querySelectorAll('.detail-item');
    expect(detailItems.length).toBe(ALL_COLUMNS.length);
  });

  it('View Full Detail button emits viewDetail', async () => {
    const row = makeMockRow();
    const { fixture, component } = await setup([row]);
    const emitted: CaseTableRow[] = [];
    component.viewDetail.subscribe(v => emitted.push(v));

    component.toggleExpand(row, new Event('click'));
    fixture.detectChanges();

    component.onViewDetail(row);
    expect(emitted).toHaveLength(1);
    expect(emitted[0].id).toBe(row.id);
  });

  it('expand button has aria-expanded attribute', async () => {
    const row = makeMockRow();
    const { fixture, component } = await setup([row]);
    const btn = fixture.nativeElement.querySelector('td.expand-cell button');
    expect(btn.getAttribute('aria-expanded')).toBe('false');

    component.toggleExpand(row, new Event('click'));
    fixture.detectChanges();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  // ── Scroll detection tests (CT-6) ──

  it('hasOverflow defaults to false', async () => {
    const { component } = await setup([makeMockRow()]);
    expect(component.hasOverflow()).toBe(false);
  });

  it('hasScrolled defaults to false', async () => {
    const { component } = await setup([makeMockRow()]);
    expect(component.hasScrolled()).toBe(false);
  });

  it('onScroll sets hasScrolled to true', async () => {
    const { component } = await setup([makeMockRow()]);
    component.onScroll();
    expect(component.hasScrolled()).toBe(true);
  });

  it('onScroll only sets hasScrolled once (idempotent)', async () => {
    const { component } = await setup([makeMockRow()]);
    component.onScroll();
    component.onScroll();
    expect(component.hasScrolled()).toBe(true);
  });

  it('scroll hint hidden when no overflow', async () => {
    const { fixture } = await setup([makeMockRow()]);
    const hint = fixture.nativeElement.querySelector('.scroll-hint');
    expect(hint).toBeFalsy();
  });

  it('scroll wrapper element exists in DOM', async () => {
    const { fixture } = await setup([makeMockRow()]);
    const wrapper = fixture.nativeElement.querySelector('.table-scroll-wrapper');
    expect(wrapper).toBeTruthy();
  });
});
