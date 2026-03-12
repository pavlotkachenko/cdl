import {
  Component, ChangeDetectionStrategy, signal, computed, inject,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

interface AttorneyClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  cdlNumber: string;
  state: string;
  totalCases: number;
  activeCases: number;
  lastContact: string;
  createdAt: string;
  satisfaction: number;
}

const MOCK_CLIENTS: AttorneyClient[] = [
  {
    id: 'ac-001',
    name: 'Marcus Johnson',
    email: 'marcus.johnson@gmail.com',
    phone: '(312) 555-0147',
    cdlNumber: 'CDL-IL-884210',
    state: 'IL',
    totalCases: 5,
    activeCases: 2,
    lastContact: '2026-03-08',
    createdAt: '2024-08-12',
    satisfaction: 4.5,
  },
  {
    id: 'ac-002',
    name: 'Priya Patel',
    email: 'priya.patel@outlook.com',
    phone: '(214) 555-0293',
    cdlNumber: 'CDL-TX-337891',
    state: 'TX',
    totalCases: 2,
    activeCases: 1,
    lastContact: '2026-03-05',
    createdAt: '2026-02-20',
    satisfaction: 5.0,
  },
  {
    id: 'ac-003',
    name: 'Carlos Menendez',
    email: 'carlos.m@yahoo.com',
    phone: '(305) 555-0418',
    cdlNumber: 'CDL-FL-556023',
    state: 'FL',
    totalCases: 8,
    activeCases: 3,
    lastContact: '2026-02-28',
    createdAt: '2023-11-03',
    satisfaction: 4.0,
  },
  {
    id: 'ac-004',
    name: 'Aisha Williams',
    email: 'aisha.w@protonmail.com',
    phone: '(404) 555-0562',
    cdlNumber: 'CDL-GA-221074',
    state: 'GA',
    totalCases: 3,
    activeCases: 1,
    lastContact: '2026-03-10',
    createdAt: '2025-06-14',
    satisfaction: 4.8,
  },
  {
    id: 'ac-005',
    name: 'Tomasz Kowalski',
    email: 'tkowalski@gmail.com',
    phone: '(718) 555-0831',
    cdlNumber: 'CDL-NY-449382',
    state: 'NY',
    totalCases: 4,
    activeCases: 0,
    lastContact: '2025-12-15',
    createdAt: '2024-03-22',
    satisfaction: 3.5,
  },
  {
    id: 'ac-006',
    name: 'Fatima Al-Rashid',
    email: 'fatima.alrashid@gmail.com',
    phone: '(313) 555-0177',
    cdlNumber: 'CDL-MI-773401',
    state: 'MI',
    totalCases: 1,
    activeCases: 0,
    lastContact: '2025-11-02',
    createdAt: '2025-09-08',
    satisfaction: 4.2,
  },
  {
    id: 'ac-007',
    name: 'James O\'Brien',
    email: 'jobrien@truckers.net',
    phone: '(503) 555-0624',
    cdlNumber: 'CDL-OR-118956',
    state: 'OR',
    totalCases: 6,
    activeCases: 2,
    lastContact: '2026-03-01',
    createdAt: '2024-01-17',
    satisfaction: 4.7,
  },
  {
    id: 'ac-008',
    name: 'Rosa Gutierrez',
    email: 'rosa.g@hotmail.com',
    phone: '(602) 555-0953',
    cdlNumber: 'CDL-AZ-665847',
    state: 'AZ',
    totalCases: 1,
    activeCases: 1,
    lastContact: '2026-03-09',
    createdAt: '2026-03-02',
    satisfaction: 4.9,
  },
  {
    id: 'ac-009',
    name: 'Darnell Washington',
    email: 'dwashington@gmail.com',
    phone: '(901) 555-0246',
    cdlNumber: 'CDL-TN-992310',
    state: 'TN',
    totalCases: 7,
    activeCases: 5,
    lastContact: '2026-03-09',
    createdAt: '2023-05-29',
    satisfaction: 3.8,
  },
  {
    id: 'ac-010',
    name: 'Linh Nguyen',
    email: 'linh.nguyen@gmail.com',
    phone: '(206) 555-0715',
    cdlNumber: 'CDL-WA-504129',
    state: 'WA',
    totalCases: 3,
    activeCases: 2,
    lastContact: '2026-02-18',
    createdAt: '2025-12-01',
    satisfaction: 4.3,
  },
];

