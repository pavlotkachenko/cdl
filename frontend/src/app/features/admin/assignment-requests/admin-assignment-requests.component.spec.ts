import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi, describe, it, expect } from 'vitest';
import { of, throwError } from 'rxjs';

import { provideTranslateService } from '@ngx-translate/core';
import { AdminAssignmentRequestsComponent } from './admin-assignment-requests.component';
import { AdminService } from '../../../core/services/admin.service';

const MOCK_REQUESTS = [
  {
    id: 'ar-1',
    operator: { id: 'op-1', full_name: 'Lisa Chen' },
    case: { id: 'c1', case_number: 'CDL-610', violation_type: 'Speeding', state: 'TX' },
    status: 'pending',
    created_at: '2026-03-10T14:00:00Z',
  },
  {
    id: 'ar-2',
    operator: { id: 'op-2', full_name: 'James Park' },
    case: { id: 'c2', case_number: 'CDL-611', violation_type: 'Red Light', state: 'CA' },
    status: 'pending',
    created_at: '2026-03-10T15:00:00Z',
  },
];

let adminSpy: {
  getAssignmentRequests: ReturnType<typeof vi.fn>;
  approveAssignmentRequest: ReturnType<typeof vi.fn>;
  rejectAssignmentRequest: ReturnType<typeof vi.fn>;
};
let routerSpy: { navigate: ReturnType<typeof vi.fn> };
let snackSpy: ReturnType<typeof vi.fn>;

async function setup(requests = MOCK_REQUESTS) {
  adminSpy = {
    getAssignmentRequests: vi.fn().mockReturnValue(of({ requests })),
    approveAssignmentRequest: vi.fn().mockReturnValue(of({ success: true, message: 'ok' })),
    rejectAssignmentRequest: vi.fn().mockReturnValue(of({ success: true, message: 'ok' })),
  };
  routerSpy = { navigate: vi.fn() };

  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [AdminAssignmentRequestsComponent, NoopAnimationsModule],
    providers: [
      provideTranslateService(),
      { provide: AdminService, useValue: adminSpy },
      { provide: Router, useValue: routerSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AdminAssignmentRequestsComponent);
  fixture.detectChanges();
  const component = fixture.componentInstance;

  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  snackSpy = vi.spyOn(snackBar, 'open').mockReturnValue(null as any);

  return { fixture, component };
}

describe('AdminAssignmentRequestsComponent', () => {
  it('loads pending requests on init', async () => {
    const { component } = await setup();
    expect(adminSpy.getAssignmentRequests).toHaveBeenCalled();
    expect(component.requests()).toHaveLength(2);
    expect(component.loading()).toBe(false);
  });

  it('pendingCount reflects request list length', async () => {
    const { component } = await setup();
    expect(component.pendingCount()).toBe(2);
  });

  it('renders empty state when no requests', async () => {
    const { fixture } = await setup([]);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty-state')).toBeTruthy();
  });

  it('approve removes request from list', async () => {
    const { component } = await setup();
    component.approve(component.requests()[0]);
    expect(adminSpy.approveAssignmentRequest).toHaveBeenCalledWith('ar-1');
    expect(component.requests()).toHaveLength(1);
    expect(component.requests()[0].id).toBe('ar-2');
  });

  it('reject calls service and removes request', async () => {
    // Mock prompt to return a reason
    vi.stubGlobal('prompt', vi.fn().mockReturnValue('Not available'));
    const { component } = await setup();
    component.reject(component.requests()[0]);
    expect(adminSpy.rejectAssignmentRequest).toHaveBeenCalledWith('ar-1', 'Not available');
    expect(component.requests()).toHaveLength(1);
    vi.unstubAllGlobals();
  });

  it('reject with empty prompt sends no reason', async () => {
    vi.stubGlobal('prompt', vi.fn().mockReturnValue(''));
    const { component } = await setup();
    component.reject(component.requests()[0]);
    expect(adminSpy.rejectAssignmentRequest).toHaveBeenCalledWith('ar-1', undefined);
    vi.unstubAllGlobals();
  });

  it('approve error shows snackbar', async () => {
    adminSpy = {
      getAssignmentRequests: vi.fn().mockReturnValue(of({ requests: MOCK_REQUESTS })),
      approveAssignmentRequest: vi.fn().mockReturnValue(throwError(() => ({
        error: { error: { message: 'Already assigned' } },
      }))),
      rejectAssignmentRequest: vi.fn(),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AdminAssignmentRequestsComponent, NoopAnimationsModule],
      providers: [
        provideTranslateService(),
        { provide: AdminService, useValue: adminSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminAssignmentRequestsComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    const spy = vi.spyOn(snackBar, 'open').mockReturnValue(null as any);

    component.approve(component.requests()[0]);
    expect(spy).toHaveBeenCalledWith('Already assigned', 'OK', expect.any(Object));
  });

  it('goBack navigates to admin dashboard', async () => {
    const { component } = await setup();
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });
});
