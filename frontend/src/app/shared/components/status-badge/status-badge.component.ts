// ============================================
// Status Badge Component - ABSOLUTELY CLEAN
// ============================================
// Location: frontend/src/app/shared/components/status-badge/status-badge.component.ts

import { Component, Input } from '@angular/core';
import { CaseStatus, STATUS_COLORS, STATUS_LABELS } from '../../../core/models';

@Component({
  selector: 'app-status-badge',
  standalone: false,
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  @Input() status!: CaseStatus;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showIcon: boolean = true;
  @Input() clickable: boolean = false;
  
  private statusIcons: Record<CaseStatus, string> = {
    'new': 'fiber_new',
    'reviewed': 'check_circle',
    'assigned_to_attorney': 'person',
    'waiting_for_driver': 'schedule',
    'send_info_to_attorney': 'send',
    'attorney_paid': 'payment',
    'call_court': 'phone',
    'check_with_manager': 'support_agent',
    'pay_attorney': 'attach_money',
    'closed': 'done_all',
    'resolved': 'verified'
  };
  
  get backgroundColor(): string {
    return STATUS_COLORS[this.status] || '#6b7280';
  }
  
  get icon(): string {
    return this.statusIcons[this.status] || 'help';
  }
  
  get displayText(): string {
    return STATUS_LABELS[this.status] || this.status;
  }
  
  get badgeClasses(): string {
    const classes = [
      'status-badge',
      `status-badge--${this.size}`,
      `status-badge--${this.status}`
    ];
    
    if (this.clickable) {
      classes.push('status-badge--clickable');
    }
    
    return classes.join(' ');
  }
  
  get textColor(): string {
    const lightStatuses: CaseStatus[] = ['waiting_for_driver', 'send_info_to_attorney'];
    return lightStatuses.includes(this.status) ? '#000000' : '#ffffff';
  }
}
