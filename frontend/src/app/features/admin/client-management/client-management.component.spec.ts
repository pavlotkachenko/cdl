import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { ClientManagementComponent } from './client-management.component';
import { AdminService, Client } from '../../../core/services/admin.service';
import { MatSnackBar } from '@angular/material/snack-bar';

const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1', name: 'Alice Smith', email: 'alice@example.com', phone: '555-0101',
    cdlNumber: 'CDL123', totalCases: 2, activeCases: 1,
    createdAt: new Date('2023-01-01'), lastContact: new Date('2024-01-15'),
  },
  {
    id: 'c2', name: 'Bob Jones', email: 'bob@example.com', phone: '555-0202',
    totalCases: 5, activeCases: 3,
    createdAt: new Date('2023-06-01'),
  },
];

describe('ClientManagementComponent', () => {
  let fixture: ComponentFixture<ClientManagementComponent>;
  let component: ClientManagementComponent;
  let adminService: { getAllClients: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    adminService = { getAllClients: vi.fn().mockReturnValue(of(MOCK_CLIENTS)) };
    router = { navigate: vi.fn() };
    snackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ClientManagementComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: AdminService, useValue: adminService },
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads clients on init', () => {
    expect(adminService.getAllClients).toHaveBeenCalled();
    expect(component.clients()).toEqual(MOCK_CLIENTS);
    expect(component.loading()).toBe(false);
  });

  it('filteredClients returns all when searchTerm is empty', () => {
    expect(component.filteredClients().length).toBe(2);
  });

  it('filteredClients filters by name', () => {
    component.searchTerm.set('alice');
    expect(component.filteredClients().length).toBe(1);
    expect(component.filteredClients()[0].name).toBe('Alice Smith');
  });

  it('filteredClients filters by email', () => {
    component.searchTerm.set('bob@example');
    expect(component.filteredClients().length).toBe(1);
    expect(component.filteredClients()[0].id).toBe('c2');
  });

  it('filteredClients filters by CDL number', () => {
    component.searchTerm.set('cdl123');
    expect(component.filteredClients().length).toBe(1);
    expect(component.filteredClients()[0].id).toBe('c1');
  });

  it('viewCases navigates to /admin/cases with clientId', () => {
    component.viewCases(MOCK_CLIENTS[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/cases'], { queryParams: { clientId: 'c1' } });
  });

  it('shows snackBar error when getAllClients fails', async () => {
    adminService.getAllClients.mockReturnValue(throwError(() => new Error('fail')));
    component.loadClients();
    expect(snackBar.open).toHaveBeenCalledWith('Failed to load clients', 'Close', { duration: 5000 });
  });

  it('getInitials extracts up to 2 initials', () => {
    expect(component.getInitials('Alice Smith')).toBe('AS');
    expect(component.getInitials('Bob')).toBe('B');
  });

  it('getCaseCountColor returns correct color by count', () => {
    expect(component.getCaseCountColor(5)).toBe('warn');
    expect(component.getCaseCountColor(2)).toBe('primary');
    expect(component.getCaseCountColor(0)).toBe('accent');
  });
});
