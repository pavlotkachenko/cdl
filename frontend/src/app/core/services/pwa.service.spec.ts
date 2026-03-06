import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { PwaService } from './pwa.service';
import { SwUpdate, VersionEvent } from '@angular/service-worker';

function makeSwUpdateSpy(enabled = true) {
  const versionUpdates$ = new Subject<VersionEvent>();
  return {
    isEnabled: enabled,
    versionUpdates: versionUpdates$.asObservable(),
    activateUpdate: vi.fn().mockResolvedValue(undefined),
    _subject: versionUpdates$,
  };
}

async function setup(swSpy = makeSwUpdateSpy()) {
  await TestBed.configureTestingModule({
    providers: [
      PwaService,
      { provide: SwUpdate, useValue: swSpy },
    ],
  }).compileComponents();
  const service = TestBed.inject(PwaService);
  return { service, swSpy };
}

describe('PwaService', () => {
  it('online signal defaults to true', async () => {
    const { service } = await setup();
    expect(service.online()).toBe(true);
  });

  it('updateAvailable defaults to false', async () => {
    const { service } = await setup();
    expect(service.updateAvailable()).toBe(false);
  });

  it('updateAvailable becomes true when VERSION_READY fires', async () => {
    const swSpy = makeSwUpdateSpy(true);
    const { service } = await setup(swSpy);
    swSpy._subject.next({ type: 'VERSION_READY', previousVersion: { hash: 'a' }, currentVersion: { hash: 'b' } } as any);
    expect(service.updateAvailable()).toBe(true);
  });

  it('activateUpdate calls swUpdate.activateUpdate when enabled', async () => {
    const swSpy = makeSwUpdateSpy(true);
    const { service } = await setup(swSpy);
    await service.activateUpdate();
    expect(swSpy.activateUpdate).toHaveBeenCalled();
  });

  it('activateUpdate returns false when service worker is disabled', async () => {
    const { service } = await setup(makeSwUpdateSpy(false));
    const result = await service.activateUpdate();
    expect(result).toBe(false);
  });

  it('does not subscribe to versionUpdates when SW is disabled', async () => {
    const swSpy = makeSwUpdateSpy(false);
    const { service } = await setup(swSpy);
    swSpy._subject.next({ type: 'VERSION_READY', previousVersion: { hash: 'a' }, currentVersion: { hash: 'b' } } as any);
    expect(service.updateAvailable()).toBe(false);
  });
});
