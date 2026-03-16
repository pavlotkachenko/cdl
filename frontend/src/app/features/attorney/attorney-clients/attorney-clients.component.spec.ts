import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { AttorneyClientsComponent } from './attorney-clients.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [AttorneyClientsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
  }).compileComponents();

  const fixture = TestBed.createComponent(AttorneyClientsComponent);
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, snackBar };
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

    component.searchTerm.set('gmail');
    expect(component.filteredClients().length).toBeGreaterThan(0);
    expect(component.filteredClients().every(c => c.email.includes('gmail'))).toBe(true);

    component.searchTerm.set('xyznotfound');
    expect(component.filteredClients().length).toBe(0);
  });

  it('totalClients returns correct count', async () => {
    const { component } = await setup();
    expect(component.totalClients()).toBe(10);
  });

  it('activeClients returns count with activeCases > 0', async () => {
    const { component } = await setup();
    // From mock data: ac-005 (0 active), ac-006 (0 active) => 8 active
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
