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
import { MatSnackBar } from '@angular/material/snack-bar';

import { AdminService, Client } from '../../../core/services/admin.service';

@Component({
  selector: 'app-client-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatMenuModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="client-management">
      <div class="page-header">
        <h1>Client Management</h1>
        <div class="header-actions">
          <mat-form-field appearance="outline">
            <mat-label>Search clients</mat-label>
            <input matInput [value]="searchTerm()"
              (input)="searchTerm.set($any($event.target).value)"
              placeholder="Name, email, phone, CDL…">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="addNewClient()">
            <mat-icon>person_add</mat-icon> Add Client
          </button>
          <button mat-stroked-button (click)="exportClients()">
            <mat-icon>download</mat-icon> Export
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      }

      @if (!loading()) {
        <mat-card>
          <mat-card-content>
            @if (filteredClients().length === 0) {
              <div class="empty-state">
                <mat-icon>people</mat-icon>
                <p>No clients found</p>
                @if (searchTerm()) {
                  <button mat-button (click)="searchTerm.set('')">Clear search</button>
                }
              </div>
            }
            @for (client of filteredClients(); track client.id) {
              <div class="client-row">
                <div class="client-avatar">{{ getInitials(client.name) }}</div>
                <div class="client-info">
                  <div class="client-name">{{ client.name }}</div>
                  <div class="client-contact">{{ client.email }} · {{ client.phone }}</div>
                  @if (client.cdlNumber) {
                    <div class="client-cdl">CDL: {{ client.cdlNumber }}</div>
                  }
                </div>
                <div class="client-meta">
                  <mat-chip [color]="getCaseCountColor(client.totalCases ?? 0)" highlighted>
                    {{ client.totalCases ?? 0 }} cases
                  </mat-chip>
                  <span class="last-contact">{{ formatDate(client.lastContact) }}</span>
                </div>
                <div class="client-actions">
                  <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Client actions">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="viewClient(client)">
                      <mat-icon>visibility</mat-icon> View
                    </button>
                    <button mat-menu-item (click)="viewCases(client)">
                      <mat-icon>folder</mat-icon> Cases
                    </button>
                    <button mat-menu-item (click)="sendMessage(client)">
                      <mat-icon>message</mat-icon> Message
                    </button>
                    <button mat-menu-item (click)="editClient(client)">
                      <mat-icon>edit</mat-icon> Edit
                    </button>
                  </mat-menu>
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>
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
      c.cdlNumber?.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading.set(true);
    this.adminService.getAllClients().subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load clients', 'Close', { duration: 5000 });
      },
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

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getCaseCountColor(count: number): string {
    if (count >= 3) return 'warn';
    if (count >= 1) return 'primary';
    return 'accent';
  }
}
