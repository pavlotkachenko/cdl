import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { ErrorStateComponent } from './error-state.component';

describe('ErrorStateComponent', () => {
  let fixture: ComponentFixture<ErrorStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorStateComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorStateComponent);
    fixture.componentRef.setInput('message', 'Something went wrong');
    fixture.detectChanges();
  });

  it('renders the error message', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Something went wrong');
  });

  it('renders the error_outline icon', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('mat-icon')?.textContent).toContain('error_outline');
  });

  it('does not show retry button when retryLabel is empty', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('button')).toBeNull();
  });

  it('shows retry button when retryLabel is provided', () => {
    fixture.componentRef.setInput('retryLabel', 'Try again');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('button')?.textContent).toContain('Try again');
  });

  it('emits retry event when button is clicked', () => {
    fixture.componentRef.setInput('retryLabel', 'Retry');
    fixture.detectChanges();

    const retrySpy = vi.fn();
    fixture.componentInstance.retry.subscribe(retrySpy);

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    btn.click();
    expect(retrySpy).toHaveBeenCalled();
  });
});
