// ============================================
// Disqualification Timeline — Sprint 075 / VD-5
// Visual timeline for DUI, railroad crossing, and suspension
// violations showing disqualification period and reinstatement steps.
// ============================================

import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';

/** Types that trigger the disqualification timeline */
const DISQUALIFICATION_TYPES = new Set(['dui', 'railroad_crossing', 'suspension']);

/** Duration label → days mapping for suspension type */
const SUSPENSION_DURATION_DAYS: Record<string, number> = {
  '60_day': 60,
  '120_day': 120,
  '1_year': 365,
  '3_year': 1095,
};

interface TimelineNode {
  label: string;
  date: string;
  color: 'red' | 'orange' | 'green' | 'gray';
  icon: string;
}

interface ReinstatementItem {
  label: string;
  completed: boolean;
}

@Component({
  selector: 'app-disqualification-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showTimeline()) {
      <section class="card disqualification-card" [class]="cardClass()" aria-labelledby="disq-heading">
        <div class="card-header">
          <h2 id="disq-heading"><span aria-hidden="true">&#9203;</span> Disqualification Timeline</h2>
          <span class="status-badge" [class]="statusBadge().cssClass"
                [attr.aria-label]="statusBadge().label">
            {{ statusBadge().label }}
          </span>
        </div>
        <div class="card-body">

          <!-- Timeline -->
          <ol class="timeline" role="list"
              [attr.aria-label]="'Disqualification period: ' + durationDescription()">
            @for (node of timelineNodes(); track node.label) {
              <li class="timeline-item" role="listitem">
                <div class="timeline-marker" [class]="'marker-' + node.color" aria-hidden="true">
                  @if (node.icon) {
                    <span>{{ node.icon }}</span>
                  }
                </div>
                <div class="timeline-content">
                  <p class="timeline-label">{{ node.label }}</p>
                  <p class="timeline-date">{{ node.date }}</p>
                </div>
              </li>
            }
          </ol>

          <!-- Duration bar -->
          @if (durationText()) {
            <div class="duration-bar" aria-hidden="true">
              <div class="duration-fill" [style.width.%]="durationPercent()"></div>
            </div>
            <p class="duration-label">{{ durationText() }}</p>
          }

          <!-- Contested note -->
          @if (isActiveCase()) {
            <p class="contested-note" role="status">
              If this violation is successfully contested, disqualification may be avoided
            </p>
          }

          <!-- Reinstatement Requirements -->
          @if (reinstatementItems().length > 0) {
            <div class="reinstatement-section">
              <h3 class="reinstatement-title">Reinstatement Requirements</h3>
              <ul class="reinstatement-list">
                @for (item of reinstatementItems(); track item.label) {
                  <li [class.item-completed]="item.completed">
                    <span class="check-icon" aria-hidden="true">{{ item.completed ? '&#9989;' : '&#9744;' }}</span>
                    {{ item.label }}
                  </li>
                }
              </ul>
            </div>
          }

        </div>
      </section>
    }
  `,
  styles: `
    .disqualification-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .disqualification-card.card-active {
      background: #fef2f2;
    }

    .disqualification-card.card-reinstated {
      background: #f0fdf4;
    }

    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;

      h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #111827;
      }
    }

    .status-badge {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .badge-disqualified { background: #fecaca; color: #dc2626; }
    .badge-eligible { background: #fed7aa; color: #ea580c; }
    .badge-reinstated { background: #bbf7d0; color: #16a34a; }
    .badge-pending { background: #e5e7eb; color: #6b7280; }

    .card-body {
      padding: 16px 20px;
    }

    /* ── Timeline ── */
    .timeline {
      list-style: none;
      margin: 0;
      padding: 0;
      position: relative;
    }

    .timeline-item {
      display: flex;
      gap: 12px;
      padding-bottom: 16px;
      position: relative;

      &:not(:last-child)::after {
        content: '';
        position: absolute;
        left: 5px;
        top: 14px;
        bottom: 0;
        width: 2px;
        background: #d1d5db;
      }

      &:last-child { padding-bottom: 0; }
    }

    .timeline-marker {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
    }

    .marker-red { background: #dc2626; }
    .marker-orange { background: #ea580c; }
    .marker-green { background: #16a34a; }
    .marker-gray { background: #9ca3af; }

    .timeline-content {
      flex: 1;
    }

    .timeline-label {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .timeline-date {
      margin: 2px 0 0;
      font-size: 12px;
      color: #6b7280;
    }

    /* ── Duration bar ── */
    .duration-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin: 12px 0 4px;
    }

    .duration-fill {
      height: 100%;
      border-radius: 4px;
      background: #fca5a5;
      transition: width 0.3s ease;
    }

    .duration-label {
      margin: 0 0 12px;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }

    /* ── Contested note ── */
    .contested-note {
      margin: 12px 0 0;
      padding: 10px 12px;
      background: #f0fdfa;
      border: 1px solid #99f6e4;
      border-radius: 8px;
      font-size: 13px;
      color: #134e4a;
      font-weight: 500;
    }

    /* ── Reinstatement ── */
    .reinstatement-section {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }

    .reinstatement-title {
      margin: 0 0 8px;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .reinstatement-list {
      list-style: none;
      margin: 0;
      padding: 0;

      li {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        padding: 4px 0;
        font-size: 13px;
        color: #374151;
      }

      .item-completed {
        color: #16a34a;
      }
    }

    .check-icon {
      flex-shrink: 0;
      font-size: 14px;
    }
  `,
})
export class DisqualificationTimelineComponent {
  // ── Inputs ──────────────────────────────────────────────────────
  violationType = input.required<string>();
  typeSpecificData = input<Record<string, unknown> | undefined>(undefined);
  violationDate = input<string | undefined>(undefined);

  // ── Visibility ──────────────────────────────────────────────────
  showTimeline = computed<boolean>(() => {
    return DISQUALIFICATION_TYPES.has(this.violationType());
  });

  // ── Duration calculation ────────────────────────────────────────
  private disqualDays = computed<number | null>(() => {
    const type = this.violationType();
    const tsd = this.typeSpecificData();

    if (type === 'dui') {
      const priorDui = Number(tsd?.['prior_dui_offenses'] ?? 0);
      if (priorDui >= 1) return null; // lifetime
      return tsd?.['hazmat_at_time'] === true ? 1095 : 365;
    }

    if (type === 'railroad_crossing') {
      const prior = Number(tsd?.['prior_rr_offenses'] ?? 0);
      if (prior >= 2) return 365;
      if (prior >= 1) return 120;
      return 60;
    }

    if (type === 'suspension') {
      const dur = String(tsd?.['disqualification_duration'] ?? '');
      if (dur === 'lifetime') return null;
      return SUSPENSION_DURATION_DAYS[dur] ?? undefined as unknown as number | null;
    }

    return null;
  });

  private isLifetime = computed<boolean>(() => {
    const type = this.violationType();
    const tsd = this.typeSpecificData();
    if (type === 'dui' && Number(tsd?.['prior_dui_offenses'] ?? 0) >= 1) return true;
    if (type === 'suspension' && String(tsd?.['disqualification_duration'] ?? '') === 'lifetime') return true;
    return false;
  });

  private startDate = computed<Date | null>(() => {
    const vd = this.violationDate();
    if (!vd) return null;
    const d = new Date(vd);
    return isNaN(d.getTime()) ? null : d;
  });

  private endDate = computed<Date | null>(() => {
    const start = this.startDate();
    const days = this.disqualDays();
    if (!start || days === null || days === undefined) return null;
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    return end;
  });

  private isActiveDisqualification = computed<boolean>(() => {
    const start = this.startDate();
    const end = this.endDate();
    if (!start) return false;
    const now = new Date();
    if (this.isLifetime()) return now >= start;
    if (!end) return false;
    return now >= start && now <= end;
  });

  private isReinstated = computed<boolean>(() => {
    return String(this.typeSpecificData()?.['reinstatement_status'] ?? '') === 'reinstated';
  });

  private isEligible = computed<boolean>(() => {
    if (this.isReinstated()) return false;
    if (this.isLifetime()) return false;
    const end = this.endDate();
    if (!end) return false;
    return new Date() > end;
  });

  // ── Status badge ────────────────────────────────────────────────
  statusBadge = computed<{ label: string; cssClass: string }>(() => {
    if (this.isReinstated()) return { label: 'Reinstated', cssClass: 'status-badge badge-reinstated' };
    if (this.isEligible()) return { label: 'Eligible for Reinstatement', cssClass: 'status-badge badge-eligible' };
    if (this.isActiveDisqualification()) return { label: 'Disqualified', cssClass: 'status-badge badge-disqualified' };
    return { label: 'Pending \u2014 Contact Attorney', cssClass: 'status-badge badge-pending' };
  });

  cardClass = computed<string>(() => {
    if (this.isReinstated()) return 'card disqualification-card card-reinstated';
    if (this.isActiveDisqualification()) return 'card disqualification-card card-active';
    return 'card disqualification-card';
  });

  isActiveCase = computed<boolean>(() => {
    return !this.isReinstated() && !this.isEligible();
  });

  // ── Timeline nodes ──────────────────────────────────────────────
  timelineNodes = computed<TimelineNode[]>(() => {
    const nodes: TimelineNode[] = [];
    const start = this.startDate();

    nodes.push({
      label: 'Offense Date',
      date: start ? this.fmtDate(start) : 'Not set',
      color: 'red',
      icon: '',
    });

    nodes.push({
      label: 'Disqualification Begins',
      date: start ? this.fmtDate(start) : 'Pending',
      color: 'red',
      icon: '',
    });

    if (this.isLifetime()) {
      nodes.push({
        label: 'Lifetime Disqualification',
        date: 'Petition for reinstatement after 10 years',
        color: 'red',
        icon: '',
      });
    } else {
      const end = this.endDate();
      const past = end ? new Date() > end : false;
      nodes.push({
        label: 'Reinstatement Eligible',
        date: end ? this.fmtDate(end) : 'Duration pending',
        color: past ? 'green' : 'orange',
        icon: '',
      });
    }

    if (this.isReinstated()) {
      nodes.push({
        label: 'Reinstatement Complete',
        date: 'CDL reinstated',
        color: 'green',
        icon: '\u2713',
      });
    }

    return nodes;
  });

  // ── Duration display ────────────────────────────────────────────
  durationText = computed<string>(() => {
    if (this.isLifetime()) return 'Lifetime disqualification';
    const days = this.disqualDays();
    if (days === null || days === undefined) return '';
    if (days >= 365) return `${Math.round(days / 365)} year${days >= 730 ? 's' : ''}`;
    return `${days} days`;
  });

  durationDescription = computed<string>(() => {
    const start = this.startDate();
    const end = this.endDate();
    if (this.isLifetime()) return 'Lifetime disqualification';
    if (!start || !end) return 'Duration pending';
    const days = this.disqualDays();
    return `${this.fmtDate(start)} to ${this.fmtDate(end)}, ${days} days`;
  });

  durationPercent = computed<number>(() => {
    const start = this.startDate();
    const end = this.endDate();
    if (!start || !end) return 0;
    const now = new Date();
    const total = end.getTime() - start.getTime();
    if (total <= 0) return 100;
    const elapsed = now.getTime() - start.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  });

  // ── Reinstatement items ─────────────────────────────────────────
  reinstatementItems = computed<ReinstatementItem[]>(() => {
    const type = this.violationType();
    const tsd = this.typeSpecificData();

    if (type === 'dui') {
      return [
        { label: 'Substance Abuse Professional (SAP) evaluation', completed: tsd?.['sap_enrollment_status'] === 'completed' },
        { label: 'Return-to-duty testing', completed: false },
        { label: 'Follow-up testing plan', completed: false },
        { label: 'State reinstatement fee', completed: false },
        { label: 'CDL skills test (varies by state)', completed: false },
      ];
    }

    if (type === 'railroad_crossing') {
      return [
        { label: 'Completion of disqualification period', completed: this.isEligible() || this.isReinstated() },
        { label: 'State reinstatement fee', completed: false },
        { label: 'Operation Lifesaver training (recommended)', completed: false },
      ];
    }

    if (type === 'suspension') {
      return [
        { label: 'Resolution of underlying issues', completed: false },
        { label: 'State reinstatement fee', completed: false },
        { label: 'CDL retesting (if applicable)', completed: false },
      ];
    }

    return [];
  });

  // ── Helpers ─────────────────────────────────────────────────────
  private fmtDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
