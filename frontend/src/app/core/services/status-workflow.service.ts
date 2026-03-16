// ============================================
// Status Workflow Service
// Location: frontend/src/app/core/services/status-workflow.service.ts
// ============================================

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NextStatusesResponse {
  currentStatus: string;
  nextStatuses: string[];
  requiresNote: Record<string, boolean>;
}

export interface Phase {
  key: string;
  label: string;
  statuses: string[];
}

export interface StatusConfig {
  label: string;
  color: string;
  icon: string;
}

const PHASES: Phase[] = [
  { key: 'intake',     label: 'OPR.PHASE_INTAKE',     statuses: ['new', 'reviewed'] },
  { key: 'assignment', label: 'OPR.PHASE_ASSIGNMENT',  statuses: ['assigned_to_attorney'] },
  { key: 'processing', label: 'OPR.PHASE_PROCESSING',  statuses: ['send_info_to_attorney', 'waiting_for_driver', 'call_court', 'check_with_manager'] },
  { key: 'payment',    label: 'OPR.PHASE_PAYMENT',     statuses: ['pay_attorney', 'attorney_paid'] },
  { key: 'resolution', label: 'OPR.PHASE_RESOLUTION',  statuses: ['resolved', 'closed'] },
];

const STATUS_CONFIGS: Record<string, StatusConfig> = {
  'new':                    { label: 'OPR.STATUS_NEW',                    color: '#e3f2fd', icon: 'fiber_new' },
  'reviewed':               { label: 'OPR.STATUS_REVIEWED',               color: '#e8eaf6', icon: 'rate_review' },
  'assigned_to_attorney':   { label: 'OPR.STATUS_ASSIGNED_TO_ATTORNEY',   color: '#fff3e0', icon: 'person_add' },
  'send_info_to_attorney':  { label: 'OPR.STATUS_SEND_INFO_TO_ATTORNEY',  color: '#fce4ec', icon: 'send' },
  'waiting_for_driver':     { label: 'OPR.STATUS_WAITING_FOR_DRIVER',     color: '#fff8e1', icon: 'hourglass_empty' },
  'call_court':             { label: 'OPR.STATUS_CALL_COURT',             color: '#f3e5f5', icon: 'phone' },
  'check_with_manager':     { label: 'OPR.STATUS_CHECK_WITH_MANAGER',     color: '#fbe9e7', icon: 'supervisor_account' },
  'pay_attorney':           { label: 'OPR.STATUS_PAY_ATTORNEY',           color: '#e0f2f1', icon: 'payment' },
  'attorney_paid':          { label: 'OPR.STATUS_ATTORNEY_PAID',          color: '#e8f5e9', icon: 'paid' },
  'resolved':               { label: 'OPR.STATUS_RESOLVED',               color: '#e8f5e9', icon: 'check_circle' },
  'closed':                 { label: 'OPR.STATUS_CLOSED',                 color: '#eceff1', icon: 'lock' },
};

@Injectable({ providedIn: 'root' })
export class StatusWorkflowService {
  private http = inject(HttpClient);

  /** Get allowed next statuses for a case from the API */
  getNextStatuses(caseId: string): Observable<NextStatusesResponse> {
    return this.http.get<NextStatusesResponse>(`/api/cases/${caseId}/next-statuses`);
  }

  /** Change case status */
  changeStatus(caseId: string, status: string, comment?: string): Observable<unknown> {
    return this.http.post(`/api/cases/${caseId}/status`, { status, comment });
  }

  /** Client-side phase lookup */
  getPhaseForStatus(status: string): Phase | undefined {
    return PHASES.find(p => p.statuses.includes(status));
  }

  /** Client-side phase index (for stepper progress) */
  getPhaseIndex(status: string): number {
    return PHASES.findIndex(p => p.statuses.includes(status));
  }

  /** Get all phases */
  getPhases(): Phase[] {
    return PHASES;
  }

  /** Status display config (label key, color, icon) */
  getStatusConfig(status: string): StatusConfig {
    return STATUS_CONFIGS[status] ?? { label: status, color: '#eceff1', icon: 'help_outline' };
  }
}
