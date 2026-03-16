import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { AttorneyProfileComponent } from './attorney-profile.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

const mockUser = {
  id: 'u1',
  name: 'John Doe',
  email: 'john@test.com',
  role: 'attorney',
  phone: '555-1234',
  barNumber: 'BAR-12345',
  avatar_url: '',
  created_at: '2025-01-15T00:00:00Z',
};

function makeMockAuthService() {
  return {
    currentUser$: new BehaviorSubject<any>(mockUser),
    updateProfile: vi.fn().mockReturnValue(of({})),
    changePassword: vi.fn().mockReturnValue(of({})),
    uploadAvatar: vi.fn().mockReturnValue(of({ avatar_url: 'https://example.com/avatar.jpg' })),
  };
}

async function setup(authOverrides?: Partial<ReturnType<typeof makeMockAuthService>>) {
  const mockAuth = { ...makeMockAuthService(), ...authOverrides };
  const routerSpy = { navigate: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [AttorneyProfileComponent, NoopAnimationsModule, TranslateModule.forRoot()],
    providers: [
      { provide: AuthService, useValue: mockAuth },
      { provide: Router, useValue: routerSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AttorneyProfileComponent);
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, mockAuth, routerSpy, snackBar };
}

describe('AttorneyProfileComponent', () => {
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should display user name from currentUser', async () => {
    const { component } = await setup();
    expect(component.fullName()).toBe('John Doe');
    expect(component.currentUser()).toEqual(mockUser);
  });

  it('toggleEditProfile should toggle editing state', async () => {
    const { component } = await setup();
    expect(component.editingProfile()).toBe(false);

    component.toggleEditProfile();
    expect(component.editingProfile()).toBe(true);

    component.toggleEditProfile();
    expect(component.editingProfile()).toBe(false);
  });

  it('toggleEditPassword should toggle editing state', async () => {
    const { component } = await setup();
    expect(component.editingPassword()).toBe(false);

    component.toggleEditPassword();
    expect(component.editingPassword()).toBe(true);

    component.toggleEditPassword();
    expect(component.editingPassword()).toBe(false);
  });

  it('saveProfile should call authService.updateProfile', async () => {
    const { component, mockAuth } = await setup();

    component.toggleEditProfile();
    component.profileForm.patchValue({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@test.com',
      phone: '555-9999',
    });

    component.saveProfile();
    expect(mockAuth.updateProfile).toHaveBeenCalledWith({
      name: 'Jane Smith',
      phone: '555-9999',
    });
  });

  it('saveProfile should show error when form invalid', async () => {
    const { component, mockAuth, snackBar } = await setup();

    component.toggleEditProfile();
    component.profileForm.patchValue({
      firstName: '',
      lastName: '',
      email: '',
    });

    component.saveProfile();
    expect(mockAuth.updateProfile).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'Please fill in all required fields correctly.',
      'Close',
      expect.any(Object),
    );
  });

  it('goBack should navigate to /attorney/dashboard', async () => {
    const { component, routerSpy } = await setup();
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/attorney/dashboard']);
  });

  it('onAvatarSelected should reject files over 5MB', async () => {
    const { component, snackBar, mockAuth } = await setup();

    const largeFile = new File(['x'], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

    const mockEvent = {
      target: {
        files: [largeFile],
        value: 'big.jpg',
      },
    } as unknown as Event;

    component.onAvatarSelected(mockEvent);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Image must be under 5 MB.',
      'Close',
      expect.any(Object),
    );
    expect(mockAuth.uploadAvatar).not.toHaveBeenCalled();
  });
});
