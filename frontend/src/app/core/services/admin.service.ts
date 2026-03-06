// ============================================
// Admin Service - Law Firm Administration
// Location: frontend/src/app/core/services/admin.service.ts
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ============================================
// Models
// ============================================

export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  pendingCases: number;
  resolvedCases: number;
  totalClients: number;
  totalStaff: number;
  avgResolutionTime: number; // days
  successRate: number; // percentage
  revenueThisMonth: number;
  revenueLastMonth: number;
  casesThisWeek: number;
  casesLastWeek: number;
}

export interface Case {
  id: string;
  caseNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  violationType: string;
  status: 'new' | 'assigned' | 'in_progress' | 'pending_court' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  assignedToName?: string;
  createdAt: Date;
  updatedAt: Date;
  courtDate?: Date;
  fineAmount?: number;
  location?: string;
  description?: string;
  tags?: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'attorney' | 'paralegal';
  phone?: string;
  avatar?: string;
  specialization?: string[];
  activeCases: number;
  totalCases: number;
  successRate: number;
  avgResolutionTime: number; // days
  joinedDate: Date;
  status: 'active' | 'inactive' | 'on_leave';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cdlNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  totalCases: number;
  activeCases: number;
  createdAt: Date;
  lastContact?: Date;
  notes?: string;
}

export interface PerformanceMetrics {
  staffId: string;
  staffName: string;
  totalCases: number;
  resolvedCases: number;
  successRate: number;
  avgResolutionTime: number;
  clientSatisfaction: number;
  casesByMonth: { month: string; count: number }[];
  casesByType: { type: string; count: number }[];
}

export interface WorkloadDistribution {
  staffId: string;
  staffName: string;
  activeCases: number;
  capacity: number;
  utilization: number; // percentage
}

