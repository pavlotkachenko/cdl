// ============================================
// Admin Service - Law Firm Administration
// Location: frontend/src/app/core/services/admin.service.ts
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
  operatorId?: string;
  operatorName?: string;
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

export interface AssignmentRequest {
  id: string;
  operator: { id: string; full_name: string } | null;
  case: { id: string; case_number: string; violation_type: string; state: string } | null;
  status: string;
  created_at: string;
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
    return this.http.get<DashboardStats>(`${this.apiUrl}/admin/dashboard/stats`);
  }

  // ============================================
  // Case Management
  // ============================================

  getAllCases(filters?: Record<string, string | number>): Observable<{ cases: any[]; total: number }> {
    return this.http.get<{ cases: any[]; total: number }>(`${this.apiUrl}/admin/cases`, { params: filters as any });
  }

  getCase(caseId: string): Observable<Case> {
    return this.http.get<Case>(`${this.apiUrl}/admin/cases/${caseId}`);
  }

  assignCase(caseId: string, staffId: string): Observable<Case> {
    return this.http.patch<Case>(`${this.apiUrl}/admin/cases/${caseId}/assign`, { staffId });
  }

  updateCaseStatus(caseId: string, status: string, comment?: string, override?: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/admin/cases/${caseId}/status`, { status, comment, override });
  }

  updateCasePriority(caseId: string, priority: Case['priority']): Observable<Case> {
    return this.http.patch<Case>(`${this.apiUrl}/admin/cases/${caseId}/priority`, { priority });
  }

  getChartData(type: string): Observable<{ labels: string[]; data: number[] }> {
    return this.http.get<{ labels: string[]; data: number[] }>(`${this.apiUrl}/admin/charts/${type}`);
  }

  // ============================================
  // Staff Management
  // ============================================

  getAllStaff(): Observable<StaffMember[]> {
    return this.http.get<StaffMember[]>(`${this.apiUrl}/admin/staff`);
  }

  getStaffMember(staffId: string): Observable<StaffMember> {
    return this.http.get<StaffMember>(`${this.apiUrl}/admin/staff/${staffId}`);
  }

  createStaffMember(staff: Partial<StaffMember>): Observable<StaffMember> {
    return this.http.post<StaffMember>(`${this.apiUrl}/admin/staff`, staff);
  }

  updateStaffMember(staffId: string, updates: Partial<StaffMember>): Observable<StaffMember> {
    return this.http.patch<StaffMember>(`${this.apiUrl}/admin/staff/${staffId}`, updates);
  }

  deleteStaffMember(staffId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/staff/${staffId}`);
  }

  // ============================================
  // Client Management
  // ============================================

  getAllClients(filters?: any): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/admin/clients`, { params: filters });
  }

  getClient(clientId: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/admin/clients/${clientId}`);
  }

  updateClient(clientId: string, updates: Partial<Client>): Observable<Client> {
    return this.http.patch<Client>(`${this.apiUrl}/admin/clients/${clientId}`, updates);
  }

  // ============================================
  // Performance Metrics
  // ============================================

  getStaffPerformance(staffId?: string): Observable<PerformanceMetrics[]> {
    const url = staffId
      ? `${this.apiUrl}/admin/performance/${staffId}`
      : `${this.apiUrl}/admin/performance`;
    return this.http.get<{ metrics: PerformanceMetrics[] }>(url).pipe(
      map(res => res.metrics || [])
    );
  }

  // ============================================
  // Workload Distribution
  // ============================================

  getWorkloadDistribution(): Observable<{ staff: WorkloadDistribution[] }> {
    return this.http.get<{ staff: WorkloadDistribution[] }>(`${this.apiUrl}/admin/workload`);
  }

  // ============================================
  // Bulk Operations
  // ============================================

  performBulkOperation(operation: BulkOperation): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/bulk`, operation);
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

  // ── Case Table (CT-5) ──

  getAllCasesTable(params?: Record<string, string | number>): Observable<{ cases: any[]; total: number }> {
    return this.http.get<{ cases: any[]; total: number }>(`${this.apiUrl}/admin/cases`, { params: params as any });
  }

  // ── Admin Case Detail (AC-2) ──

  getAdminCaseDetail(caseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/cases/${caseId}`);
  }

  getOperators(): Observable<{ operators: any[] }> {
    return this.http.get<{ operators: any[] }>(`${this.apiUrl}/admin/operators`);
  }

  assignOperator(caseId: string, operatorId: string | null): Observable<any> {
    if (operatorId) {
      return this.http.post(`${this.apiUrl}/cases/${caseId}/assign-operator`, { operator_id: operatorId });
    } else {
      return this.http.patch(`${this.apiUrl}/cases/${caseId}`, { assigned_operator_id: null });
    }
  }

  assignAttorney(caseId: string, attorneyId: string, price?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/cases/${caseId}/assign-attorney`, {
      attorney_id: attorneyId,
      ...(price != null ? { price } : {}),
    });
  }

  // ── Assignment Request Approval (OC-7) ──

  getAssignmentRequests(): Observable<{ requests: AssignmentRequest[] }> {
    return this.http.get<{ requests: AssignmentRequest[] }>(`${this.apiUrl}/admin/assignment-requests`).pipe(
      catchError(() => of({ requests: [] })),
    );
  }

  approveAssignmentRequest(requestId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/admin/assignment-requests/${requestId}/approve`, {},
    );
  }

  rejectAssignmentRequest(requestId: string, reason?: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/admin/assignment-requests/${requestId}/reject`,
      reason ? { reason } : {},
    );
  }
}
