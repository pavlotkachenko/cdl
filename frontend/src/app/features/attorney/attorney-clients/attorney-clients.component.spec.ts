import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect } from 'vitest';
import { of } from 'rxjs';

import { AttorneyClientsComponent } from './attorney-clients.component';
import { AttorneyService } from '../../../core/services/attorney.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

// 10 unique drivers: 8 with active (non-closed) cases, 2 with only closed
const MOCK_CASES = [
  { id: 'c1', case_number: 'C-001', status: 'new', driver_name: 'Marcus Johnson', state: 'TX', created_at: '2026-01-01T00:00:00Z' },
  { id: 'c2', case_number: 'C-002', status: 'assigned_to_attorney', driver_name: 'Priya Patel', state: 'CA', created_at: '2026-01-02T00:00:00Z' },
  { id: 'c3', case_number: 'C-003', status: 'reviewed', driver_name: "James O'Brien", state: 'FL', created_at: '2026-01-03T00:00:00Z' },
  { id: 'c4', case_number: 'C-004', status: 'new', driver_name: 'Rosa Gutierrez', state: 'NY', created_at: '2026-01-04T00:00:00Z' },
  { id: 'c5', case_number: 'C-005', status: 'closed', driver_name: 'Chen Wei', state: 'TX', created_at: '2026-01-05T00:00:00Z' },
  { id: 'c6', case_number: 'C-006', status: 'closed', driver_name: 'Anna Petrova', state: 'IL', created_at: '2026-01-06T00:00:00Z' },
  { id: 'c7', case_number: 'C-007', status: 'new', driver_name: 'Kevin Brown', state: 'OH', created_at: '2026-01-07T00:00:00Z' },
  { id: 'c8', case_number: 'C-008', status: 'assigned_to_attorney', driver_name: 'Maria Santos', state: 'AZ', created_at: '2026-01-08T00:00:00Z' },
  { id: 'c9', case_number: 'C-009', status: 'reviewed', driver_name: 'David Lee', state: 'WA', created_at: '2026-01-09T00:00:00Z' },
  { id: 'c10', case_number: 'C-010', status: 'new', driver_name: 'Sarah Kim', state: 'GA', created_at: '2026-01-10T00:00:00Z' },
];

function makeServiceSpy() {
  return {
    getMyCases: vi.fn().mockReturnValue(of({ cases: MOCK_CASES })),
  };
}

async function setup(spy = makeServiceSpy()) {
  await TestBed.configureTestingModule({
    imports: [AttorneyClientsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
    providers: [
      { provide: AttorneyService, useValue: spy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AttorneyClientsComponent);
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, snackBar, spy };
}

describe('AttorneyClientsComponent', () => {
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should display all 10 clients by default', async () => {
    const { component } = await setup();
    expect(component.clients().length).toBe(10);
    expect(component.filteredClients().length).toBe(10);
  });

  it('should filter clients by search term', async () => {
    const { component } = await setup();

    component.searchTerm.set('Marcus');
    expect(component.filteredClients().length).toBe(1);
    expect(component.filteredClients()[0].name).toBe('Marcus Johnson');

    component.searchTerm.set('xyznotfound');
    expect(component.filteredClients().length).toBe(0);
  });

  it('totalClients returns correct count', async () => {
    const { component } = await setup();
    expect(component.totalClients()).toBe(10);
  });

  it('activeClients returns count with activeCases > 0', async () => {
    const { component } = await setup();
    // Chen Wei and Anna Petrova have only closed cases => 8 active
    const expectedActive = component.clients().filter(c => c.activeCases > 0).length;
    expect(component.activeClients()).toBe(expectedActive);
    expect(component.activeClients()).toBe(8);
  });

  it('getInitials returns correct initials', async () => {
    const { component } = await setup();
    expect(component.getInitials('Marcus Johnson')).toBe('MJ');
    expect(component.getInitials('Priya Patel')).toBe('PP');
    expect(component.getInitials("James O'Brien")).toBe('JO');
    expect(component.getInitials('Rosa Gutierrez')).toBe('RG');
  });

  it('getStars returns correct star array', async () => {
    const { component } = await setup();

    // 4.5 => 4 full + 1 half
    const stars45 = component.getStars(4.5);
    expect(stars45).toEqual(['full', 'full', 'full', 'full', 'half']);

    // 5.0 => 5 full
    const stars50 = component.getStars(5.0);
    expect(stars50).toEqual(['full', 'full', 'full', 'full', 'full']);

    // 3.0 => 3 full + 2 empty
    const stars30 = component.getStars(3.0);
    expect(stars30).toEqual(['full', 'full', 'full', 'empty', 'empty']);

    // 0 => 5 empty
    const stars0 = component.getStars(0);
    expect(stars0).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
  });

  it('formatDate formats date string', async () => {
    const { component } = await setup();

    const formatted = component.formatDate('2026-03-08');
    // Verify it produces a locale-formatted date containing month and year
    expect(formatted).toContain('Mar');
    expect(formatted).toContain('2026');

    // Empty string should return 'Never'
    expect(component.formatDate('')).toBe('Never');
  });
});
