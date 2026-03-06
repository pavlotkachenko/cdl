import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ParalegalDashboardComponent } from './paralegal-dashboard.component';
import { AuthService } from '../../../core/services/auth.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const MOCK_USER = { id: 'u1', name: 'Jane Smith', email: 'jane@firm.com', role: 'paralegal' };

describe('ParalegalDashboardComponent', () => {
  let fixture: ComponentFixture<ParalegalDashboardComponent>;
  let component: ParalegalDashboardComponent;
  let authServiceSpy: { currentUserValue: typeof MOCK_USER | null };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authServiceSpy = { currentUserValue: MOCK_USER };
    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ParalegalDashboardComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ParalegalDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ------------------------------------------------------------------
  // Initial / loading state
  // ------------------------------------------------------------------
  it('starts in loading state', () => {
    // constructor fires loadDashboardData() which sets loading(true) synchronously
    // setTimeout(0) hasn't resolved yet at this point
    expect(component.loading()).toBe(true);
  });

  it('shows dashboard after loading completes', () => {
    component.loading.set(false);
    fixture.detectChanges();
    expect(component.error()).toBe('');
  });

  // ------------------------------------------------------------------
  // User info
  // ------------------------------------------------------------------
  it('firstName returns first word of user name', () => {
    expect(component.firstName()).toBe('Jane');
  });

  it('firstName returns "there" when user is null', () => {
    authServiceSpy.currentUserValue = null;
    expect(component.firstName()).toBe('there');
  });

  // ------------------------------------------------------------------
  // Greeting
  // ------------------------------------------------------------------
  it('greeting returns a time-of-day string', () => {
    const g = component.greeting();
    expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(g);
  });

  // ------------------------------------------------------------------
  // Stats defaults
  // ------------------------------------------------------------------
  it('stats are initialised to zero', () => {
    const s = component.stats();
    expect(s.assignedCases).toBe(0);
    expect(s.pendingTasks).toBe(0);
    expect(s.upcomingDeadlines).toBe(0);
    expect(s.documentsToReview).toBe(0);
  });

  // ------------------------------------------------------------------
  // loadDashboardData retry
  // ------------------------------------------------------------------
  it('loadDashboardData sets loading true and clears error', () => {
    component.error.set('some error');
    component.loading.set(false);
    component.loadDashboardData();
    expect(component.loading()).toBe(true);
    expect(component.error()).toBe('');
  });

  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------
  it('navigateToCases navigates to /paralegal/cases', () => {
    component.navigateToCases();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/paralegal/cases']);
  });

  it('navigateToDocuments navigates to /paralegal/documents', () => {
    component.navigateToDocuments();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/paralegal/documents']);
  });

  it('navigateToCalendar navigates to /paralegal/calendar', () => {
    component.navigateToCalendar();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/paralegal/calendar']);
  });

  it('navigateToTasks navigates to /paralegal/tasks', () => {
    component.navigateToTasks();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/paralegal/tasks']);
  });
});
