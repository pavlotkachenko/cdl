import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AdminService } from './admin.service';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/admin`;

describe('AdminService — user management', () => {
  let service: AdminService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('getAllUsers() calls GET /admin/users', () => {
    service.getAllUsers().subscribe(r => expect(r.users).toHaveLength(1));
    const req = controller.expectOne(`${BASE}/users`);
    expect(req.request.method).toBe('GET');
    req.flush({ users: [{ id: 'u1', name: 'Alice', email: 'a@t.com', role: 'driver', status: 'active', createdAt: '2026-01-01' }] });
  });

  it('getAllUsers() passes role and status as query params', () => {
    service.getAllUsers('driver', 'active').subscribe();
    const req = controller.expectOne(r => r.url === `${BASE}/users`);
    expect(req.request.params.get('role')).toBe('driver');
    expect(req.request.params.get('status')).toBe('active');
    req.flush({ users: [] });
  });

  it('inviteUser() calls POST /admin/users/invite with email and role', () => {
    service.inviteUser('new@test.com', 'attorney').subscribe(r => {
      expect(r.user.email).toBe('new@test.com');
    });
    const req = controller.expectOne(`${BASE}/users/invite`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'new@test.com', role: 'attorney' });
    req.flush({ user: { id: 'u2', email: 'new@test.com', role: 'attorney', status: 'pending', name: 'new@test.com', createdAt: '2026-01-01' } });
  });

  it('changeUserRole() calls PATCH /admin/users/:id/role', () => {
    service.changeUserRole('u1', 'paralegal').subscribe(r => {
      expect(r.user.role).toBe('paralegal');
    });
    const req = controller.expectOne(`${BASE}/users/u1/role`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ role: 'paralegal' });
    req.flush({ user: { id: 'u1', role: 'paralegal' } });
  });

  it('suspendUser() calls PATCH /admin/users/:id/suspend', () => {
    service.suspendUser('u1').subscribe(r => expect(r.user.status).toBe('suspended'));
    const req = controller.expectOne(`${BASE}/users/u1/suspend`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ user: { id: 'u1', status: 'suspended' } });
  });

  it('unsuspendUser() calls PATCH /admin/users/:id/unsuspend', () => {
    service.unsuspendUser('u1').subscribe(r => expect(r.user.status).toBe('active'));
    const req = controller.expectOne(`${BASE}/users/u1/unsuspend`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ user: { id: 'u1', status: 'active' } });
  });
});
