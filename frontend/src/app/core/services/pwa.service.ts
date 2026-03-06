import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PwaService {
  private swUpdate = inject(SwUpdate);

  readonly online = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly updateAvailable = signal(false);

  constructor() {
    fromEvent(window, 'online').subscribe(() => this.online.set(true));
    fromEvent(window, 'offline').subscribe(() => this.online.set(false));

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
        .subscribe(() => this.updateAvailable.set(true));
    }
  }

  activateUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) return Promise.resolve(false);
    return this.swUpdate.activateUpdate().then(() => true);
  }
}
