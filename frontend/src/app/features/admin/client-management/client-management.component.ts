import {
  Component, OnInit, ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { AdminService, Client } from '../../../core/services/admin.service';

const MOCK_CLIENTS: Client[] = [
  {
    id: 'c-001',
    name: 'Marcus Johnson',
    email: 'marcus.johnson@gmail.com',
    phone: '(312) 555-0147',
    cdlNumber: 'CDL-IL-884210',
    address: '4521 W Madison St',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60624',
    totalCases: 4,
    activeCases: 2,
    createdAt: new Date('2024-08-12'),
    lastContact: new Date('2026-03-08'),
  },
  {
    id: 'c-002',
    name: 'Priya Patel',
    email: 'priya.patel@outlook.com',
    phone: '(214) 555-0293',
    cdlNumber: 'CDL-TX-337891',
    address: '1809 Elm St',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201',
    totalCases: 1,
    activeCases: 1,
    createdAt: new Date('2026-02-20'),
    lastContact: new Date('2026-03-05'),
  },
  {
    id: 'c-003',
    name: 'Carlos Menendez',
    email: 'carlos.m@yahoo.com',
    phone: '(305) 555-0418',
    cdlNumber: 'CDL-FL-556023',
    address: '730 NW 3rd Ave',
    city: 'Miami',
    state: 'FL',
    zipCode: '33136',
    totalCases: 6,
    activeCases: 3,
    createdAt: new Date('2023-11-03'),
    lastContact: new Date('2026-02-28'),
  },
  {
    id: 'c-004',
    name: 'Aisha Williams',
    email: 'aisha.w@protonmail.com',
    phone: '(404) 555-0562',
    cdlNumber: 'CDL-GA-221074',
    address: '2200 Peachtree Rd NE',
    city: 'Atlanta',
    state: 'GA',
    zipCode: '30309',
    totalCases: 2,
    activeCases: 1,
    createdAt: new Date('2025-06-14'),
    lastContact: new Date('2026-03-10'),
  },
  {
    id: 'c-005',
    name: 'Tomasz Kowalski',
    email: 'tkowalski@gmail.com',
    phone: '(718) 555-0831',
    cdlNumber: 'CDL-NY-449382',
    address: '88-12 Queens Blvd',
    city: 'New York',
    state: 'NY',
    zipCode: '11373',
    totalCases: 3,
    activeCases: 0,
    createdAt: new Date('2024-03-22'),
    lastContact: new Date('2025-08-15'),
  },
  {
    id: 'c-006',
    name: 'Fatima Al-Rashid',
    email: 'fatima.alrashid@gmail.com',
    phone: '(313) 555-0177',
    cdlNumber: 'CDL-MI-773401',
    address: '6345 Michigan Ave',
    city: 'Detroit',
    state: 'MI',
    zipCode: '48210',
    totalCases: 1,
    activeCases: 0,
    createdAt: new Date('2025-09-08'),
    lastContact: new Date('2025-11-02'),
  },
  {
    id: 'c-007',
    name: 'James O\'Brien',
    email: 'jobrien@truckers.net',
    phone: '(503) 555-0624',
    cdlNumber: 'CDL-OR-118956',
    address: '1420 SE Belmont St',
    city: 'Portland',
    state: 'OR',
    zipCode: '97214',
    totalCases: 5,
    activeCases: 2,
    createdAt: new Date('2024-01-17'),
    lastContact: new Date('2026-03-01'),
  },
  {
    id: 'c-008',
    name: 'Rosa Gutierrez',
    email: 'rosa.g@hotmail.com',
    phone: '(602) 555-0953',
    cdlNumber: 'CDL-AZ-665847',
    address: '3800 N Central Ave',
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85012',
    totalCases: 0,
    activeCases: 0,
    createdAt: new Date('2026-03-02'),
  },
  {
    id: 'c-009',
    name: 'Darnell Washington',
    email: 'dwashington@gmail.com',
    phone: '(901) 555-0246',
    cdlNumber: 'CDL-TN-992310',
    address: '550 Beale St',
    city: 'Memphis',
    state: 'TN',
    zipCode: '38103',
    totalCases: 7,
    activeCases: 4,
    createdAt: new Date('2023-05-29'),
    lastContact: new Date('2026-03-09'),
  },
  {
    id: 'c-010',
    name: 'Linh Nguyen',
    email: 'linh.nguyen@gmail.com',
    phone: '(206) 555-0715',
    cdlNumber: 'CDL-WA-504129',
    address: '1225 S King St',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98144',
    totalCases: 2,
    activeCases: 1,
    createdAt: new Date('2025-12-01'),
    lastContact: new Date('2026-02-18'),
  },
];

type ClientStatus = 'active' | 'at-risk' | 'inactive';

@Component({
  selector: 'app-client-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatMenuModule, MatProgressSpinnerModule,
    MatTooltipModule, TranslateModule,
  ],
  styles: [`
    .client-management {
      padding: 24px;
      max-width: 1400px;
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
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
    }
    .header-actions mat-form-field {
      width: 320px;
    }
    .header-actions mat-form-field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    .header-actions button {
      height: 56px;
      min-height: 44px;
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
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
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
    .stat-icon-wrap.total   { background: linear-gradient(135deg, #667eea, #764ba2); }
    .stat-icon-wrap.active  { background: linear-gradient(135deg, #11998e, #38ef7d); }
    .stat-icon-wrap.new     { background: linear-gradient(135deg, #f093fb, #f5576c); }
    .stat-icon-wrap.avg     { background: linear-gradient(135deg, #4facfe, #00f2fe); }
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

    /* ---- Loading ---- */
    .loading-center {
      display: flex;
      justify-content: center;
      padding: 80px 0;
    }

    /* ---- Client Grid ---- */
    .client-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
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
      box-shadow: 0 12px 32px rgba(0,0,0,0.1);
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
    .avatar-at-risk  { background: linear-gradient(135deg, #f7971e, #ffd200); }
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
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .status-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    .status-active   { background: #d1fae5; color: #065f46; }
    .status-at-risk  { background: #fef3c7; color: #92400e; }
    .status-inactive { background: #f3f4f6; color: #6b7280; }

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
    @media (max-width: 600px) {
      .client-management {
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
    <div class="client-management">
      <!-- Page Header -->
      <div class="page-header">
        <h1>{{ 'ADMIN.CLIENT_MANAGEMENT' | translate }}</h1>
        <div class="header-actions">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'ADMIN.SEARCH_CLIENTS' | translate }}</mat-label>
            <input matInput [value]="searchTerm()"
              (input)="searchTerm.set($any($event.target).value)"
              [placeholder]="'ADMIN.SEARCH_PLACEHOLDER' | translate">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="addNewClient()">
            <mat-icon>person_add</mat-icon> {{ 'ADMIN.ADD_CLIENT' | translate }}
          </button>
          <button mat-stroked-button (click)="exportClients()">
            <mat-icon>download</mat-icon> {{ 'ADMIN.EXPORT' | translate }}
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
            <span class="stat-label">{{ 'ADMIN.TOTAL_CLIENTS' | translate }}</span>
            <span class="stat-value">{{ totalClients() }}</span>
          </div>
        </mat-card>

        <mat-card class="stat-card" appearance="outlined">
          <div class="stat-icon-wrap active">
            <mat-icon>verified_user</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-label">{{ 'ADMIN.ACTIVE_CLIENTS' | translate }}</span>
            <span class="stat-value">{{ activeClients() }}</span>
          </div>
        </mat-card>

        <mat-card class="stat-card" appearance="outlined">
          <div class="stat-icon-wrap new">
            <mat-icon>person_add</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-label">{{ 'ADMIN.NEW_THIS_MONTH' | translate }}</span>
            <span class="stat-value">{{ newThisMonth() }}</span>
          </div>
        </mat-card>

        <mat-card class="stat-card" appearance="outlined">
          <div class="stat-icon-wrap avg">
            <mat-icon>analytics</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-label">{{ 'ADMIN.AVG_CASES_CLIENT' | translate }}</span>
            <span class="stat-value">{{ avgCasesPerClient() }}</span>
          </div>
        </mat-card>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      }

      <!-- Client Grid -->
      @if (!loading()) {
        @if (filteredClients().length === 0) {
          <div class="empty-state">
            <mat-icon>people_outline</mat-icon>
            <p>{{ 'ADMIN.NO_CLIENTS' | translate }}</p>
            @if (searchTerm()) {
              <button mat-stroked-button (click)="searchTerm.set('')">
                <mat-icon>clear</mat-icon> {{ 'ADMIN.CLEAR_SEARCH' | translate }}
              </button>
            }
          </div>
        }

        <div class="client-grid">
          @for (client of filteredClients(); track client.id) {
            <mat-card class="client-card" appearance="outlined">
              <!-- Top: Avatar + Name + Status -->
              <div class="card-top">
                <div class="client-avatar"
                     [class.avatar-active]="getClientStatus(client) === 'active'"
                     [class.avatar-at-risk]="getClientStatus(client) === 'at-risk'"
                     [class.avatar-inactive]="getClientStatus(client) === 'inactive'">
                  {{ getInitials(client.name) }}
                </div>
                <div class="client-header">
                  <div class="client-name" [matTooltip]="client.name">{{ client.name }}</div>
                  <div class="client-email" [matTooltip]="client.email">{{ client.email }}</div>
                </div>
                <span class="status-badge"
                      [class.status-active]="getClientStatus(client) === 'active'"
                      [class.status-at-risk]="getClientStatus(client) === 'at-risk'"
                      [class.status-inactive]="getClientStatus(client) === 'inactive'">
                  @switch (getClientStatus(client)) {
                    @case ('active') {
                      <mat-icon>check_circle</mat-icon>
                      {{ 'ADMIN.ACTIVE_STATUS' | translate }}
                    }
                    @case ('at-risk') {
                      <mat-icon>warning</mat-icon>
                      {{ 'ADMIN.AT_RISK_STATUS' | translate }}
                    }
                    @case ('inactive') {
                      <mat-icon>pause_circle</mat-icon>
                      {{ 'ADMIN.INACTIVE_STATUS' | translate }}
                    }
                  }
                </span>
              </div>

              <!-- Details -->
              <div class="card-details">
                <div class="detail-row">
                  <mat-icon>phone</mat-icon>
                  <span class="detail-text">{{ client.phone }}</span>
                </div>
                @if (client.cdlNumber) {
                  <div class="detail-row">
                    <mat-icon>badge</mat-icon>
                    <span class="detail-text">{{ 'ADMIN.CDL_LABEL' | translate }}: {{ client.cdlNumber }}</span>
                  </div>
                }
                @if (client.address) {
                  <div class="detail-row">
                    <mat-icon>location_on</mat-icon>
                    <span class="detail-text">{{ client.address }}, {{ client.city }}, {{ client.state }}</span>
                  </div>
                }
              </div>

              <!-- Footer: Case stats + Last Contact -->
              <div class="card-footer">
                <div class="case-stats">
                  <div class="case-stat">
                    <span class="case-stat-value active-cases">{{ client.activeCases }}</span>
                    <span class="case-stat-label">{{ 'ADMIN.ACTIVE_STATUS' | translate }}</span>
                  </div>
                  <div class="case-stat">
                    <span class="case-stat-value">{{ client.totalCases }}</span>
                    <span class="case-stat-label">{{ 'ADMIN.CASES_LABEL' | translate }}</span>
                  </div>
                </div>
                <div class="last-contact">
                  <span class="last-contact-label">{{ 'ADMIN.LAST_CONTACT' | translate }}</span>
                  <span class="last-contact-value">{{ formatDate(client.lastContact) }}</span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="card-actions">
                <button mat-button color="primary" (click)="viewClient(client)"
                        [matTooltip]="'ADMIN.VIEW' | translate">
                  <mat-icon>visibility</mat-icon> {{ 'ADMIN.VIEW' | translate }}
                </button>
                <button mat-button (click)="viewCases(client)"
                        [matTooltip]="'ADMIN.CLIENT_CASES' | translate">
                  <mat-icon>folder_open</mat-icon> {{ 'ADMIN.CLIENT_CASES' | translate }}
                </button>
                <button mat-button (click)="sendMessage(client)"
                        [matTooltip]="'ADMIN.MESSAGE' | translate">
                  <mat-icon>mail</mat-icon> {{ 'ADMIN.MESSAGE' | translate }}
                </button>
                <button mat-icon-button [matMenuTriggerFor]="menu"
                        [attr.aria-label]="'ADMIN.EDIT_CLIENT' | translate">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="editClient(client)">
                    <mat-icon>edit</mat-icon> {{ 'ADMIN.EDIT_CLIENT' | translate }}
                  </button>
                </mat-menu>
              </div>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
})
export class ClientManagementComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  clients = signal<Client[]>([]);
  loading = signal(false);
  searchTerm = signal('');

  filteredClients = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.clients();
    return this.clients().filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.cdlNumber?.toLowerCase().includes(term) ||
      c.city?.toLowerCase().includes(term) ||
      c.state?.toLowerCase().includes(term)
    );
  });

  totalClients = computed(() => this.clients().length);

  activeClients = computed(() =>
    this.clients().filter(c => this.getClientStatus(c) === 'active').length
  );

  newThisMonth = computed(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.clients().filter(c => new Date(c.createdAt) >= startOfMonth).length;
  });

  avgCasesPerClient = computed(() => {
    const all = this.clients();
    if (all.length === 0) return '0';
    const avg = all.reduce((sum, c) => sum + c.totalCases, 0) / all.length;
    return avg.toFixed(1);
  });

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading.set(true);
    this.adminService.getAllClients().pipe(
      catchError(() => of(MOCK_CLIENTS))
    ).subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.loading.set(false);
      },
      error: () => {
        this.clients.set(MOCK_CLIENTS);
        this.loading.set(false);
      },
    });
  }

  getClientStatus(client: Client): ClientStatus {
    // At-Risk: 3 or more active cases
    if (client.activeCases >= 3) return 'at-risk';

    // Inactive: no last contact or last contact > 90 days ago
    if (!client.lastContact) return 'inactive';
    const daysSinceContact = Math.floor(
      (Date.now() - new Date(client.lastContact).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceContact > 90) return 'inactive';

    return 'active';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  viewClient(client: Client): void {
    this.snackBar.open(`Viewing ${client.name} — client detail coming soon`, 'Close', { duration: 3000 });
  }

  editClient(_client: Client): void {
    this.snackBar.open('Edit client feature coming soon', 'Close', { duration: 3000 });
  }

  viewCases(client: Client): void {
    this.router.navigate(['/admin/cases'], { queryParams: { clientId: client.id } });
  }

  sendMessage(_client: Client): void {
    this.snackBar.open('Message feature coming soon', 'Close', { duration: 3000 });
  }

  addNewClient(): void {
    this.snackBar.open('Add client feature coming soon', 'Close', { duration: 3000 });
  }

  exportClients(): void {
    this.snackBar.open('Export feature coming soon', 'Close', { duration: 3000 });
  }
}
