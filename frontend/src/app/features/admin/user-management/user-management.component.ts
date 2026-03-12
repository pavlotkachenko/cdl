import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Validators, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

import { AdminService, PlatformUser } from '../../../core/services/admin.service';

type RoleFilter = PlatformUser['role'] | 'all';
type StatusFilter = PlatformUser['status'] | 'all';

const ROLE_KEYS: Record<PlatformUser['role'], string> = {
  driver: 'ADMIN.ROLE_DRIVER', carrier: 'ADMIN.ROLE_CARRIER', attorney: 'ADMIN.ROLE_ATTORNEY',
  admin: 'ADMIN.ROLE_ADMIN', operator: 'ADMIN.ROLE_OPERATOR', paralegal: 'ADMIN.ROLE_PARALEGAL',
};

const ALL_ROLES: PlatformUser['role'][] = ['driver', 'carrier', 'attorney', 'admin', 'operator', 'paralegal'];

@Component({
  selector: 'app-user-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatDividerModule, TranslateModule,
  ],
  template: `
    <div class="user-mgmt">

      <!-- Page header -->
      <div class="page-header">
        <h1>{{ 'ADMIN.USER_MANAGEMENT' | translate }}</h1>
        <button mat-raised-button color="primary" (click)="toggleInvite()">
          <mat-icon>person_add</mat-icon>
          {{ showInvite() ? ('ADMIN.CANCEL_INVITE' | translate) : ('ADMIN.INVITE_USER' | translate) }}
        </button>
      </div>

      <!-- Invite panel -->
      @if (showInvite()) {
        <mat-card class="invite-card">
          <mat-card-content>
            <h3 class="invite-title">{{ 'ADMIN.INVITE_NEW_USER' | translate }}</h3>
            <form [formGroup]="inviteForm" (ngSubmit)="sendInvite()" class="invite-form">
              <mat-form-field appearance="outline" class="invite-email">
                <mat-label>{{ 'ADMIN.EMAIL_ADDRESS' | translate }} *</mat-label>
                <input matInput type="email" formControlName="email"
                       placeholder="user@example.com" autocomplete="email" />
                @if (inviteForm.get('email')?.hasError('required')) {
                  <mat-error>{{ 'ADMIN.EMAIL_REQUIRED' | translate }}</mat-error>
                }
                @if (inviteForm.get('email')?.hasError('email')) {
                  <mat-error>{{ 'ADMIN.VALID_EMAIL' | translate }}</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'ADMIN.ROLE' | translate }} *</mat-label>
                <mat-select formControlName="role">
                  @for (r of ALL_ROLES; track r) {
                    <mat-option [value]="r">{{ getRoleKey(r) | translate }}</mat-option>
                  }
                </mat-select>
                @if (inviteForm.get('role')?.hasError('required')) {
                  <mat-error>{{ 'ADMIN.ROLE_REQUIRED' | translate }}</mat-error>
                }
              </mat-form-field>
              <button mat-raised-button color="accent" type="submit"
                      [disabled]="inviteForm.invalid || inviting()">
                @if (inviting()) { {{ 'ADMIN.SENDING' | translate }} } @else { {{ 'ADMIN.SEND_INVITE' | translate }} }
              </button>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <!-- Filters -->
      <div class="filter-row">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>{{ 'ADMIN.SEARCH_USERS' | translate }}</mat-label>
          <input matInput
                 [value]="searchTerm()"
                 (input)="searchTerm.set($any($event.target).value)"
                 [attr.aria-label]="'ADMIN.SEARCH_USERS' | translate" />
          <mat-icon matSuffix aria-hidden="true">search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'ADMIN.ROLE' | translate }}</mat-label>
          <mat-select [value]="roleFilter()" (selectionChange)="roleFilter.set($event.value)">
            @for (r of roleOptions; track r.value) {
              <mat-option [value]="r.value">{{ r.key | translate }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'ADMIN.STATUS' | translate }}</mat-label>
          <mat-select [value]="statusFilter()" (selectionChange)="statusFilter.set($event.value)">
            @for (s of statusOptions; track s.value) {
              <mat-option [value]="s.value">{{ s.key | translate }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (searchTerm() || roleFilter() !== 'all' || statusFilter() !== 'all') {
          <button mat-button (click)="clearFilters()">{{ 'ADMIN.CLEAR' | translate }}</button>
        }
      </div>

      <!-- User list -->
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (filteredUsers().length === 0) {
        <p class="empty" role="status">{{ 'ADMIN.NO_USERS' | translate }}</p>
      } @else {
        <p class="result-count" role="status">{{ filteredUsers().length }} {{ 'ADMIN.USERS_COUNT' | translate }}</p>
        @for (user of filteredUsers(); track user.id) {
          <mat-card class="user-card">
            <mat-card-content>
              <div class="user-header">
                <div class="avatar" [attr.aria-label]="user.name">{{ getInitials(user.name) }}</div>
                <div class="user-info">
                  <p class="user-name">{{ user.name }}</p>
                  <p class="user-email">{{ user.email }}</p>
                  @if (user.lastLogin) {
                    <p class="user-meta">{{ 'ADMIN.LAST_LOGIN' | translate }} {{ user.lastLogin | date:'mediumDate' }}</p>
                  }
                </div>
                <div class="user-badges">
                  <span [class]="'badge role-' + user.role">{{ getRoleKey(user.role) | translate }}</span>
                  <span [class]="'badge status-' + user.status">{{ user.status }}</span>
                </div>
              </div>
              <mat-divider></mat-divider>
              <div class="user-actions">
                @if (user.status !== 'pending') {
                  <mat-form-field appearance="outline" class="role-select">
                    <mat-label>{{ 'ADMIN.ROLE' | translate }}</mat-label>
                    <mat-select [value]="user.role"
                                (selectionChange)="changeRole(user, $event.value)"
                                [attr.aria-label]="'Change role for ' + user.name">
                      @for (r of ALL_ROLES; track r) {
                        <mat-option [value]="r">{{ getRoleKey(r) | translate }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                }
                @if (user.status === 'active') {
                  <button mat-stroked-button color="warn"
                          (click)="suspend(user)"
                          [attr.aria-label]="'Suspend ' + user.name">
                    <mat-icon>block</mat-icon> {{ 'ADMIN.SUSPEND' | translate }}
                  </button>
                } @else if (user.status === 'suspended') {
                  <button mat-stroked-button color="primary"
                          (click)="unsuspend(user)"
                          [attr.aria-label]="'Unsuspend ' + user.name">
                    <mat-icon>check_circle</mat-icon> {{ 'ADMIN.UNSUSPEND' | translate }}
                  </button>
                } @else {
                  <span class="pending-label">{{ 'ADMIN.INVITE_PENDING' | translate }}</span>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .user-mgmt { max-width: 860px; margin: 0 auto; padding: 24px 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 1.4rem; }
    .invite-card { margin-bottom: 20px; background: #f5f9ff; }
    .invite-title { margin: 0 0 12px; font-size: 1rem; font-weight: 600; }
    .invite-form { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
    .invite-email { flex: 1; min-width: 220px; }
    .filter-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
    .search-field { flex: 1; min-width: 200px; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .empty, .result-count { color: #999; font-size: 0.85rem; margin: 8px 0; }
    .result-count { color: #555; }
    .user-card { margin-bottom: 10px; }
    .user-header { display: flex; align-items: flex-start; gap: 12px; padding-bottom: 10px; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; background: #1976d2; color: #fff;
      display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
    .user-info { flex: 1; }
    .user-name { margin: 0; font-weight: 700; font-size: 0.95rem; }
    .user-email { margin: 2px 0 0; font-size: 0.82rem; color: #666; }
    .user-meta { margin: 4px 0 0; font-size: 0.78rem; color: #888; }
    .user-badges { display: flex; gap: 6px; flex-direction: column; align-items: flex-end; }
    .badge { font-size: 0.7rem; padding: 2px 7px; border-radius: 10px; font-weight: 600; text-transform: capitalize; }
    .role-driver { background: #e3f2fd; color: #1565c0; }
    .role-carrier { background: #fff3e0; color: #e65100; }
    .role-attorney { background: #e8f5e9; color: #2e7d32; }
    .role-admin { background: #fce4ec; color: #880e4f; }
    .role-operator { background: #ede7f6; color: #4527a0; }
    .role-paralegal { background: #e0f7fa; color: #006064; }
    .status-active { background: #e8f5e9; color: #2e7d32; }
    .status-suspended { background: #ffebee; color: #c62828; }
    .status-pending { background: #fff8e1; color: #f57f17; }
    .user-actions { display: flex; gap: 8px; align-items: center; margin-top: 8px; flex-wrap: wrap; }
    .role-select { max-width: 160px; }
    .pending-label { font-size: 0.82rem; color: #888; font-style: italic; }
  `],
})
export class UserManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly ALL_ROLES = ALL_ROLES;

  readonly roleOptions: { value: RoleFilter; key: string }[] = [
    { value: 'all', key: 'ADMIN.ALL_ROLES' },
    ...ALL_ROLES.map(r => ({ value: r as RoleFilter, key: ROLE_KEYS[r] })),
  ];

  readonly statusOptions: { value: StatusFilter; key: string }[] = [
    { value: 'all', key: 'ADMIN.ALL_STATUSES' },
    { value: 'active', key: 'ADMIN.STATUS_ACTIVE' },
    { value: 'suspended', key: 'ADMIN.STATUS_SUSPENDED' },
    { value: 'pending', key: 'ADMIN.STATUS_PENDING_USER' },
  ];

  inviteForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['' as PlatformUser['role'] | '', Validators.required],
  });

  users = signal<PlatformUser[]>([]);
  loading = signal(false);
  inviting = signal(false);
  showInvite = signal(false);
  searchTerm = signal('');
  roleFilter = signal<RoleFilter>('all');
  statusFilter = signal<StatusFilter>('all');

  filteredUsers = computed(() => {
    let list = this.users();
    const term = this.searchTerm().toLowerCase();
    if (term) {
      list = list.filter(u =>
        u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term),
      );
    }
    const role = this.roleFilter();
    if (role !== 'all') list = list.filter(u => u.role === role);
    const status = this.statusFilter();
    if (status !== 'all') list = list.filter(u => u.status === status);
    return list;
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.adminService.getAllUsers().subscribe({
      next: ({ users }) => { this.users.set(users); this.loading.set(false); },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load users.', 'Close', { duration: 3000 });
      },
    });
  }

  toggleInvite(): void {
    this.showInvite.update(v => !v);
    if (!this.showInvite()) this.inviteForm.reset();
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) return;
    this.inviting.set(true);
    const { email, role } = this.inviteForm.value;
    this.adminService.inviteUser(email!, role as PlatformUser['role']).subscribe({
      next: () => {
        this.inviting.set(false);
        this.showInvite.set(false);
        this.inviteForm.reset();
        this.snackBar.open(`Invite sent to ${email}.`, 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        this.inviting.set(false);
        const msg = err?.error?.error?.message ?? 'Failed to send invite.';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      },
    });
  }

  suspend(user: PlatformUser): void {
    this.adminService.suspendUser(user.id).subscribe({
      next: () => {
        this.snackBar.open(`${user.name} suspended.`, 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: () => this.snackBar.open('Failed to suspend user.', 'Close', { duration: 3000 }),
    });
  }

  unsuspend(user: PlatformUser): void {
    this.adminService.unsuspendUser(user.id).subscribe({
      next: () => {
        this.snackBar.open(`${user.name} reactivated.`, 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: () => this.snackBar.open('Failed to unsuspend user.', 'Close', { duration: 3000 }),
    });
  }

  changeRole(user: PlatformUser, newRole: PlatformUser['role']): void {
    if (newRole === user.role) return;
    this.adminService.changeUserRole(user.id, newRole).subscribe({
      next: () => {
        this.snackBar.open(`${user.name}'s role updated.`, 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        const msg = err?.error?.error?.message ?? 'Failed to change role.';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      },
    });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.roleFilter.set('all');
    this.statusFilter.set('all');
  }

  getRoleKey(role: PlatformUser['role']): string {
    return ROLE_KEYS[role] ?? role;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
