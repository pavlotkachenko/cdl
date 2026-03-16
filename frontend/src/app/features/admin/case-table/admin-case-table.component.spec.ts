import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminCaseTableComponent } from './admin-case-table.component';
import { CaseTableRow, DEFAULT_VISIBLE_COLUMNS, ALL_COLUMNS } from '../../shared/case-table/case-table.models';

function makeMockRow(overrides: Partial<CaseTableRow> = {}): CaseTableRow {
  return {
    id: 'c1', case_number: 'CDL-001', customer_name: 'Miguel Santos',
    status: 'reviewed', state: 'TX', violation_type: 'Speeding',
    violation_date: '2026-01-15', court_date: '2026-04-01',
    next_action_date: '2026-03-20', driver_phone: '555-1234',
    customer_type: 'driver', who_sent: 'driver', carrier: 'Swift Transport',
    attorney_name: 'James H.', attorney_price: 350, price_cdl: 150,
    subscriber_paid: true, court_fee: 75, court_fee_paid_by: 'driver',
    operator_name: 'Lisa M.', file_count: 3, ageHours: 48,
    assigned_operator_id: 'op-1', assigned_attorney_id: 'att-1',
    ...overrides,
  };
}

const API_URL = 'http://localhost:3000/api';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [AdminCaseTableComponent, NoopAnimationsModule],
    providers: [
      provideTranslateService(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AdminCaseTableComponent);
  const httpMock = TestBed.inject(HttpTestingController);
  const router = TestBed.inject(Router);
  const snackBar = TestBed.inject(MatSnackBar);
  return { fixture, component: fixture.componentInstance, httpMock, router, snackBar };
}

function flushCasesRequest(httpMock: HttpTestingController, cases: CaseTableRow[] = [makeMockRow()], total = 1) {
  const req = httpMock.expectOne(r => r.url.includes('/admin/cases'));
  req.flush({ cases, total });
}

