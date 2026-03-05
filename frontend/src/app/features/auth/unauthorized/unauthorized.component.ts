import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

const ROLE_DASHBOARDS: Record<string, string> = {
  admin: '/admin/dashboard',
  attorney: '/attorney/dashboard',
  paralegal: '/attorney/dashboard',
  operator: '/operator/dashboard',
  carrier: '/carrier/dashboard',
  driver: '/driver/dashboard',
};

@Component({
  selector: 'app-unauthorized',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="unauthorized-container">
      <mat-icon class="lock-icon" aria-hidden="true">lock</mat-icon>
      <h1>Access Denied</h1>
      <p>You don't have permission to view this page.</p>

      @if (dashboardUrl) {
        <button mat-raised-button color="primary" (click)="goToDashboard()">
          Go to my dashboard
        </button>
      }

      <button mat-stroked-button (click)="signOut()">Sign out</button>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 16px;
      padding: 24px;
      text-align: center;
    }
    .lock-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #f44336;
    }
    h1 {
      margin: 0;
      font-size: 2rem;
    }
    p {
      margin: 0;
      color: rgba(0,0,0,.6);
    }
    button {
      min-width: 200px;
    }
  `],
})
export class UnauthorizedComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  get dashboardUrl(): string | null {
    const role = this.authService.getUserRole();
    return role ? (ROLE_DASHBOARDS[role] ?? null) : null;
  }

  goToDashboard(): void {
    const url = this.dashboardUrl;
    if (url) this.router.navigate([url]);
  }

  signOut(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
