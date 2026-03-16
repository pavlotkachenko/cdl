import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TranslateModule } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AdminSettingsComponent } from './admin-settings.component';

describe('AdminSettingsComponent', () => {
  let fixture: ComponentFixture<AdminSettingsComponent>;
  let component: AdminSettingsComponent;
  let snackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    snackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AdminSettingsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('firmForm should have default values', () => {
    const values = component.firmForm.value;
    expect(values.firmName).toBe('CDL Legal Partners');
    expect(values.contactEmail).toBe('admin@cdllegal.com');
    expect(values.contactPhone).toBe('(555) 100-2000');
    expect(values.address).toBe('500 Justice Blvd');
    expect(values.city).toBe('Houston');
    expect(values.state).toBe('TX');
    expect(values.zip).toBe('77001');
  });

  it('saveSettings should show saving state', () => {
    vi.useFakeTimers();

    expect(component.saving()).toBe(false);
    component.saveSettings();
    expect(component.saving()).toBe(true);

    vi.advanceTimersByTime(500);

    expect(component.saving()).toBe(false);
    expect(snackBar.open).toHaveBeenCalledWith('Settings saved successfully', 'Close', { duration: 3000 });
  });

  it('saveSettings should not save when form invalid', () => {
    component.firmForm.controls.firmName.setValue('');
    component.saveSettings();

    expect(component.saving()).toBe(false);
    expect(snackBar.open).not.toHaveBeenCalled();
    expect(component.firmForm.touched).toBe(true);
  });

  it('toggle2FA should toggle signal', () => {
    expect(component.twoFactorEnabled()).toBe(false);
    component.toggle2FA();
    expect(component.twoFactorEnabled()).toBe(true);
    component.toggle2FA();
    expect(component.twoFactorEnabled()).toBe(false);
  });

  it('toggleNotify should toggle correct preference', () => {
    // notifyNewCase starts true
    expect(component.notifyNewCase()).toBe(true);
    component.toggleNotify('new_case');
    expect(component.notifyNewCase()).toBe(false);

    // notifyStaffActivity starts false
    expect(component.notifyStaffActivity()).toBe(false);
    component.toggleNotify('staff_activity');
    expect(component.notifyStaffActivity()).toBe(true);

    // notifyPayments starts true
    expect(component.notifyPayments()).toBe(true);
    component.toggleNotify('payments');
    expect(component.notifyPayments()).toBe(false);

    // notifyStatusUpdates starts true
    expect(component.notifyStatusUpdates()).toBe(true);
    component.toggleNotify('status_updates');
    expect(component.notifyStatusUpdates()).toBe(false);

    // notifyDailyDigest starts true
    expect(component.notifyDailyDigest()).toBe(true);
    component.toggleNotify('daily_digest');
    expect(component.notifyDailyDigest()).toBe(false);
  });

  it('toggleAutoAssign should toggle signal', () => {
    expect(component.autoAssignCases()).toBe(true);
    component.toggleAutoAssign();
    expect(component.autoAssignCases()).toBe(false);
    component.toggleAutoAssign();
    expect(component.autoAssignCases()).toBe(true);
  });

  it('deleteTestData should require confirmation', () => {
    expect(component.confirmDelete()).toBe(false);

    // First call sets confirmDelete to true
    component.deleteTestData();
    expect(component.confirmDelete()).toBe(true);
    expect(snackBar.open).not.toHaveBeenCalled();

    // Second call performs delete and resets confirmDelete
    component.deleteTestData();
    expect(component.confirmDelete()).toBe(false);
    expect(snackBar.open).toHaveBeenCalledWith('Test data deleted.', 'Close', { duration: 3000 });
  });

  it('exportData should show snackbar', () => {
    component.exportData();
    expect(snackBar.open).toHaveBeenCalledWith('Preparing data export...', 'Close', { duration: 3000 });
  });
});
