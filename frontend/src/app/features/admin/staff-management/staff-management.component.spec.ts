import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { StaffManagementComponent } from './staff-management.component';
import { AdminService, StaffMember } from '../../../core/services/admin.service';
import { MatSnackBar } from '@angular/material/snack-bar';

const MOCK_STAFF: StaffMember[] = [
  {
    id: 's1', name: 'Alice Attorney', email: 'alice@test.com', role: 'attorney',
    activeCases: 5, totalCases: 30, successRate: 92, avgResolutionTime: 12,
    joinedDate: new Date('2024-06-01'), status: 'active',
  },
  {
    id: 's2', name: 'Bob Paralegal', email: 'bob@test.com', role: 'paralegal',
    activeCases: 2, totalCases: 15, successRate: 85, avgResolutionTime: 18,
    joinedDate: new Date('2025-01-01'), status: 'inactive',
  },
];

function makeServiceSpy() {
  return {
    getAllStaff: vi.fn().mockReturnValue(of(MOCK_STAFF)),
    updateStaffMember: vi.fn().mockReturnValue(of(null)),
    deleteStaffMember: vi.fn().mockReturnValue(of(null)),
  };
}

async function setup(spy = makeServiceSpy()) {
  const routerSpy = { navigate: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [StaffManagementComponent, NoopAnimationsModule],
    providers: [
      provideTranslateService(),
      { provide: AdminService, useValue: spy },
      { provide: Router, useValue: routerSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(StaffManagementComponent);
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, spy, router: routerSpy, snackBar };
}

describe('StaffManagementComponent', () => {
  it('loads staff on init', async () => {
    const { component } = await setup();
    expect(component.staff().length).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it('filteredStaff is computed from searchTerm', async () => {
    const { component } = await setup();
    component.searchTerm.set('alice');
    expect(component.filteredStaff().length).toBe(1);
    expect(component.filteredStaff()[0].id).toBe('s1');
  });

  it('filteredStaff is computed from roleFilter', async () => {
    const { component } = await setup();
    component.roleFilter.set('paralegal');
    expect(component.filteredStaff().length).toBe(1);
    expect(component.filteredStaff()[0].id).toBe('s2');
  });

  it('updateStatus calls service and shows snackBar', async () => {
    const { component, spy, snackBar } = await setup();
    component.updateStatus(MOCK_STAFF[1], 'active');
    expect(spy.updateStaffMember).toHaveBeenCalledWith('s2', { status: 'active' });
    expect(snackBar.open).toHaveBeenCalledWith('Status updated.', 'Close', expect.any(Object));
  });

  it('getInitials extracts up to 2 initials from a name', async () => {
    const { component } = await setup();
    expect(component.getInitials('Alice Attorney')).toBe('AA');
    expect(component.getInitials('Bob')).toBe('B');
  });
});