@Component({
  selector: 'app-attorney-clients',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatTooltipModule,
    TranslateModule,
  ],
  styles: [`
    .attorney-clients {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* ---- Page Header ---- */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 28px;
    }
    .page-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: -0.5px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .header-actions mat-form-field {
      width: 300px;
    }

    /* ---- Stats Row ---- */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }
    .stat-card {
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }
    .stat-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon-wrap mat-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
      color: #fff;
    }
    .stat-icon-wrap.total  { background: linear-gradient(135deg, #667eea, #764ba2); }
    .stat-icon-wrap.active { background: linear-gradient(135deg, #11998e, #38ef7d); }
    .stat-icon-wrap.new    { background: linear-gradient(135deg, #f093fb, #f5576c); }
    .stat-icon-wrap.avg    { background: linear-gradient(135deg, #4facfe, #00f2fe); }
    .stat-body {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 13px;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 800;
      color: #1a1a2e;
      line-height: 1.1;
    }

    /* ---- Client Grid ---- */
    .client-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    /* ---- Client Card ---- */
    .client-card {
      border-radius: 16px;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 1px solid #e5e7eb;
    }
    .client-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    }
    .card-top {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px 20px 12px;
    }
    .client-avatar {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
      letter-spacing: 1px;
    }
    .avatar-active   { background: linear-gradient(135deg, #11998e, #38ef7d); }
    .avatar-inactive { background: linear-gradient(135deg, #8e9eab, #b0bec5); }

    .client-header {
      flex: 1;
      min-width: 0;
    }
    .client-name {
      font-size: 17px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .client-email {
      font-size: 13px;
      color: #6b7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Card details */
    .card-details {
      padding: 0 20px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .detail-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #4b5563;
    }
    .detail-row mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #9ca3af;
      flex-shrink: 0;
    }
    .detail-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Satisfaction */
    .satisfaction-row {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 20px 12px;
    }
    .satisfaction-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .star-filled {
      color: #f59e0b;
    }
    .star-half {
      color: #f59e0b;
    }
    .star-empty {
      color: #d1d5db;
    }
    .satisfaction-score {
      font-size: 13px;
      font-weight: 600;
      color: #4b5563;
      margin-left: 4px;
    }

    /* Card footer */
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      background: #f9fafb;
      border-top: 1px solid #f3f4f6;
    }
    .case-stats {
      display: flex;
      gap: 16px;
    }
    .case-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .case-stat-value {
      font-size: 20px;
      font-weight: 800;
      color: #1a1a2e;
      line-height: 1;
    }
    .case-stat-value.active-cases {
      color: #059669;
    }
    .case-stat-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9ca3af;
      margin-top: 2px;
    }
    .last-contact {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .last-contact-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9ca3af;
    }
    .last-contact-value {
      font-size: 13px;
      color: #4b5563;
      font-weight: 500;
    }

    /* Card actions bar */
    .card-actions {
      display: flex;
      border-top: 1px solid #f3f4f6;
    }
    .card-actions button {
      flex: 1;
      border-radius: 0;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 0;
    }
    .card-actions button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 4px;
    }

    /* ---- Empty State ---- */
    .empty-state {
      text-align: center;
      padding: 80px 20px;
    }
    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #d1d5db;
      margin-bottom: 16px;
    }
    .empty-state p {
      font-size: 18px;
      color: #6b7280;
      margin: 0 0 16px;
    }

    /* ---- Responsive ---- */
    @media (max-width: 1100px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 768px) {
      .client-grid {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 600px) {
      .attorney-clients {
        padding: 16px;
      }
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }
      .header-actions {
        flex-direction: column;
      }
      .header-actions mat-form-field {
        width: 100%;
      }
      .stats-row {
        grid-template-columns: 1fr;
      }
      .client-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  template: `
    <div class="attorney-clients">
      <!-- Page Header -->
      <div class="page-header">
        <h1>{{ 'ATT.CLIENTS_TITLE' | translate }}</h1>
        <div class="header-actions">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'ATT.SEARCH_CLIENTS' | translate }}</mat-label>
            <input matInput [value]="searchTerm()"
              (input)="searchTerm.set($any($event.target).value)"
              [placeholder]="'ATT.SEARCH_PLACEHOLDER' | translate">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="addClient()">
            <mat-icon>person_add</mat-icon> {{ 'ATT.ADD_CLIENT' | translate }}
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <mat-card class="stat-card" appearance="outlined">
          <div class="stat-icon-wrap total">
            <mat-icon>groups</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-label">{{ 'ATT.TOTAL_CLIENTS' | translate }}</span>
            <span class="stat-value">{{ totalClients() }}</span>
          </div>
        </mat-card>

        <mat-card class="stat-card" appearance="outlined">
          <div class="stat-icon-wrap active">
            <mat-icon>verified_user</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-label">{{ 'ATT.ACTIVE_CLIENTS' | translate }}</span>
            <span class="stat-value">{{ activeClients() }}</span>
          </div>
        </mat-card>

        <mat-card class="stat-card" appearance="outlined">
          <div class="stat-icon-wrap new">
            <mat-icon>person_add</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-label">{{ 'ATT.NEW_THIS_MONTH' | translate }}</span>
            <span class="stat-value">{{ newThisMonth() }}</span>
          </div>
        </mat-card>

        <mat-card class="stat-card" appearance="outlined">
          <div class="stat-icon-wrap avg">
            <mat-icon>analytics</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-label">{{ 'ATT.AVG_CASES_CLIENT' | translate }}</span>
            <span class="stat-value">{{ avgCasesPerClient() }}</span>
          </div>
        </mat-card>
      </div>

      <!-- Client Grid or Empty State -->
      @if (filteredClients().length === 0) {
        <div class="empty-state">
          <mat-icon>people_outline</mat-icon>
          <p>{{ 'ATT.NO_CLIENTS' | translate }}</p>
          @if (searchTerm()) {
            <button mat-stroked-button (click)="searchTerm.set('')">
              <mat-icon>clear</mat-icon> {{ 'ATT.CLEAR_SEARCH' | translate }}
            </button>
          }
        </div>
      } @else {
        <div class="client-grid">
          @for (client of filteredClients(); track client.id) {
            <mat-card class="client-card" appearance="outlined">
              <!-- Top: Avatar + Name -->
              <div class="card-top">
                <div class="client-avatar"
                     [class.avatar-active]="client.activeCases > 0"
                     [class.avatar-inactive]="client.activeCases === 0">
                  {{ getInitials(client.name) }}
                </div>
                <div class="client-header">
                  <div class="client-name" [matTooltip]="client.name">{{ client.name }}</div>
                  <div class="client-email" [matTooltip]="client.email">{{ client.email }}</div>
                </div>
              </div>

              <!-- Details -->
              <div class="card-details">
                <div class="detail-row">
                  <mat-icon>phone</mat-icon>
                  <span class="detail-text">{{ client.phone }}</span>
                </div>
                <div class="detail-row">
                  <mat-icon>badge</mat-icon>
                  <span class="detail-text">{{ 'ATT.CDL_LABEL' | translate }}: {{ client.cdlNumber }}</span>
                </div>
                <div class="detail-row">
                  <mat-icon>location_on</mat-icon>
                  <span class="detail-text">{{ client.state }}</span>
                </div>
              </div>

              <!-- Satisfaction Stars -->
              <div class="satisfaction-row" [attr.aria-label]="'ATT.SATISFACTION' | translate">
                @for (star of getStars(client.satisfaction); track $index) {
                  @switch (star) {
                    @case ('full') {
                      <mat-icon class="star-filled">star</mat-icon>
                    }
                    @case ('half') {
                      <mat-icon class="star-half">star_half</mat-icon>
                    }
                    @case ('empty') {
                      <mat-icon class="star-empty">star_border</mat-icon>
                    }
                  }
                }
                <span class="satisfaction-score">{{ client.satisfaction.toFixed(1) }}</span>
              </div>

              <!-- Footer: Case stats + Last Contact -->
              <div class="card-footer">
                <div class="case-stats">
                  <div class="case-stat">
                    <span class="case-stat-value active-cases">{{ client.activeCases }}</span>
                    <span class="case-stat-label">{{ 'ATT.ACTIVE' | translate }}</span>
                  </div>
                  <div class="case-stat">
                    <span class="case-stat-value">{{ client.totalCases }}</span>
                    <span class="case-stat-label">{{ 'ATT.TOTAL' | translate }}</span>
                  </div>
                </div>
                <div class="last-contact">
                  <span class="last-contact-label">{{ 'ATT.LAST_CONTACT' | translate }}</span>
                  <span class="last-contact-value">{{ formatDate(client.lastContact) }}</span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="card-actions">
                <button mat-button color="primary" (click)="viewClient(client)"
                        [matTooltip]="'ATT.VIEW' | translate">
                  <mat-icon>visibility</mat-icon> {{ 'ATT.VIEW' | translate }}
                </button>
                <button mat-button (click)="viewCases(client)"
                        [matTooltip]="'ATT.CASES' | translate">
                  <mat-icon>folder_open</mat-icon> {{ 'ATT.CASES' | translate }}
                </button>
                <button mat-button (click)="sendMessage(client)"
                        [matTooltip]="'ATT.MESSAGE' | translate">
                  <mat-icon>mail</mat-icon> {{ 'ATT.MESSAGE' | translate }}
                </button>
              </div>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
})
export class AttorneyClientsComponent {
  private readonly snackBar = inject(MatSnackBar);

