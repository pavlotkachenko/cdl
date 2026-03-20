import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { UserManagementComponent } from './user-management.component';
import { AdminService, PlatformUser } from '../../../core/services/admin.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl}/admin`;

const MOCK_USERS: PlatformUser[] = [
  { id: 'u1', name: 'Alice Driver', email: 'alice@test.com', role: 'driver', status: 'active', createdAt: '2026-01-01', lastLogin: '2026-02-01' },
  { id: 'u2', name: 'Bob Carrier', email: 'bob@test.com', role: 'carrier', status: 'suspended', createdAt: '2026-01-15', lastLogin: null },
  { id: 'u3', name: 'Carol Attorney', email: 'carol@test.com', role: 'attorney', status: 'pending', createdAt: '2026-02-01', lastLogin: null },
];

describe('UserManagementComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<UserManagementComponent>>;
  let component: UserManagementComponent;
  let http: HttpTestingController;
  let snackBar: MatSnackBar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserManagementComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideTranslateService(),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    snackBar = TestBed.inject(MatSnackBar);
    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
  });

  function flushUsers(users = MOCK_USERS) {
    const req = http.expectOne(`${BASE}/users`);
    req.flush({ users });
    fixture.detectChanges();
  }

  it('loads users on init', () => {
    fixture.detectChanges();
    flushUsers();
    expect(component.users()).toHaveLength(3);
    expect(component.loading()).toBe(false);
  });

  it('shows loading spinner while fetching', () => {
    fixture.detectChanges();
    expect(component.loading()).toBe(true);
    flushUsers();
    expect(component.loading()).toBe(false);
  });

  it('filteredUsers() returns all users when no filter set', () => {
    fixture.detectChanges();
    flushUsers();
    expect(component.filteredUsers()).toHaveLength(3);
  });

  it('filteredUsers() filters by search term (name match)', () => {
    fixture.detectChanges();
    flushUsers();
    component.searchTerm.set('alice');
    expect(component.filteredUsers()).toHaveLength(1);
    expect(component.filteredUsers()[0].id).toBe('u1');
  });

  it('filteredUsers() filters by role', () => {
    fixture.detectChanges();
    flushUsers();
    component.roleFilter.set('driver');
    expect(component.filteredUsers()).toHaveLength(1);
    expect(component.filteredUsers()[0].role).toBe('driver');
  });

  it('filteredUsers() filters by status', () => {
    fixture.detectChanges();
    flushUsers();
    component.statusFilter.set('pending');
    expect(component.filteredUsers()).toHaveLength(1);
    expect(component.filteredUsers()[0].status).toBe('pending');
  });

  it('clearFilters() resets all filters', () => {
    fixture.detectChanges();
    flushUsers();
    component.searchTerm.set('bob');
    component.roleFilter.set('carrier');
    component.statusFilter.set('suspended');
    component.clearFilters();
    expect(component.searchTerm()).toBe('');
    expect(component.roleFilter()).toBe('all');
    expect(component.statusFilter()).toBe('all');
  });

  it('toggleInvite() shows and hides invite panel', () => {
    fixture.detectChanges();
    flushUsers();
    expect(component.showInvite()).toBe(false);
    component.toggleInvite();
    expect(component.showInvite()).toBe(true);
    component.toggleInvite();
    expect(component.showInvite()).toBe(false);
  });

  it('sendInvite() posts invite and reloads users', () => {
    fixture.detectChanges();
    flushUsers();

    component.showInvite.set(true);
    component.inviteForm.setValue({ email: 'new@test.com', role: 'driver' });
    component.sendInvite();

    const inviteReq = http.expectOne(`${BASE}/users/invite`);
    expect(inviteReq.request.method).toBe('POST');
    expect(inviteReq.request.body).toEqual({ email: 'new@test.com', role: 'driver' });
    inviteReq.flush({ user: { id: 'u-new', email: 'new@test.com', role: 'driver', status: 'pending', name: 'new@test.com', createdAt: '2026-03-01' } });

    // reload triggered
    flushUsers([...MOCK_USERS, { id: 'u-new', email: 'new@test.com', role: 'driver', status: 'pending', name: 'new@test.com', createdAt: '2026-03-01', lastLogin: null }]);
    expect(component.showInvite()).toBe(false);
  });

  it('suspend() calls PATCH suspend and reloads', () => {
    fixture.detectChanges();
    flushUsers();

    const user = component.users()[0];
    component.suspend(user);

    const req = http.expectOne(`${BASE}/users/${user.id}/suspend`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ user: { id: user.id, status: 'suspended' } });

    flushUsers();
  });

  it('unsuspend() calls PATCH unsuspend and reloads', () => {
    fixture.detectChanges();
    flushUsers();

    const user = component.users()[1]; // Bob, status=suspended
    component.unsuspend(user);

    const req = http.expectOne(`${BASE}/users/${user.id}/unsuspend`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ user: { id: user.id, status: 'active' } });

    flushUsers();
  });

  it('getInitials() returns correct initials', () => {
    expect(component.getInitials('Alice Driver')).toBe('AD');
    expect(component.getInitials('Bob')).toBe('BO');
    expect(component.getInitials('')).toBe('?');
  });
});
