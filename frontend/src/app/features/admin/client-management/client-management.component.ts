// ============================================
// Client Management Component
// Location: frontend/src/app/features/admin/client-management/client-management.component.ts
// ============================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { AdminService, Client } from '../../../core/services/admin.service';

@Component({
  selector: 'app-client-management',
  standalone: true,
  templateUrl: './client-management.component.html',
  styleUrls: ['./client-management.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule
  ]
})
export class ClientManagementComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  loading = false;

  // Filters
  searchTerm = '';

  // Table columns
  displayedColumns = ['name', 'contact', 'location', 'cdlNumber', 'cases', 'lastContact', 'actions'];

  constructor(
    private adminService: AdminService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;

    this.adminService.getAllClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading clients:', err);
        this.loading = false;
        this.snackBar.open('Failed to load clients', 'Close', { duration: 5000 });
      }
    });
  }

  // ============================================
  // Filtering
  // ============================================

  applyFilters(): void {
    let filtered = [...this.clients];

    // Search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        c.cdlNumber?.toLowerCase().includes(term)
      );
    }

    this.filteredClients = filtered;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  // ============================================
  // Actions
  // ============================================

  viewClient(client: Client): void {
    this.router.navigate(['/admin/clients', client.id]);
  }

  editClient(client: Client): void {
    // Open edit dialog
    this.snackBar.open('Edit client feature coming soon', 'Close', { duration: 3000 });
  }

  viewCases(client: Client): void {
    this.router.navigate(['/admin/cases'], { 
      queryParams: { clientId: client.id } 
    });
  }

  sendMessage(client: Client): void {
    this.snackBar.open('Message feature coming soon', 'Close', { duration: 3000 });
  }

  addNewClient(): void {
    // Open add client dialog
    this.snackBar.open('Add client feature coming soon', 'Close', { duration: 3000 });
  }

  exportClients(): void {
    this.snackBar.open('Export feature coming soon', 'Close', { duration: 3000 });
  }

  // ============================================
  // Helpers
  // ============================================

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getCaseCountColor(count: number): string {
    if (count >= 3) return 'warn';
    if (count >= 1) return 'primary';
    return 'accent';
  }
}
