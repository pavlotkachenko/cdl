import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app-routing.module'; // ИМЕННО ТАК
import { provideHttpClient } from '@angular/common/http';  // ← ADD THIS
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';  // ← ADD THIS

//import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),  // ← ADD THIS
    provideAnimationsAsync()  // ← ADD THIS
  ]
};
