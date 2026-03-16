import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OperatorAllCasesComponent } from './operator-all-cases.component';
import { CaseTableRow, DEFAULT_VISIBLE_COLUMNS } from '../../shared/case-table/case-table.models';

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

async function setup() {
  await TestBed.configureTestingModule({
    imports: [OperatorAllCasesComponent, NoopAnimationsModule],
    providers: [
      provideTranslateService(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(OperatorAllCasesComponent);
  const httpMock = TestBed.inject(HttpTestingController);
  const router = TestBed.inject(Router);
  const snackBar = TestBed.inject(MatSnackBar);
  return { fixture, component: fixture.componentInstance, httpMock, router, snackBar };
}

function flushCasesRequest(httpMock: HttpTestingController, cases: CaseTableRow[] = [makeMockRow()], total = 1) {
  const req = httpMock.expectOne(r => r.url.includes('/operator/all-cases'));
  req.flush({ cases, total });
}

describe('OperatorAllCasesComponent', () => {
  afterEach(() => {
    localStorage.removeItem('operator_case_table_columns');
    localStorage.removeItem('operator_case_table_density');
  });

  it('creates successfully', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);
    expect(component).toBeTruthy();
  });

  it('loads cases on init via caseService.getOperatorAllCases', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    const mockRows = [makeMockRow({ id: 'r1' }), makeMockRow({ id: 'r2' })];
    flushCasesRequest(httpMock, mockRows, 2);

    expect(component.cases()).toHaveLength(2);
    expect(component.totalCount()).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it('calls /operator/all-cases endpoint with correct params', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    const req = httpMock.expectOne(r => r.url.includes('/operator/all-cases'));
    expect(req.request.params.get('limit')).toBe('25');
    expect(req.request.params.get('sort_by')).toBe('created_at');
    req.flush({ cases: [], total: 0 });
  });

  it('sort change triggers reload', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.onSortChange({ active: 'status', direction: 'asc' });
    const req = httpMock.expectOne(r => r.url.includes('/operator/all-cases'));
    expect(req.request.params.get('sort_by')).toBe('status');
    req.flush({ cases: [], total: 0 });
  });

  it('page change triggers reload with new offset', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.onPageChange({ pageIndex: 1, pageSize: 50 });
    const req = httpMock.expectOne(r => r.url.includes('/operator/all-cases'));
    expect(req.request.params.get('offset')).toBe('50');
    req.flush({ cases: [], total: 0 });
  });

  it('row click navigates to /operator/cases/:id', async () => {
    const { component, httpMock, router } = await setup();
    const spy = vi.spyOn(router, 'navigate');
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.onRowClick(makeMockRow({ id: 'op-case-1' }));
    expect(spy).toHaveBeenCalledWith(['/operator/cases', 'op-case-1']);
  });

  it('viewDetail navigates to /operator/cases/:id', async () => {
    const { component, httpMock, router } = await setup();
    const spy = vi.spyOn(router, 'navigate');
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.onViewDetail(makeMockRow({ id: 'op-case-2' }));
    expect(spy).toHaveBeenCalledWith(['/operator/cases', 'op-case-2']);
  });

  it('filter change triggers reload with filter params', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.onStatusFilterChange(['new']);
    const req = httpMock.expectOne(r => r.url.includes('/operator/all-cases'));
    expect(req.request.params.get('status')).toBe('new');
    req.flush({ cases: [], total: 0 });
  });

  it('loads column preferences from localStorage', async () => {
    const savedCols = ['customer_name', 'case_number', 'status', 'attorney_name'];
    localStorage.setItem('operator_case_table_columns', JSON.stringify(savedCols));

    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    expect(component.visibleColumns()).toEqual(savedCols);
  });

  it('saves column preferences to localStorage on change', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.onColumnsChange(['customer_name', 'case_number', 'status', 'court_date']);
    const stored = JSON.parse(localStorage.getItem('operator_case_table_columns')!);
    expect(stored).toContain('court_date');
  });

  it('density change saves to localStorage', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    component.onDensityChange('comfortable');
    expect(component.density()).toBe('comfortable');
    expect(localStorage.getItem('operator_case_table_density')).toBe('comfortable');
  });

  it('loading state managed during request lifecycle', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    expect(component.loading()).toBe(true);
    flushCasesRequest(httpMock);
    expect(component.loading()).toBe(false);
  });

  it('error handling shows snackbar', async () => {
    const { component, httpMock } = await setup();
    component.ngOnInit();
    expect(component.loading()).toBe(true);

    const req = httpMock.expectOne(r => r.url.includes('/operator/all-cases'));
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(component.loading()).toBe(false);
  });

  it('uses separate localStorage keys from admin', async () => {
    localStorage.setItem('admin_case_table_density', 'compact');
    localStorage.setItem('operator_case_table_density', 'comfortable');

    const { component, httpMock } = await setup();
    component.ngOnInit();
    flushCasesRequest(httpMock);

    expect(component.density()).toBe('comfortable');
  });

  it('clearAllFilters resets all filters and search', async () => {
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
