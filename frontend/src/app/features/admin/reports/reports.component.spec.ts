import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { provideTranslateService } from '@ngx-translate/core';

import { ReportsComponent } from './reports.component';

describe('ReportsComponent', () => {
  let fixture: ComponentFixture<ReportsComponent>;
  let component: ReportsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsComponent, NoopAnimationsModule],
      providers: [
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes with overview report type', () => {
    expect(component.reportType()).toBe('overview');
  });

  it('has pre-populated overviewKPIs data', () => {
    expect(component.overviewKPIs().length).toBe(4);
    expect(component.overviewKPIs()[0].key).toBe('ADMIN.TOTAL_CASES');
  });

  it('has pre-populated staffData', () => {
    expect(component.staffData().length).toBe(5);
    expect(component.staffData()[0].name).toBe('Sarah Johnson');
  });

  it('computes totalCasesCount from casesByStatus', () => {
    const total = component.casesByStatus().reduce((sum, s) => sum + s.count, 0);
    expect(component.totalCasesCount()).toBe(total);
  });

  it('computes totalViolations from casesByType', () => {
    const total = component.casesByType().reduce((sum, t) => sum + t.count, 0);
    expect(component.totalViolations()).toBe(total);
  });

  it('computes totalFinRevenue from financialMonths', () => {
    const total = component.financialMonths().reduce((sum, f) => sum + f.revenue, 0);
    expect(component.totalFinRevenue()).toBe(total);
  });

  it('computes collectionRate from financialSummary', () => {
    const summary = component.financialSummary();
    const expected = (summary.collected / (summary.collected + summary.outstanding)) * 100;
    expect(component.collectionRate()).toBeCloseTo(expected);
  });

  it('switches reportType when set', () => {
    component.reportType.set('staff');
    expect(component.reportType()).toBe('staff');
    component.reportType.set('financial');
    expect(component.reportType()).toBe('financial');
  });

  it('getSuccessGradient returns correct gradient by rate', () => {
    expect(component.getSuccessGradient(95)).toContain('#66bb6a');
    expect(component.getSuccessGradient(75)).toContain('#ffa726');
    expect(component.getSuccessGradient(60)).toContain('#ef5350');
  });

  it('getRateBadgeClass returns correct class by rate', () => {
    expect(component.getRateBadgeClass(90)).toBe('rate-high');
    expect(component.getRateBadgeClass(80)).toBe('rate-mid');
    expect(component.getRateBadgeClass(60)).toBe('rate-low');
  });

  it('getBarHeight computes percentage correctly', () => {
    expect(component.getBarHeight(50, 100)).toBe(50);
    expect(component.getBarHeight(0, 100)).toBe(0);
    expect(component.getBarHeight(10, 0)).toBe(0);
  });

  it('getInitials extracts up to 2 initials', () => {
    expect(component.getInitials('Sarah Johnson')).toBe('SJ');
    expect(component.getInitials('Bob')).toBe('B');
  });
});
