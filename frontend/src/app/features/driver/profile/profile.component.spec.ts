import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';
import { BehaviorSubject } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

const MOCK_USER = {
  id: 'u1', name: 'Alice Driver', email: 'alice@test.com',
  phone: '555-1234', role: 'driver' as const,
};

function makeAuthSpy(user = MOCK_USER) {
  const subject = new BehaviorSubject<any>(user);
  return {
    currentUser$: subject.asObservable(),
    getCurrentUser: vi.fn().mockReturnValue(user),
    updateProfile: vi.fn().mockReturnValue(of({ user })),
    changePassword: vi.fn().mockReturnValue(of({ message: 'ok' })),
  };
}

async function setup(authSpy = makeAuthSpy()) {
  const routerSpy = { navigate: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [ProfileComponent, NoopAnimationsModule],
    providers: [
      { provide: AuthService, useValue: authSpy },
      { provide: Router, useValue: routerSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProfileComponent);
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, authSpy, snackBar, router: routerSpy };
}

describe('ProfileComponent', () => {
  it('populates form from currentUser$ on init', async () => {
    const { component } = await setup();
    expect(component.profileForm.get('firstName')?.value).toBe('Alice');
    expect(component.profileForm.get('email')?.value).toBe('alice@test.com');
  });

  it('saveProfile calls authService.updateProfile with combined name', async () => {
    const { component, authSpy } = await setup();
    component.editingProfile.set(true);
    component.profileForm.patchValue({ firstName: 'Bob', lastName: 'Smith', email: 'bob@test.com', phone: '555-0000' });
    component.saveProfile();
    expect(authSpy.updateProfile).toHaveBeenCalledWith({ name: 'Bob Smith', phone: '555-0000' });
  });

  it('saveProfile with invalid form shows snackBar and does not call service', async () => {
    const { component, authSpy, snackBar } = await setup();
    component.editingProfile.set(true);
    component.profileForm.patchValue({ firstName: '', lastName: '', email: 'bad', phone: '' });
    component.saveProfile();
    expect(authSpy.updateProfile).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('required'), 'Close', expect.any(Object),
    );
  });

  it('savePassword calls authService.changePassword', async () => {
    const { component, authSpy } = await setup();
    component.editingPassword.set(true);
    component.passwordForm.patchValue({
      currentPassword: 'old123!',
      newPassword: 'new123456',
      confirmPassword: 'new123456',
    });
    component.savePassword();
    expect(authSpy.changePassword).toHaveBeenCalledWith('old123!', 'new123456');
  });

  it('savePassword with mismatched passwords shows snackBar', async () => {
    const { component, authSpy, snackBar } = await setup();
    component.editingPassword.set(true);
    component.passwordForm.patchValue({
      currentPassword: 'old123!',
      newPassword: 'new123456',
      confirmPassword: 'different',
    });
    component.savePassword();
    expect(authSpy.changePassword).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Passwords do not match.', 'Close', expect.any(Object));
  });
});
