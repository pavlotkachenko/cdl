import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';

const ROLE_DASHBOARDS: Record<string, string> = {
  admin: '/admin/dashboard',
  attorney: '/attorney/dashboard',
  paralegal: '/attorney/dashboard',
  operator: '/operator/dashboard',
  carrier: '/carrier/dashboard',
  driver: '/driver/dashboard',
};

@Component({
  selector: 'app-oauth-callback',
  template: `
    <div class="callback-container">
      <mat-spinner diameter="48"></mat-spinner>
      <p>Completing sign-in...</p>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 16px;
      color: #666;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, MatSnackBarModule],
})
export class OAuthCallbackComponent implements OnInit {
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  async ngOnInit(): Promise<void> {
    try {
      // Supabase puts tokens in the URL hash after OAuth redirect
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');

      if (!accessToken) {
        // Try query params as fallback (some flows use code exchange)
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');
        if (code) {
          // Exchange the code for a session via Supabase
          const { data, error } = await this.supabaseService.auth.exchangeCodeForSession(code);
          if (error || !data.session) {
            throw new Error(error?.message || 'Failed to exchange code');
          }
          this.exchangeToken(data.session.access_token);
          return;
        }
        throw new Error('No access token found');
      }

      this.exchangeToken(accessToken);
    } catch {
      this.snackBar.open('Social login failed. Please try again.', 'Close', { duration: 4000 });
      this.router.navigate(['/login']);
    }
  }

  private exchangeToken(supabaseAccessToken: string): void {
    this.authService.exchangeOAuthToken(supabaseAccessToken).subscribe({
      next: (response) => {
        const destination = ROLE_DASHBOARDS[response.user.role] ?? '/driver/dashboard';
        this.router.navigate([destination]);
      },
      error: () => {
        this.snackBar.open('Social login failed. Please try again.', 'Close', { duration: 4000 });
        this.router.navigate(['/login']);
      }
    });
  }
}
