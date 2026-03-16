import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from './sidebar.component';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

function makeMocks(role = 'driver', name = 'Test User') {
  const unreadCount$ = new BehaviorSubject<number>(0);
  const currentUser$ = new BehaviorSubject<{ role: string; name: string } | null>({ role, name });

  const notificationService = {
    unreadCount$: unreadCount$.asObservable(),
  };

  const authService = {
    getUserRole: vi.fn().mockReturnValue(role),
    currentUser$: currentUser$.asObservable(),
  };

  return { notificationService, authService, unreadCount$, currentUser$ };
}

async function setup(role = 'driver') {
  const mocks = makeMocks(role);

  await TestBed.configureTestingModule({
    imports: [SidebarComponent, NoopAnimationsModule, TranslateModule.forRoot()],
    providers: [
      { provide: NotificationService, useValue: mocks.notificationService },
      { provide: AuthService, useValue: mocks.authService },
      provideRouter([]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(SidebarComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, ...mocks };
}

describe('SidebarComponent', () => {
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should default to driver navigation', async () => {
    const { component } = await setup('driver');
    expect(component.userRole).toBe('driver');
    expect(component.navigation.length).toBeGreaterThan(0);
    expect(component.navigation[0].link).toContain('/driver/');
  });

  it('should switch to admin navigation when role is admin', async () => {
    const { component, currentUser$ } = await setup('driver');
    currentUser$.next({ role: 'admin', name: 'Admin User' });
    expect(component.userRole).toBe('admin');
    expect(component.navigation[0].link).toContain('/admin/');
  });

  it('should switch to attorney navigation when role is attorney', async () => {
    const { component, currentUser$ } = await setup('driver');
    currentUser$.next({ role: 'attorney', name: 'Attorney User' });
    expect(component.userRole).toBe('attorney');
    expect(component.navigation[0].link).toContain('/attorney/');
  });

  it('should update notification badge count', async () => {
    const { component, unreadCount$ } = await setup();
    unreadCount$.next(5);
    expect(component.notificationCount).toBe(5);
    const notifItem = component.navigation.find(n => n.name === 'NAV.NOTIFICATIONS');
    expect(notifItem?.badge).toBe(5);
  });

  it('should update navigation when user role changes', async () => {
    const { component, currentUser$ } = await setup('driver');
    expect(component.navigation[0].link).toContain('/driver/');

    currentUser$.next({ role: 'carrier', name: 'Carrier User' });
    expect(component.userRole).toBe('carrier');
    expect(component.navigation[0].link).toContain('/carrier/');

    currentUser$.next({ role: 'operator', name: 'Operator User' });
    expect(component.userRole).toBe('operator');
    expect(component.navigation[0].link).toContain('/operator/');

    currentUser$.next({ role: 'paralegal', name: 'Paralegal User' });
    expect(component.userRole).toBe('paralegal');
    expect(component.navigation[0].link).toContain('/paralegal/');
  });
});
