import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { provideTranslateService } from '@ngx-translate/core';
import { OperatorProfileComponent } from './operator-profile.component';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

const MOCK_USER = {
  id: 'u1',
  name: 'Jane Operator',
  email: 'jane@cdl.com',
  phone: '555-0123',
  avatar_url: '',
  created_at: '2025-06-15T10:00:00Z',
};

function makeAuthSpy(user = MOCK_USER) {
  return {
    currentUser$: new BehaviorSubject(user),
    updateProfile: vi.fn().mockReturnValue(of({ user })),
    changePassword: vi.fn().mockReturnValue(of({ message: 'ok' })),
    uploadAvatar: vi.fn().mockReturnValue(of({ avatar_url: 'https://cdn.example.com/avatar.jpg' })),
  };
}

async function setup(authSpy = makeAuthSpy()) {
  const routerSpy = { navigate: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [OperatorProfileComponent, NoopAnimationsModule],
    providers: [
      { provide: AuthService, useValue: authSpy },
      { provide: Router, useValue: routerSpy },
      provideRouter([]),
      provideTranslateService(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(OperatorProfileComponent);
  fixture.detectChanges();
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  return { fixture, component: fixture.componentInstance, authSpy, snackBar, router: routerSpy };
}

describe('OperatorProfileComponent', () => {
  it('populates profile form from currentUser$', async () => {
    const { component } = await setup();
    expect(component.profileForm.get('firstName')?.value).toBe('Jane');
    expect(component.profileForm.get('lastName')?.value).toBe('Operator');
    expect(component.profileForm.get('email')?.value).toBe('jane@cdl.com');
    expect(component.profileForm.get('phone')?.value).toBe('555-0123');
  });

  it('fullName computed returns user name', async () => {
    const { component } = await setup();
    expect(component.fullName()).toBe('Jane Operator');
  });

  it('memberSince computed formats date', async () => {
    const { component } = await setup();
    expect(component.memberSince()).toContain('Member since');
    expect(component.memberSince()).toContain('June');
  });

  it('toggleEditProfile toggles editing state', async () => {
    const { component } = await setup();
    expect(component.editingProfile()).toBe(false);
    component.toggleEditProfile();
    expect(component.editingProfile()).toBe(true);
    component.toggleEditProfile();
    expect(component.editingProfile()).toBe(false);
  });

  it('saveProfile calls authService.updateProfile with combined name', async () => {
    const { component, authSpy } = await setup();
    component.toggleEditProfile();
    component.profileForm.patchValue({ firstName: 'Updated', lastName: 'Name', phone: '555-9999' });
    component.saveProfile();
    expect(authSpy.updateProfile).toHaveBeenCalledWith({
      name: 'Updated Name',
      phone: '555-9999',
    });
  });

  it('saveProfile shows success snackbar on success', async () => {
    const { component, snackBar } = await setup();
    component.toggleEditProfile();
    component.saveProfile();
    expect(snackBar.open).toHaveBeenCalledWith('Profile updated successfully.', 'Close', expect.any(Object));
  });

  it('saveProfile shows error snackbar on failure', async () => {
    const spy = makeAuthSpy();
    spy.updateProfile.mockReturnValue(throwError(() => new Error('fail')));
    const { component, snackBar } = await setup(spy);
    component.toggleEditProfile();
    component.saveProfile();
    expect(snackBar.open).toHaveBeenCalledWith('Failed to update profile.', 'Close', expect.any(Object));
  });

  it('does not submit profile when form is invalid', async () => {
    const { component, authSpy } = await setup();
    component.toggleEditProfile();
    component.profileForm.patchValue({ firstName: '', lastName: '' });
    component.saveProfile();
    expect(authSpy.updateProfile).not.toHaveBeenCalled();
  });

  it('toggleEditPassword toggles password editing', async () => {
    const { component } = await setup();
    expect(component.editingPassword()).toBe(false);
    component.toggleEditPassword();
    expect(component.editingPassword()).toBe(true);
  });

  it('savePassword calls authService.changePassword', async () => {
    const { component, authSpy } = await setup();
    component.toggleEditPassword();
    component.passwordForm.patchValue({
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass1!',
      confirmPassword: 'NewPass1!',
    });
    component.savePassword();
    expect(authSpy.changePassword).toHaveBeenCalledWith('OldPass1!', 'NewPass1!');
  });

  it('savePassword shows mismatch error when passwords differ', async () => {
    const { component, authSpy, snackBar } = await setup();
    component.toggleEditPassword();
    component.passwordForm.patchValue({
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass1!',
      confirmPassword: 'Different!',
    });
    component.savePassword();
    expect(authSpy.changePassword).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Passwords do not match.', 'Close', expect.any(Object));
  });

  it('onAvatarSelected rejects files over 5 MB', async () => {
    const { component, authSpy, snackBar } = await setup();
    const bigFile = new File(['x'.repeat(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [bigFile], value: '' } } as unknown as Event;
    component.onAvatarSelected(event);
    expect(authSpy.uploadAvatar).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Image must be under 5 MB.', 'Close', expect.any(Object));
  });

  it('onAvatarSelected rejects non-image files', async () => {
    const { component, authSpy, snackBar } = await setup();
    const textFile = new File(['hello'], 'doc.txt', { type: 'text/plain' });
    const event = { target: { files: [textFile], value: '' } } as unknown as Event;
    component.onAvatarSelected(event);
    expect(authSpy.uploadAvatar).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Only JPG, PNG, GIF, or WebP images are allowed.', 'Close', expect.any(Object));
  });

  it('onAvatarSelected calls uploadAvatar for valid file', async () => {
    const { component, authSpy } = await setup();
    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;
    component.onAvatarSelected(event);
    expect(authSpy.uploadAvatar).toHaveBeenCalledWith(file);
  });

  it('goBack navigates to /operator/dashboard', async () => {
    const { component, router } = await setup();
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/operator/dashboard']);
  });
});