describe('AdminCaseTableComponent', () => {
  afterEach(() => {
    localStorage.removeItem('admin_case_table_columns');
    localStorage.removeItem('admin_case_table_density');
  });

  it('creates successfully', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);
    expect(component).toBeTruthy();
  });

  it('loads cases on init via adminService.getAllCasesTable', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    const mockRows = [makeMockRow({ id: 'x1' }), makeMockRow({ id: 'x2' })];
    flushCasesRequest(httpMock, mockRows, 2);

    expect(component.cases()).toHaveLength(2);
    expect(component.totalCount()).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it('passes correct default params to API', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    const req = httpMock.expectOne(r => r.url.includes('/admin/cases'));
    expect(req.request.params.get('limit')).toBe('25');
    expect(req.request.params.get('offset')).toBe('0');
    expect(req.request.params.get('sort_by')).toBe('created_at');
    expect(req.request.params.get('sort_dir')).toBe('desc');
    req.flush({ cases: [], total: 0 });
  });

  it('sort change triggers reload with new sort params', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.onSortChange({ active: 'customer_name', direction: 'asc' });
    const req = httpMock.expectOne(r => r.url.includes('/admin/cases'));
    expect(req.request.params.get('sort_by')).toBe('customer_name');
    expect(req.request.params.get('sort_dir')).toBe('asc');
    req.flush({ cases: [], total: 0 });
  });

  it('page change triggers reload with new offset', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.onPageChange({ pageIndex: 2, pageSize: 50 });
    const req = httpMock.expectOne(r => r.url.includes('/admin/cases'));
    expect(req.request.params.get('offset')).toBe('100');
    expect(req.request.params.get('limit')).toBe('50');
    req.flush({ cases: [], total: 0 });
  });

  it('row click navigates to /admin/cases/:id', async () => {
    const { component, httpMock, router } = await setup();
    const spy = vi.spyOn(router, 'navigate');
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.onRowClick(makeMockRow({ id: 'abc-123' }));
    expect(spy).toHaveBeenCalledWith(['/admin/cases', 'abc-123']);
  });

  it('viewDetail navigates to /admin/cases/:id', async () => {
    const { component, httpMock, router } = await setup();
    const spy = vi.spyOn(router, 'navigate');
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.onViewDetail(makeMockRow({ id: 'def-456' }));
    expect(spy).toHaveBeenCalledWith(['/admin/cases', 'def-456']);
  });

  it('status filter change triggers reload with status param', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.onStatusFilterChange(['new', 'reviewed']);
    const req = httpMock.expectOne(r => r.url.includes('/admin/cases'));
    expect(req.request.params.get('status')).toBe('new,reviewed');
    req.flush({ cases: [], total: 0 });
  });

  it('state filter change triggers reload with state param', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.onStateFilterChange(['TX', 'CA']);
    const req = httpMock.expectOne(r => r.url.includes('/admin/cases'));
    expect(req.request.params.get('state')).toBe('TX,CA');
    req.flush({ cases: [], total: 0 });
  });

  it('loads column preferences from localStorage', async () => {
    const savedCols = ['customer_name', 'case_number', 'status', 'state'];
    localStorage.setItem('admin_case_table_columns', JSON.stringify(savedCols));

    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    expect(component.visibleColumns()).toEqual(savedCols);
  });

  it('saves column preferences to localStorage on change', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    const newCols = ['customer_name', 'case_number', 'status', 'state', 'court_date'];
    component.onColumnsChange(newCols);

    const stored = JSON.parse(localStorage.getItem('admin_case_table_columns')!);
    expect(stored).toContain('customer_name');
    expect(stored).toContain('court_date');
  });

  it('density change saves to localStorage', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.onDensityChange('compact');
    expect(component.density()).toBe('compact');
    expect(localStorage.getItem('admin_case_table_density')).toBe('compact');
  });

  it('loads density preference from localStorage', async () => {
    localStorage.setItem('admin_case_table_density', 'comfortable');

    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    expect(component.density()).toBe('comfortable');
  });

  it('loading state is true during request', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    expect(component.loading()).toBe(true);
    flushCasesRequest(httpMock);
    expect(component.loading()).toBe(false);
  });

  it('error handling sets loading to false', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    expect(component.loading()).toBe(true);

    const req = httpMock.expectOne(r => r.url.includes('/admin/cases'));
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(component.loading()).toBe(false);
  });

  it('column toggle updates visibleColumns signal', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.onColumnsChange(['customer_name', 'case_number', 'status', 'attorney_price']);
    // Core columns are always included
    expect(component.visibleColumns()).toContain('customer_name');
    expect(component.visibleColumns()).toContain('attorney_price');
  });

  it('clearAllFilters resets all filters and reloads', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.statusFilter.set(['new']);
    component.stateFilter.set(['TX']);
    component.carrierFilter.set('Swift');
    component.searchTerm.set('test');

    component.clearAllFilters();
    expect(component.statusFilter()).toEqual([]);
    expect(component.stateFilter()).toEqual([]);
    expect(component.carrierFilter()).toBe('');
    expect(component.searchTerm()).toBe('');
    flushCasesRequest(httpMock);
  });

  it('removeFilter removes only the specified status filter', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.statusFilter.set(['new', 'reviewed']);
    component.removeFilter({ type: 'status', label: 'new', value: 'new' });
    expect(component.statusFilter()).toEqual(['reviewed']);
    flushCasesRequest(httpMock);
  });

  it('activeFilters computed shows current filters', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.statusFilter.set(['reviewed']);
    component.stateFilter.set(['TX']);
    component.carrierFilter.set('Swift');

    const filters = component.activeFilters();
    expect(filters).toHaveLength(3);
    expect(filters.find(f => f.type === 'status')?.value).toBe('reviewed');
    expect(filters.find(f => f.type === 'state')?.value).toBe('TX');
    expect(filters.find(f => f.type === 'carrier')?.value).toBe('Swift');
  });

  it('gracefully handles invalid localStorage data', async () => {
    localStorage.setItem('admin_case_table_columns', 'not-valid-json');
    localStorage.setItem('admin_case_table_density', 'invalid_value');

    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    // Should fall back to defaults
    expect(component.visibleColumns()).toEqual(DEFAULT_VISIBLE_COLUMNS);
    expect(component.density()).toBe('default');
  });

  it('clearSearch resets search and reloads', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.searchTerm.set('test');
    component.clearSearch();
    expect(component.searchTerm()).toBe('');
    flushCasesRequest(httpMock);
  });

  // ── CT-6: Responsive / Mobile tests ──

  it('isMobile defaults to false', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);
    expect(component.isMobile()).toBe(false);
  });

  it('formatDate formats valid date strings', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    const result = component.formatDate('2026-04-01T12:00:00Z');
    expect(result).toContain('Apr');
    expect(result).toContain('2026');
  });

  it('formatDate returns em-dash for null', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);
    expect(component.formatDate(null)).toBe('—');
  });
});
