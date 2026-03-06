import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { RatingPromptComponent } from './rating-prompt.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [RatingPromptComponent, NoopAnimationsModule],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  }).compileComponents();

  const fixture = TestBed.createComponent(RatingPromptComponent);
  fixture.componentRef.setInput('caseId', 'c1');
  fixture.detectChanges();
  const httpMock = TestBed.inject(HttpTestingController);
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  return { fixture, component: fixture.componentInstance, httpMock, snackBar };
}

describe('RatingPromptComponent (RT-2)', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('renders star buttons and submit button', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    const starButtons = el.querySelectorAll('.stars button');
    expect(starButtons.length).toBe(5);
    expect(el.textContent).toContain('Submit Rating');
  });

  it('submit button is disabled when no star is selected', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    const submitBtn = el.querySelector('button[color="primary"]') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it('selectStar updates selectedScore signal', async () => {
    const { component } = await setup();
    component.selectStar(4);
    expect(component.selectedScore()).toBe(4);
  });

  it('submit() POSTs to /api/ratings and sets submitted on success', async () => {
    const { component, fixture, httpMock } = await setup();
    component.selectStar(5);
    component.submit();

    const req = httpMock.expectOne(`${environment.apiUrl}/ratings`);
    expect(req.request.body).toEqual({ case_id: 'c1', score: 5 });
    req.flush({ rating: { id: 'r1' } });

    fixture.detectChanges();
    expect(component.submitted()).toBe(true);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Thanks for your feedback');
  });

  it('shows snackbar error when submit fails', async () => {
    const { component, httpMock, snackBar } = await setup();
    component.selectStar(3);
    component.submit();

    const req = httpMock.expectOne(`${environment.apiUrl}/ratings`);
    req.flush({ error: 'Server error' }, { status: 500, statusText: 'Error' });

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to submit rating. Please try again.', 'Close', { duration: 3000 },
    );
  });
});
