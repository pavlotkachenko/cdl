import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { CarrierProfileComponent } from './carrier-profile.component';
import { CarrierService, CarrierProfile } from '../../../core/services/carrier.service';
import { MatSnackBar } from '@angular/material/snack-bar';

const MOCK_PROFILE: CarrierProfile = {
  company_name: 'ACME Trucking',
  usdot_number: '1234567',
  email: 'admin@acme.com',
  phone_number: '555-0100',
  notify_on_new_ticket: true,
};

function makeServiceSpy(profile = MOCK_PROFILE) {
  return {
    getProfile: vi.fn().mockReturnValue(of({ carrier: profile })),
    updateProfile: vi.fn().mockReturnValue(of({ carrier: profile })),
  };
}

async function setup(spy = makeServiceSpy()) {
  await TestBed.configureTestingModule({
    imports: [CarrierProfileComponent, NoopAnimationsModule],
    providers: [
      { provide: CarrierService, useValue: spy },
      provideRouter([]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CarrierProfileComponent);
  fixture.detectChanges();
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  return { fixture, component: fixture.componentInstance, spy, snackBar };
}

describe('CarrierProfileComponent', () => {
  it('loads profile data into the form', async () => {
    const { component } = await setup();
    expect(component.profileForm.get('company_name')?.value).toBe('ACME Trucking');
    expect(component.profileForm.get('phone_number')?.value).toBe('555-0100');
  });

  it('calls updateProfile with editable fields on save', async () => {
    const { component, spy } = await setup();
    component.profileForm.patchValue({ company_name: 'New Name', phone_number: '555-9999' });
    component.save();
    expect(spy.updateProfile).toHaveBeenCalledWith({
      company_name: 'New Name',
      phone_number: '555-9999',
      notify_on_new_ticket: true,
    });
  });

  it('shows success snackBar after save', async () => {
    const { component, snackBar } = await setup();
    component.save();
    expect(snackBar.open).toHaveBeenCalledWith('Profile updated successfully.', 'Close', expect.any(Object));
  });

  it('shows error snackBar when save fails', async () => {
    const spy = makeServiceSpy();
    spy.updateProfile.mockReturnValue(throwError(() => new Error('fail')));
    const { component, snackBar } = await setup(spy);
    component.save();
    expect(snackBar.open).toHaveBeenCalledWith('Failed to save profile. Please try again.', 'Close', expect.any(Object));
  });

  it('does not submit when company_name is empty', async () => {
    const { component, spy } = await setup();
    component.profileForm.patchValue({ company_name: '' });
    component.save();
    expect(spy.updateProfile).not.toHaveBeenCalled();
  });

  it('phone input has type=tel for mobile numeric keyboard', async () => {
    const { fixture } = await setup();
    const phoneInput: HTMLInputElement | null = fixture.nativeElement.querySelector('input[formcontrolname="phone_number"]');
    expect(phoneInput).toBeTruthy();
    expect(phoneInput?.type).toBe('tel');
  });
});
