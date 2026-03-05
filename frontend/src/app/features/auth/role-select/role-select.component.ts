import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-role-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="role-select-page">
      <div class="role-select-container">
        <h1 class="role-select-title">Get Started</h1>
        <p class="role-select-subtitle">Choose your account type to continue</p>

        <div class="role-cards">
          <button
            class="role-card"
            (click)="goToDriver()"
            aria-label="Sign up as a Driver">
            <mat-icon class="role-icon">drive_eta</mat-icon>
            <span class="role-label">I'm a Driver</span>
            <span class="role-description">Submit and track CDL tickets</span>
            <mat-icon class="arrow-icon">arrow_forward</mat-icon>
          </button>

          <button
            class="role-card"
            (click)="goToCarrier()"
            aria-label="Sign up as a Carrier">
            <mat-icon class="role-icon">local_shipping</mat-icon>
            <span class="role-label">I'm a Carrier</span>
            <span class="role-description">Manage your fleet and drivers</span>
            <mat-icon class="arrow-icon">arrow_forward</mat-icon>
          </button>
        </div>

        <p class="sign-in-prompt">
          Already have an account?
          <a routerLink="/sign-in" class="sign-in-link">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .role-select-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      background: #f5f5f5;
    }

    .role-select-container {
      width: 100%;
      max-width: 480px;
      text-align: center;
    }

    .role-select-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 8px;
      color: #1a1a2e;
    }

    .role-select-subtitle {
      font-size: 1rem;
      color: #666;
      margin: 0 0 40px;
    }

    .role-cards {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 32px;
    }

    .role-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      background: #fff;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      cursor: pointer;
      text-align: left;
      width: 100%;
      min-height: 80px;
      transition: border-color 0.2s, box-shadow 0.2s;
      font-family: inherit;
    }

    .role-card:hover,
    .role-card:focus-visible {
      border-color: #1976d2;
      box-shadow: 0 4px 16px rgba(25, 118, 210, 0.15);
      outline: none;
    }

    .role-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #1976d2;
      flex-shrink: 0;
    }

    .role-label {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a1a2e;
      flex: 1;
    }

    .role-description {
      display: block;
      font-size: 0.85rem;
      color: #666;
      margin-top: 2px;
    }

    .arrow-icon {
      color: #bbb;
      flex-shrink: 0;
    }

    .role-card:hover .arrow-icon,
    .role-card:focus-visible .arrow-icon {
      color: #1976d2;
    }

    .sign-in-prompt {
      font-size: 0.9rem;
      color: #666;
    }

    .sign-in-link {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }

    .sign-in-link:hover {
      text-decoration: underline;
    }

    @media (min-width: 600px) {
      .role-cards {
        flex-direction: row;
      }

      .role-card {
        flex-direction: column;
        text-align: center;
        padding: 32px 24px;
        min-height: 180px;
        justify-content: center;
        align-items: center;
      }

      .role-label {
        flex: none;
      }

      .role-description {
        text-align: center;
      }

      .arrow-icon {
        display: none;
      }
    }
  `]
})
export class RoleSelectComponent {
  private router = inject(Router);

  goToDriver(): void {
    this.router.navigate(['/signup/driver']);
  }

  goToCarrier(): void {
    this.router.navigate(['/signup/carrier']);
  }
}
