import { Injectable } from '@angular/core';

const KEY_PREFIX = 'cdl_onboarding_';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  /** Returns true if the user has completed this tour. */
  isComplete(tourId: string): boolean {
    return localStorage.getItem(`${KEY_PREFIX}${tourId}`) === 'complete';
  }

  /** Marks the tour as fully complete. */
  markComplete(tourId: string): void {
    localStorage.setItem(`${KEY_PREFIX}${tourId}`, 'complete');
    localStorage.removeItem(`${KEY_PREFIX}${tourId}_step`);
  }

  /** Resets tour progress so the user sees it again next visit. */
  resetTour(tourId: string): void {
    localStorage.removeItem(`${KEY_PREFIX}${tourId}`);
    localStorage.removeItem(`${KEY_PREFIX}${tourId}_step`);
  }

  /** Returns the saved step index (0-based), defaulting to 0. */
  getCurrentStep(tourId: string): number {
    const val = localStorage.getItem(`${KEY_PREFIX}${tourId}_step`);
    return val !== null ? parseInt(val, 10) : 0;
  }

  /** Persists the current step so the user can resume. */
  saveStep(tourId: string, step: number): void {
    localStorage.setItem(`${KEY_PREFIX}${tourId}_step`, String(step));
  }
}
