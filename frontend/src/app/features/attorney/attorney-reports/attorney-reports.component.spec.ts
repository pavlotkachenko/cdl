import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { vi, describe, it, expect } from 'vitest';

import { AttorneyReportsComponent } from './attorney-reports.component';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [AttorneyReportsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
  }).compileComponents();

  const fixture = TestBed.createComponent(AttorneyReportsComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('AttorneyReportsComponent', () => {
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should default to performance report type', async () => {
    const { component } = await setup();
    expect(component.reportType()).toBe('performance');
  });

  it('should switch report type', async () => {
    const { component } = await setup();
    component.reportType.set('revenue');
    expect(component.reportType()).toBe('revenue');

    component.reportType.set('cases');
    expect(component.reportType()).toBe('cases');

    component.reportType.set('clients');
    expect(component.reportType()).toBe('clients');
  });

  it('totalRevenue should sum monthly revenue', async () => {
    const { component } = await setup();
    // 9800 + 12650 + 8400 + 13200 + 11400 + 12000 = 67450
    expect(component.totalRevenue()).toBe(67450);
  });

  it('collectionRate should compute correctly', async () => {
    const { component } = await setup();
    // (59250 / (59250 + 8200)) * 100
    const expected = (59250 / (59250 + 8200)) * 100;
    expect(component.collectionRate()).toBeCloseTo(expected, 5);
  });

  it('getBarHeight returns correct percentage', async () => {
    const { component } = await setup();
    expect(component.getBarHeight(50, 100)).toBe(50);
    expect(component.getBarHeight(100, 100)).toBe(100);
    expect(component.getBarHeight(0, 100)).toBe(0);
    expect(component.getBarHeight(10, 0)).toBe(0);
  });

  it('getRateBadgeClass returns correct class', async () => {
    const { component } = await setup();
    expect(component.getRateBadgeClass(90)).toBe('rate-high');
    expect(component.getRateBadgeClass(85)).toBe('rate-high');
    expect(component.getRateBadgeClass(75)).toBe('rate-mid');
    expect(component.getRateBadgeClass(70)).toBe('rate-mid');
    expect(component.getRateBadgeClass(60)).toBe('rate-low');
  });

  it('getInitials returns correct initials', async () => {
    const { component } = await setup();
    expect(component.getInitials('James Kowalski')).toBe('JK');
    expect(component.getInitials('Miguel Rivera')).toBe('MR');
    expect(component.getInitials('Lisa Chen')).toBe('LC');
  });

  it('getRankClass returns correct rank', async () => {
    const { component } = await setup();
    expect(component.getRankClass(0)).toBe('rank-gold');
    expect(component.getRankClass(1)).toBe('rank-silver');
    expect(component.getRankClass(2)).toBe('rank-bronze');
    expect(component.getRankClass(3)).toBe('rank-default');
    expect(component.getRankClass(10)).toBe('rank-default');
  });
});
