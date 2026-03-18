// ============================================
// Layout Component - Main App Layout
// Location: frontend/src/app/core/layout/layout.component.ts
// ============================================

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
// MatToolbarModule removed — using custom topbar
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TranslateModule } from '@ngx-translate/core';

// Components
import { SidebarComponent } from './sidebar/sidebar.component';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';

// Services
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    SidebarComponent,
    NotificationBellComponent,
    LanguageSwitcherComponent,
    TranslateModule,
  ]
})
export class LayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  private destroy$ = new Subject<void>();

  // Sidenav state
  sidenavMode: 'over' | 'side' = 'side';
  sidenavOpened = true;
  isMobile = false;
  sidebarCollapsed = false;

  // User info
  userName = 'John Doe';
  userEmail = 'john.doe@example.com';
  userRole = '';

  // Footer state
  footerCollapsed = false;
  currentYear = new Date().getFullYear();

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.setupResponsive();
    this.loadUserInfo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // Responsive Behavior
  // ============================================

  private setupResponsive(): void {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
        
        if (this.isMobile) {
          // Mobile: overlay mode, closed by default
          this.sidenavMode = 'over';
          this.sidenavOpened = false;
        } else {
          // Desktop: side mode, open by default
          this.sidenavMode = 'side';
          this.sidenavOpened = true;
        }
      });
  }

  // ============================================
  // Sidebar Toggle
  // ============================================

  toggleSidebar(): void {
    if (this.isMobile) {
      // Mobile: use overlay toggle
      if (this.sidenav) {
        this.sidenav.toggle();
      } else {
        this.sidenavOpened = !this.sidenavOpened;
      }
    } else {
      // Desktop: collapse/expand the sidebar
      this.sidebarCollapsed = !this.sidebarCollapsed;
      if (this.sidebarCollapsed) {
        this.sidenavOpened = false;
      } else {
        this.sidenavOpened = true;
      }
    }
  }

  closeSidebarOnMobile(): void {
    if (this.isMobile && this.sidenav) {
      this.sidenav.close();
    }
  }

  // ============================================
  // User Info
  // ============================================

  private loadUserInfo(): void {
    // In production, load from auth service or local storage
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.userName = user.name || 'John Doe';
        this.userEmail = user.email || 'john.doe@example.com';
        this.userRole = user.role || '';
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }

  // ============================================
  // User Actions
  // ============================================

  toggleFooter(): void {
    this.footerCollapsed = !this.footerCollapsed;
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
