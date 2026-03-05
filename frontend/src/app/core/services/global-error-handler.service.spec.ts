import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GlobalErrorHandler } from './global-error-handler.service';

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let snackBar: MatSnackBar;
  let openSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule, NoopAnimationsModule],
      providers: [GlobalErrorHandler]
    });
    handler = TestBed.inject(GlobalErrorHandler);
    snackBar = TestBed.inject(MatSnackBar);
    openSpy = spyOn(snackBar, 'open');
  });

  it('should show generic snackbar on error', () => {
    handler.handleError(new Error('test error'));
    expect(openSpy).toHaveBeenCalledWith(
      'Something went wrong. Please try again.',
      'Dismiss',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should log error to console', () => {
    const consoleSpy = spyOn(console, 'error');
    const err = new Error('boom');
    handler.handleError(err);
    expect(consoleSpy).toHaveBeenCalledWith('[GlobalErrorHandler]', err);
  });

  it('should not rethrow the error', () => {
    expect(() => handler.handleError(new Error('silent'))).not.toThrow();
  });
});
