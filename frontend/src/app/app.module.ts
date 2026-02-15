// ============================================
// Main Application Module - FIXED
// ============================================
// Location: frontend/src/app/app.module.ts

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

// Корневые компоненты и модули
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
//import { routes } from './app-routing.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { routes } from './app.routes';
import { LandingFooterComponent } from './features/landing/components/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from './features/landing/components/landing-header/landing-header.component';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    SharedModule,
    LandingFooterComponent,
    LandingHeaderComponent,
    // Настраиваем маршрутизацию напрямую через константу routes
    RouterModule.forRoot(routes, { 
      // useHash помогает избежать проблем с 404 при перезагрузке страницы на dev-сервере
     //  useHash: true, 
      // Автоматическая прокрутка страницы вверх при переходе между маршрутами
      scrollPositionRestoration: 'top' 
    })
  ],
  providers: [ {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }],
  bootstrap: [AppComponent]
})
export class AppModule { }