  readonly clients = signal<AttorneyClient[]>(MOCK_CLIENTS);
  readonly searchTerm = signal('');

  readonly filteredClients = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.clients();
    return this.clients().filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.cdlNumber.toLowerCase().includes(term) ||
      c.state.toLowerCase().includes(term)
    );
  });

  readonly totalClients = computed(() => this.clients().length);

  readonly activeClients = computed(() =>
    this.clients().filter(c => c.activeCases > 0).length
  );

  readonly newThisMonth = computed(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.clients().filter(c => new Date(c.createdAt) >= startOfMonth).length;
  });

  readonly avgCasesPerClient = computed(() => {
    const all = this.clients();
    if (all.length === 0) return '0';
    const avg = all.reduce((sum, c) => sum + c.totalCases, 0) / all.length;
    return avg.toFixed(1);
  });

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getStars(satisfaction: number): ('full' | 'half' | 'empty')[] {
    const stars: ('full' | 'half' | 'empty')[] = [];
    for (let i = 1; i <= 5; i++) {
      if (satisfaction >= i) {
        stars.push('full');
      } else if (satisfaction >= i - 0.5) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    return stars;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  viewClient(client: AttorneyClient): void {
    this.snackBar.open(`Viewing ${client.name} — detail coming soon`, 'Close', { duration: 3000 });
  }

  viewCases(client: AttorneyClient): void {
    this.snackBar.open(`Viewing cases for ${client.name} — coming soon`, 'Close', { duration: 3000 });
  }

  sendMessage(client: AttorneyClient): void {
    this.snackBar.open(`Messaging ${client.name} — coming soon`, 'Close', { duration: 3000 });
  }

  addClient(): void {
    this.snackBar.open('Add client feature coming soon', 'Close', { duration: 3000 });
  }
}
