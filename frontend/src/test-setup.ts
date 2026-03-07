/**
 * Vitest global test setup — runs once before all spec files.
 *
 * Initialises Angular's TestBed platform (BrowserDynamicTestingModule) so that
 * every *.spec.ts can call TestBed.configureTestingModule() without having to
 * bootstrap the platform itself.
 */
import '@angular/compiler'; // needed for JIT compilation in tests
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  { teardown: { destroyAfterEach: true } },
);
