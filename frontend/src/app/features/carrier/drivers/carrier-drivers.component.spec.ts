import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { CarrierDriversComponent } from './carrier-drivers.component';
import { CarrierService, FleetDriver } from '../../../core/services/carrier.service';
import { MatSnackBar } from '@angular/material/snack-bar';

const MOCK_DRIVERS: FleetDriver[] = [
  { id: 'd1', full_name: 'Alice Smith', cdl_number: 'CDL001', openCases: 2 },
  { id: 'd2', full_name: 'Bob Jones', cdl_number: 'CDL002', openCases: 0 },
];

function makeServiceSpy() {
  return {
    getDrivers: vi.fn().mockReturnValue(of({ drivers: MOCK_DRIVERS })),
    addDriver: vi.fn().mockReturnValue(of({ driver: { id: 'd3', full_name: 'New Driver', cdl_number: 'CDL003', openCases: 0 } })),
    removeDriver: vi.fn().mockReturnValue(of({ message: 'removed' })),
  };
}

async function setup(spy = makeServiceSpy()) {
  await TestBed.configureTestingModule({
    imports: [CarrierDriversComponent, NoopAnimationsModule],
    providers: [{ provide: CarrierService, useValue: spy }],
  }).compileComponents();

  const fixture = TestBed.createComponent(CarrierDriversComponent);
  fixture.detectChanges();
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  return { fixture, component: fixture.componentInstance, spy, snackBar };
}

describe('CarrierDriversComponent', () => {
  it('loads and displays drivers on init', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Alice Smith');
    expect(el.textContent).toContain('Bob Jones');
  });

  it('filters drivers by search term', async () => {
    const { component, fixture } = await setup();
    component.searchTerm.set('alice');
    fixture.detectChanges();
    expect(component.filteredDrivers().length).toBe(1);
    expect(component.filteredDrivers()[0].full_name).toBe('Alice Smith');
  });

  it('adds a driver and prepends to list', async () => {
    const { component } = await setup();
    component.addForm.setValue({ full_name: 'New Driver', cdl_number: 'CDL003' });
    component.addDriver();
    expect(component.drivers()[0].full_name).toBe('New Driver');
  });

  it('shows snackBar on successful add', async () => {
    const { component, snackBar } = await setup();
    component.addForm.setValue({ full_name: 'New Driver', cdl_number: 'CDL003' });
    component.addDriver();
    expect(snackBar.open).toHaveBeenCalledWith('Driver added successfully.', 'Close', expect.any(Object));
  });

  it('removes driver from list after successful delete', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { component } = await setup();
    component.removeDriver('d1');
    expect(component.drivers().find(d => d.id === 'd1')).toBeUndefined();
  });

  it('shows error snackBar when addDriver fails', async () => {
    const spy = makeServiceSpy();
    spy.addDriver.mockReturnValue(throwError(() => new Error('fail')));
    const { component, snackBar } = await setup(spy);
    component.addForm.setValue({ full_name: 'Fail', cdl_number: 'CDL999' });
    component.addDriver();
    expect(snackBar.open).toHaveBeenCalledWith('Failed to add driver. Please try again.', 'Close', expect.any(Object));
  });
});
