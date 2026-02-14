import { Injectable } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustomBreakpointService {
  constructor(private breakpointObserver: BreakpointObserver) {}

  isTabletOrDesktop(): boolean {
    return this.breakpointObserver.isMatched([
      Breakpoints.Tablet,
      Breakpoints.Web
    ]);
  }

  isMobile(): boolean {
    return this.breakpointObserver.isMatched(Breakpoints.Handset);
  }

  isTabletOrDesktop$(): Observable<boolean> {
    return this.breakpointObserver
      .observe([Breakpoints.Tablet, Breakpoints.Web])
      .pipe(map(result => result.matches));
  }
}
