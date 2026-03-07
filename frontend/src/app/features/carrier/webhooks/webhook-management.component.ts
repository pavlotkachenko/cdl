import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { environment } from '../../../../environments/environment';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
  secret?: string;
}

const ALL_EVENTS = ['case.created', 'case.status_changed', 'attorney.assigned', 'payment.received'];

@Component({
  selector: 'app-webhook-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatCheckboxModule, MatChipsModule,
    MatSlideToggleModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page">
      <h1>Webhook Endpoints</h1>
      <p class="subtitle">Receive real-time events at your server when cases or payments change.</p>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      }

      <!-- Existing webhooks -->
      @for (wh of webhooks(); track wh.id) {
        <mat-card class="wh-card">
          <mat-card-content>
            <div class="wh-row">
              <span class="wh-url">{{ wh.url }}</span>
              <mat-slide-toggle
                [checked]="wh.active"
                (change)="toggleActive(wh, $event.checked)"
                aria-label="Toggle active">
              </mat-slide-toggle>
              <button mat-icon-button color="warn" (click)="deleteWebhook(wh.id)" aria-label="Delete webhook">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
            <div class="chip-row">
              @for (ev of wh.events; track ev) {
                <span class="chip">{{ ev }}</span>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Add webhook form -->
      <mat-card class="add-card">
        <mat-card-header><mat-card-title>Add Webhook</mat-card-title></mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Endpoint URL</mat-label>
            <input matInput [(ngModel)]="newUrl" placeholder="https://your-server.com/webhook" />
          </mat-form-field>

          <p class="events-label">Events to subscribe to:</p>
          <div class="events-grid">
            @for (ev of allEvents; track ev) {
              <mat-checkbox
                [checked]="newEvents().includes(ev)"
                (change)="toggleEvent(ev, $event.checked)">
                {{ ev }}
              </mat-checkbox>
            }
          </div>

          <button mat-raised-button color="primary"
            [disabled]="saving()"
            (click)="saveWebhook()">
            @if (saving()) { Saving… } @else { Add Webhook }
          </button>
        </mat-card-content>
      </mat-card>

      <!-- Secret reveal (shown once) -->
      @if (newSecret()) {
        <mat-card class="secret-card">
          <mat-card-content>
            <p><strong>Webhook secret (shown once — copy it now):</strong></p>
            <div class="secret-row">
              <code>{{ newSecret() }}</code>
              <button mat-icon-button (click)="copySecret()" aria-label="Copy secret">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 720px; margin: 24px auto; padding: 0 16px; }
    .subtitle { color: #666; margin-top: -8px; margin-bottom: 16px; }
    .center { display: flex; justify-content: center; padding: 32px; }
    .wh-card { margin-bottom: 12px; }
    .wh-row { display: flex; align-items: center; gap: 8px; }
    .wh-url { flex: 1; font-family: monospace; font-size: 13px; word-break: break-all; }
    .chip-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .chip { background: #e3f2fd; color: #1565c0; border-radius: 12px; padding: 2px 10px; font-size: 12px; }
    .add-card { margin-top: 20px; }
    .full-width { width: 100%; }
    .events-label { font-weight: 500; margin-bottom: 4px; }
    .events-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 16px; }
    .secret-card { margin-top: 16px; background: #fff8e1; }
    .secret-row { display: flex; align-items: center; gap: 8px; }
    code { font-size: 13px; word-break: break-all; }
  `],
})
export class WebhookManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private clipboard = inject(Clipboard);

  readonly allEvents = ALL_EVENTS;
  webhooks = signal<Webhook[]>([]);
  loading = signal(false);
  saving = signal(false);
  newSecret = signal<string | null>(null);

  newUrl = '';
  newEvents = signal<string[]>([]);

  private get apiBase() { return `${environment.apiUrl}/webhooks`; }

  ngOnInit(): void { this.loadWebhooks(); }

  loadWebhooks(): void {
    this.loading.set(true);
    this.http.get<{ webhooks: Webhook[] }>(this.apiBase).subscribe({
      next: ({ webhooks }) => { this.webhooks.set(webhooks); this.loading.set(false); },
      error: () => { this.snackBar.open('Failed to load webhooks', 'Close', { duration: 3000 }); this.loading.set(false); },
    });
  }

  toggleEvent(ev: string, checked: boolean): void {
    this.newEvents.update(arr => checked ? [...arr, ev] : arr.filter(e => e !== ev));
  }

  saveWebhook(): void {
    if (!this.newUrl || this.newEvents().length === 0) {
      this.snackBar.open('URL and at least one event are required', 'Close', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    this.http.post<{ webhook: Webhook }>(this.apiBase, { url: this.newUrl, events: this.newEvents() }).subscribe({
      next: ({ webhook }) => {
        this.webhooks.update(arr => [webhook, ...arr]);
        this.newSecret.set(webhook.secret ?? null);
        this.newUrl = '';
        this.newEvents.set([]);
        this.saving.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.error ?? 'Failed to create webhook', 'Close', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }

  toggleActive(wh: Webhook, active: boolean): void {
    this.http.put<{ webhook: Webhook }>(`${this.apiBase}/${wh.id}`, { active }).subscribe({
      next: ({ webhook }) => this.webhooks.update(arr => arr.map(w => w.id === wh.id ? webhook : w)),
      error: () => this.snackBar.open('Failed to update webhook', 'Close', { duration: 3000 }),
    });
  }

  deleteWebhook(id: string): void {
    this.http.delete(`${this.apiBase}/${id}`).subscribe({
      next: () => this.webhooks.update(arr => arr.filter(w => w.id !== id)),
      error: () => this.snackBar.open('Failed to delete webhook', 'Close', { duration: 3000 }),
    });
  }

  copySecret(): void {
    const s = this.newSecret();
    if (s) {
      this.clipboard.copy(s);
      this.snackBar.open('Secret copied!', undefined, { duration: 2000 });
    }
  }
}
