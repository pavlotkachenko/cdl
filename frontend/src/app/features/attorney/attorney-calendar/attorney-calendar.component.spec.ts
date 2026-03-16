import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TranslateModule } from '@ngx-translate/core';

import { AttorneyCalendarComponent } from './attorney-calendar.component';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [AttorneyCalendarComponent, TranslateModule.forRoot()],
  }).compileComponents();

  const fixture = TestBed.createComponent(AttorneyCalendarComponent);
  fixture.detectChanges();
  // Cast to any to access protected signals in tests
  return { fixture, component: fixture.componentInstance as any };
}

describe('AttorneyCalendarComponent', () => {
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should display current month/year label', async () => {
    const { component } = await setup();
    const label = component.monthYearLabel();
    const now = new Date();
    const expectedMonth = now.toLocaleString('default', { month: 'long' });
    const expectedYear = String(now.getFullYear());
    expect(label).toContain(expectedMonth);
    expect(label).toContain(expectedYear);
  });

  it('prevMonth should go to previous month', async () => {
    const { component } = await setup();
    const before = component.currentMonth();
    const expectedMonth = before.getMonth() - 1;
    const expectedYear = before.getFullYear();

    component.prevMonth();

    const after = component.currentMonth();
    const expected = new Date(expectedYear, expectedMonth, 1);
    expect(after.getFullYear()).toBe(expected.getFullYear());
    expect(after.getMonth()).toBe(expected.getMonth());
  });

  it('nextMonth should go to next month', async () => {
    const { component } = await setup();
    const before = component.currentMonth();
    const expectedMonth = before.getMonth() + 1;
    const expectedYear = before.getFullYear();

    component.nextMonth();

    const after = component.currentMonth();
    const expected = new Date(expectedYear, expectedMonth, 1);
    expect(after.getFullYear()).toBe(expected.getFullYear());
    expect(after.getMonth()).toBe(expected.getMonth());
  });

  it('goToday should select today', async () => {
    const { component } = await setup();
    // Navigate away from current month first
    component.nextMonth();
    component.nextMonth();
    expect(component.selectedDay()).toBeNull();

    component.goToday();

    const today = new Date();
    const selected = component.selectedDay();
    expect(selected).not.toBeNull();
    expect(selected!.getFullYear()).toBe(today.getFullYear());
    expect(selected!.getMonth()).toBe(today.getMonth());
    expect(selected!.getDate()).toBe(today.getDate());

    // currentMonth should be reset to today's month
    const cm = component.currentMonth();
    expect(cm.getFullYear()).toBe(today.getFullYear());
    expect(cm.getMonth()).toBe(today.getMonth());
  });

  it('toggleEvent should expand/collapse', async () => {
    const { component } = await setup();
    expect(component.expandedEventId()).toBeNull();

    component.toggleEvent('evt-01');
    expect(component.expandedEventId()).toBe('evt-01');

    // Toggle same event collapses it
    component.toggleEvent('evt-01');
    expect(component.expandedEventId()).toBeNull();

    // Toggle a different event expands it
    component.toggleEvent('evt-02');
    expect(component.expandedEventId()).toBe('evt-02');

    // Toggle yet another replaces it
    component.toggleEvent('evt-03');
    expect(component.expandedEventId()).toBe('evt-03');
  });

  it('eventColor returns correct colors for types', async () => {
    const { component } = await setup();
    expect(component.eventColor('court_hearing')).toBe('#ef5350');
    expect(component.eventColor('client_meeting')).toBe('#42a5f5');
    expect(component.eventColor('deposition')).toBe('#ab47bc');
    expect(component.eventColor('filing_deadline')).toBe('#ffa726');
  });

  it('eventTypeLabel returns correct labels', async () => {
    const { component } = await setup();
    expect(component.eventTypeLabel('court_hearing')).toBe('Court Hearing');
    expect(component.eventTypeLabel('client_meeting')).toBe('Client Meeting');
    expect(component.eventTypeLabel('deposition')).toBe('Deposition');
    expect(component.eventTypeLabel('filing_deadline')).toBe('Filing Deadline');
  });
});