export interface BulkOperation {
  action: 'assign' | 'update_status' | 'update_priority' | 'add_tags' | 'export';
  caseIds: string[];
  data?: any;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: 'driver' | 'carrier' | 'attorney' | 'admin' | 'operator' | 'paralegal';
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  lastLogin?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // ============================================
  // Dashboard
  // ============================================

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/admin/dashboard/stats`).pipe(
      catchError(() => of(this.getMockDashboardStats()))
    );
  }

  private getMockDashboardStats(): DashboardStats {
    return {
      totalCases: 247,
      activeCases: 89,
      pendingCases: 34,
      resolvedCases: 124,
      totalClients: 183,
      totalStaff: 12,
      avgResolutionTime: 18.5,
      successRate: 87.3,
      revenueThisMonth: 45600,
      revenueLastMonth: 38200,
      casesThisWeek: 23,
      casesLastWeek: 19
    };
  }

  // ============================================
  // Case Management
  // ============================================

  getAllCases(filters?: any): Observable<Case[]> {
    return this.http.get<Case[]>(`${this.apiUrl}/admin/cases`, { params: filters }).pipe(
      catchError(() => of(this.getMockCases()))
    );
  }

  getCase(caseId: string): Observable<Case> {
    return this.http.get<Case>(`${this.apiUrl}/admin/cases/${caseId}`).pipe(
      catchError(() => of(this.getMockCases()[0]))
    );
  }

  assignCase(caseId: string, staffId: string): Observable<Case> {
    return this.http.patch<Case>(`${this.apiUrl}/admin/cases/${caseId}/assign`, { staffId }).pipe(
      catchError(() => of(this.getMockCases()[0]))
    );
  }

  updateCaseStatus(caseId: string, status: Case['status']): Observable<Case> {
    return this.http.patch<Case>(`${this.apiUrl}/admin/cases/${caseId}/status`, { status }).pipe(
      catchError(() => of(this.getMockCases()[0]))
    );
  }

  updateCasePriority(caseId: string, priority: Case['priority']): Observable<Case> {
    return this.http.patch<Case>(`${this.apiUrl}/admin/cases/${caseId}/priority`, { priority }).pipe(
      catchError(() => of(this.getMockCases()[0]))
    );
  }

  private getMockCases(): Case[] {
    return [
      {
        id: '1',
        caseNumber: 'CDL-2024-001',
        clientId: 'client-1',
        clientName: 'John Doe',
        clientEmail: 'john.doe@example.com',
        violationType: 'Speeding',
        status: 'in_progress',
        priority: 'high',
        assignedTo: 'staff-1',
        assignedToName: 'Sarah Johnson',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        courtDate: new Date('2024-03-20'),
        fineAmount: 350,
        location: 'Highway 101, CA',
        description: '25 mph over speed limit',
        tags: ['urgent', 'cdl-at-risk']
      },
      {
        id: '2',
        caseNumber: 'CDL-2024-002',
        clientId: 'client-2',
        clientName: 'Jane Smith',
        clientEmail: 'jane.smith@example.com',
        violationType: 'Improper Lane Change',
        status: 'assigned',
        priority: 'medium',
        assignedTo: 'staff-2',
        assignedToName: 'Michael Chen',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date(),
        fineAmount: 175,
        location: 'I-5, Seattle',
        tags: ['new-client']
      },
      {
        id: '3',
        caseNumber: 'CDL-2024-003',
        clientId: 'client-3',
        clientName: 'Robert Wilson',
        clientEmail: 'robert.w@example.com',
        violationType: 'Following Too Closely',
        status: 'new',
        priority: 'low',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date(),
        fineAmount: 200,
        location: 'Route 66, AZ'
      }
    ];
  }

  // ============================================
  // Staff Management
  // ============================================

  getAllStaff(): Observable<StaffMember[]> {
    return this.http.get<StaffMember[]>(`${this.apiUrl}/admin/staff`).pipe(
      catchError(() => of(this.getMockStaff()))
    );
  }

  getStaffMember(staffId: string): Observable<StaffMember> {
    return this.http.get<StaffMember>(`${this.apiUrl}/admin/staff/${staffId}`).pipe(
      catchError(() => of(this.getMockStaff()[0]))
    );
  }

  createStaffMember(staff: Partial<StaffMember>): Observable<StaffMember> {
    return this.http.post<StaffMember>(`${this.apiUrl}/admin/staff`, staff).pipe(
      catchError(() => of(this.getMockStaff()[0]))
    );
  }

  updateStaffMember(staffId: string, updates: Partial<StaffMember>): Observable<StaffMember> {
    return this.http.patch<StaffMember>(`${this.apiUrl}/admin/staff/${staffId}`, updates).pipe(
      catchError(() => of(this.getMockStaff()[0]))
    );
  }

  deleteStaffMember(staffId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/staff/${staffId}`).pipe(
      catchError(() => of(void 0))
    );
  }

  private getMockStaff(): StaffMember[] {
    return [
      {
        id: 'staff-1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@lawfirm.com',
        role: 'attorney',
        phone: '555-0101',
        specialization: ['CDL', 'Traffic Law'],
        activeCases: 15,
        totalCases: 87,
        successRate: 92.5,
        avgResolutionTime: 16.8,
        joinedDate: new Date('2022-03-15'),
        status: 'active'
      },
      {
        id: 'staff-2',
        name: 'Michael Chen',
        email: 'michael.chen@lawfirm.com',
        role: 'attorney',
        phone: '555-0102',
        specialization: ['CDL', 'Commercial Vehicle'],
        activeCases: 12,
        totalCases: 64,
        successRate: 88.7,
        avgResolutionTime: 18.2,
        joinedDate: new Date('2022-08-01'),
        status: 'active'
      },
      {
        id: 'staff-3',
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@lawfirm.com',
        role: 'paralegal',
        phone: '555-0103',
        activeCases: 8,
        totalCases: 42,
        successRate: 85.0,
        avgResolutionTime: 22.5,
        joinedDate: new Date('2023-01-10'),
        status: 'active'
      }
    ];
  }

  // ============================================
  // Client Management
  // ============================================

  getAllClients(filters?: any): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/admin/clients`, { params: filters }).pipe(
      catchError(() => of(this.getMockClients()))
    );
  }

  getClient(clientId: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/admin/clients/${clientId}`).pipe(
      catchError(() => of(this.getMockClients()[0]))
    );
  }

  updateClient(clientId: string, updates: Partial<Client>): Observable<Client> {
    return this.http.patch<Client>(`${this.apiUrl}/admin/clients/${clientId}`, updates).pipe(
      catchError(() => of(this.getMockClients()[0]))
    );
  }

  private getMockClients(): Client[] {
    return [
      {
        id: 'client-1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '555-1001',
        cdlNumber: 'CDL123456',
        address: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        totalCases: 3,
        activeCases: 1,
        createdAt: new Date('2023-06-15'),
        lastContact: new Date()
      },
      {
        id: 'client-2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '555-1002',
        cdlNumber: 'CDL789012',
        address: '456 Oak Ave',
        city: 'Seattle',
        state: 'WA',
        zipCode: '98101',
        totalCases: 1,
        activeCases: 1,
        createdAt: new Date('2024-01-10')
      }
    ];
  }

  // ============================================
  // Performance Metrics
  // ============================================

  getStaffPerformance(staffId?: string): Observable<PerformanceMetrics[]> {
    const url = staffId 
      ? `${this.apiUrl}/admin/performance/${staffId}`
      : `${this.apiUrl}/admin/performance`;
    
    return this.http.get<PerformanceMetrics[]>(url).pipe(
      catchError(() => of(this.getMockPerformanceMetrics()))
    );
  }

  private getMockPerformanceMetrics(): PerformanceMetrics[] {
    return [
      {
        staffId: 'staff-1',
        staffName: 'Sarah Johnson',
        totalCases: 87,
        resolvedCases: 82,
        successRate: 94.3,
        avgResolutionTime: 16.8,
        clientSatisfaction: 4.7,
        casesByMonth: [
          { month: 'Jan', count: 12 },
          { month: 'Feb', count: 15 },
          { month: 'Mar', count: 18 }
        ],
        casesByType: [
          { type: 'Speeding', count: 45 },
          { type: 'Lane Change', count: 22 },
          { type: 'Following', count: 20 }
        ]
      }
    ];
  }

  // ============================================
  // Workload Distribution
  // ============================================

  getWorkloadDistribution(): Observable<WorkloadDistribution[]> {
    return this.http.get<WorkloadDistribution[]>(`${this.apiUrl}/admin/workload`).pipe(
      catchError(() => of(this.getMockWorkload()))
    );
  }

  private getMockWorkload(): WorkloadDistribution[] {
    return [
      { staffId: 'staff-1', staffName: 'Sarah Johnson', activeCases: 15, capacity: 20, utilization: 75 },
      { staffId: 'staff-2', staffName: 'Michael Chen', activeCases: 12, capacity: 20, utilization: 60 },
      { staffId: 'staff-3', staffName: 'Emily Rodriguez', activeCases: 8, capacity: 15, utilization: 53 }
    ];
  }

  // ============================================
  // Bulk Operations
  // ============================================

  performBulkOperation(operation: BulkOperation): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/bulk`, operation).pipe(
      catchError(() => of({ success: true, affected: operation.caseIds.length }))
    );
  }

  bulkAssignCases(caseIds: string[], staffId: string): Observable<any> {
    return this.performBulkOperation({
      action: 'assign',
      caseIds,
      data: { staffId }
    });
  }

  bulkUpdateStatus(caseIds: string[], status: Case['status']): Observable<any> {
    return this.performBulkOperation({
      action: 'update_status',
      caseIds,
      data: { status }
    });
  }

  bulkUpdatePriority(caseIds: string[], priority: Case['priority']): Observable<any> {
    return this.performBulkOperation({
      action: 'update_priority',
      caseIds,
      data: { priority }
    });
  }

  exportCases(caseIds: string[], format: 'csv' | 'pdf' | 'xlsx'): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/admin/export`,
      { caseIds, format },
      { responseType: 'blob' }
    ).pipe(
      catchError(() => of(new Blob(['Mock export data'], { type: 'text/csv' })))
    );
  }

  // ============================================
  // User Management
  // ============================================

  getAllUsers(role?: string, status?: string): Observable<{ users: PlatformUser[] }> {
    const params: Record<string, string> = {};
    if (role) params['role'] = role;
    if (status) params['status'] = status;
    return this.http.get<{ users: PlatformUser[] }>(`${this.apiUrl}/admin/users`, { params });
  }

  inviteUser(email: string, role: PlatformUser['role']): Observable<{ user: PlatformUser }> {
    return this.http.post<{ user: PlatformUser }>(`${this.apiUrl}/admin/users/invite`, { email, role });
  }

  changeUserRole(userId: string, role: PlatformUser['role']): Observable<{ user: Pick<PlatformUser, 'id' | 'role'> }> {
    return this.http.patch<{ user: Pick<PlatformUser, 'id' | 'role'> }>(`${this.apiUrl}/admin/users/${userId}/role`, { role });
  }

  suspendUser(userId: string): Observable<{ user: Pick<PlatformUser, 'id' | 'status'> }> {
    return this.http.patch<{ user: Pick<PlatformUser, 'id' | 'status'> }>(`${this.apiUrl}/admin/users/${userId}/suspend`, {});
  }

  unsuspendUser(userId: string): Observable<{ user: Pick<PlatformUser, 'id' | 'status'> }> {
    return this.http.patch<{ user: Pick<PlatformUser, 'id' | 'status'> }>(`${this.apiUrl}/admin/users/${userId}/unsuspend`, {});
  }
}
