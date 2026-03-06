import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { BulkImportComponent } from './bulk-import.component';
import { CarrierService } from '../../../core/services/carrier.service';
import { MatSnackBar } from '@angular/material/snack-bar';

function makeServiceSpy() {
  return {
    bulkImport: vi.fn().mockReturnValue(of({ results: { imported: 2, errors: [] } })),
  };
}

async function setup(spy = makeServiceSpy()) {
  await TestBed.configureTestingModule({
    imports: [BulkImportComponent, NoopAnimationsModule],
    providers: [
      { provide: CarrierService, useValue: spy },
      provideRouter([]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(BulkImportComponent);
  fixture.detectChanges();
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  return { fixture, component: fixture.componentInstance, spy, snackBar };
}

describe('BulkImportComponent', () => {
  it('renders upload area and template section', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Bulk Import');
    expect(el.textContent).toContain('CSV Template');
  });

  it('buildPreview shows preview rows for valid CSV', async () => {
    const { component, fixture } = await setup();
    component.csvText.set('cdl_number,violation_type,state\nCDL001,Speeding,TX\nCDL002,Overweight,CA');
    component.buildPreview();
    fixture.detectChanges();
    expect(component.preview()).not.toBeNull();
    expect(component.preview()!.length).toBe(2);
    expect(component.validRows()).toBe(2);
  });

  it('buildPreview marks row invalid when cdl_number is missing', async () => {
    const { component } = await setup();
    component.csvText.set('cdl_number,violation_type,state\n,Speeding,TX');
    component.buildPreview();
    const rows = component.preview()!;
    expect(rows[0].valid).toBe(false);
  });

  it('confirmImport calls bulkImport and shows snackbar', async () => {
    const { component, spy, snackBar } = await setup();
    component.csvText.set('cdl_number,violation_type,state\nCDL001,Speeding,TX');
    component.buildPreview();
    component.confirmImport();
    expect(spy.bulkImport).toHaveBeenCalledWith(component.csvText());
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('2 cases'), 'Close', expect.any(Object),
    );
  });

  it('shows error snackbar when bulkImport fails', async () => {
    const spy = makeServiceSpy();
    spy.bulkImport = vi.fn().mockReturnValue(throwError(() => new Error('fail')));
    const { component, snackBar } = await setup(spy);
    component.csvText.set('cdl_number,violation_type,state\nCDL001,Speeding,TX');
    component.buildPreview();
    component.confirmImport();
    expect(snackBar.open).toHaveBeenCalledWith('Import failed. Please try again.', 'Close', expect.any(Object));
  });

  it('resetPreview clears preview', async () => {
    const { component } = await setup();
    component.csvText.set('cdl_number,violation_type,state\nCDL001,Speeding,TX');
    component.buildPreview();
    component.resetPreview();
    expect(component.preview()).toBeNull();
  });
});
