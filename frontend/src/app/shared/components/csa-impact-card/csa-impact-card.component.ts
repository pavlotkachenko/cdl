// ============================================
// CSA Impact Card — Sprint 075 / VD-4
// Shared standalone component showing CSA BASIC category,
// severity weight, time weight, percentile impact, OOS bonus.
// ============================================

import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';

import {
  VIOLATION_TYPE_REGISTRY,
  type ViolationTypeConfig,
} from '../../../core/constants/violation-type-registry';

/** Severity weight estimate ranges by violation type */
const SEVERITY_ESTIMATES: Record<string, string> = {
  speeding: '5\u20137',
  dui: '8\u201310',
  reckless_driving: '6\u20138',
  hos_logbook: '5\u20137',
  dot_inspection: '1\u20138',
  dqf: '4\u20136',
  equipment_defect: '1\u20138',
  overweight_oversize: '2\u20134',
  hazmat: '4\u20138',
  railroad_crossing: '7\u20139',
  suspension: '8\u201310',
  seatbelt_cell_phone: '4\u20135',
  csa_score: '1\u201310',
};

/** BASIC categories with intervention thresholds */
const BASIC_THRESHOLDS: Record<string, number> = {
  'Unsafe Driving': 65,
  'HOS Compliance': 65,
  'Vehicle Maintenance': 80,
  'Controlled Substances/Alcohol': 65,
  'Hazmat Compliance': 80,
  'Driver Fitness': 65,
  'Crash Indicator': 65,
};

/** Badge colors per BASIC category */
const BASIC_COLORS: Record<string, string> = {
  'Unsafe Driving': '#dc2626',
  'HOS Compliance': '#ea580c',
  'Vehicle Maintenance': '#ca8a04',
  'Controlled Substances/Alcohol': '#7c3aed',
  'Hazmat Compliance': '#b91c1c',
  'Driver Fitness': '#2563eb',
  'Crash Indicator': '#991b1b',
};

@Component({
  selector: 'app-csa-impact-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showCard()) {
      <section class="card csa-card" aria-labelledby="csa-heading">
        <div class="card-header">
          <h2 id="csa-heading"><span aria-hidden="true">&#128202;</span> CSA Score Impact</h2>
        </div>
        <div class="card-body">

          <!-- BASIC Category -->
          <div class="csa-section">
            <h3 class="section-title">BASIC Category</h3>
            <span class="basic-badge"
                  [style.background]="basicColor()"
                  [attr.aria-label]="'CSA BASIC category: ' + basicCategory()">
              {{ basicCategory() }}
            </span>
            <p class="threshold-text">Intervention threshold: {{ threshold() }}th percentile</p>
          </div>

          <!-- Severity Weight -->
          <div class="csa-section">
            <h3 class="section-title">Severity Weight</h3>
            @if (exactSeverity() !== null) {
              <p class="severity-value">{{ exactSeverity() }} <span class="severity-scale">/ 10</span></p>
            } @else {
              <p class="severity-value">{{ severityEstimate() }} <span class="severity-scale">points (est.)</span></p>
            }
            <div class="severity-bar-container">
              <div class="severity-bar"
                   role="meter"
                   [attr.aria-valuenow]="severityBarValue()"
                   aria-valuemin="1"
                   aria-valuemax="10"
                   [attr.aria-label]="'Severity weight: ' + severityBarValue() + ' out of 10'"
                   [style.width.%]="severityBarPercent()"
                   [class]="severityBarClass()">
              </div>
            </div>
          </div>

          <!-- Time Weight -->
          <div class="csa-section">
            <h3 class="section-title">Time Weight</h3>
            @if (timeWeight()) {
              <span class="time-badge" [class]="timeWeight()!.cssClass"
                    [attr.aria-label]="timeWeight()!.label + ': ' + timeWeight()!.multiplier + 'x weight'">
                {{ timeWeight()!.multiplier }}x &mdash; {{ timeWeight()!.label }}
              </span>
            } @else {
              <p class="time-missing">Violation date needed for time weight calculation</p>
            }
          </div>

          <!-- Percentile Display -->
          <div class="csa-section">
            <h3 class="section-title">Carrier Percentile</h3>
            @if (hasPercentiles()) {
              @let tsd = typeSpecificData()!;
              <div class="percentile-display"
                   [attr.aria-label]="'Current percentile: ' + tsd['current_percentile'] + ', Projected: ' + tsd['projected_percentile']">
                <div class="percentile-row">
                  <span class="percentile-label">Current</span>
                  <span class="percentile-value">{{ tsd['current_percentile'] }}</span>
                  <span class="percentile-arrow" aria-hidden="true">&rarr;</span>
                  <span class="percentile-label">Projected</span>
                  <span class="percentile-value percentile-projected" [class.percentile-over]="projectedOverThreshold()">{{ tsd['projected_percentile'] }}</span>
                </div>
                @if (projectedOverThreshold()) {
                  <p class="percentile-warning" role="status">Above intervention threshold</p>
                }
              </div>
            } @else {
              <p class="percentile-info">CSA percentiles are calculated by FMCSA based on your carrier's full inspection history.</p>
              <p class="percentile-info">Ask your carrier for their current BASIC scores.</p>
            }
          </div>

          <!-- OOS Bonus -->
          @if (hasOosBonus()) {
            <div class="csa-section oos-section" role="status">
              <p class="oos-text"><span aria-hidden="true">&#9940;</span> +2 OOS bonus points</p>
              <p class="oos-note">Out-of-service violations carry additional severity points</p>
            </div>
          }

          <!-- Footer -->
          <div class="csa-footer">
            <p>CSA scores affect carrier safety ratings and can trigger FMCSA interventions.</p>
            <p>Contesting this violation may prevent CSA points from being recorded.</p>
          </div>

        </div>
      </section>
    }
  `,
  styles: `
    .csa-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;

      h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #111827;
      }
    }

    .card-body {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .csa-section {
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .section-title {
      margin: 0 0 6px;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    /* ── BASIC badge ── */
    .basic-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
    }

    .threshold-text {
      margin: 6px 0 0;
      font-size: 12px;
      color: #6b7280;
    }

    /* ── Severity ── */
    .severity-value {
      margin: 0 0 6px;
      font-size: 18px;
      font-weight: 700;
      color: #111827;
    }

    .severity-scale {
      font-size: 13px;
      font-weight: 400;
      color: #6b7280;
    }

    .severity-bar-container {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .severity-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .severity-low { background: #22c55e; }
    .severity-medium { background: #eab308; }
    .severity-high { background: #f97316; }
    .severity-critical { background: #ef4444; }

    /* ── Time weight ── */
    .time-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
    }

    .time-recent { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .time-moderate { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }
    .time-reduced { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .time-expired { background: #f9fafb; color: #6b7280; border: 1px solid #e5e7eb; }

    .time-missing {
      margin: 0;
      font-size: 13px;
      color: #9ca3af;
      font-style: italic;
    }

    /* ── Percentile ── */
    .percentile-display {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .percentile-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .percentile-label {
      font-size: 12px;
      color: #6b7280;
    }

    .percentile-value {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
    }

    .percentile-projected.percentile-over {
      color: #dc2626;
    }

    .percentile-arrow {
      font-size: 14px;
      color: #9ca3af;
    }

    .percentile-warning {
      margin: 4px 0 0;
      font-size: 13px;
      font-weight: 600;
      color: #dc2626;
    }

    .percentile-info {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
    }

    /* ── OOS ── */
    .oos-section {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .oos-text {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #dc2626;
    }

    .oos-note {
      margin: 2px 0 0;
      font-size: 12px;
      color: #b91c1c;
    }

    /* ── Footer ── */
    .csa-footer {
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;

      p {
        margin: 0 0 4px;
        font-size: 12px;
        color: #9ca3af;
        line-height: 1.5;

        &:last-child { margin-bottom: 0; }
      }
    }
  `,
})
export class CsaImpactCardComponent {
  // ── Inputs ──────────────────────────────────────────────────────
  violationType = input.required<string>();
  typeSpecificData = input<Record<string, unknown> | undefined>(undefined);
  violationDate = input<string | undefined>(undefined);

  // ── Computed: registry config ───────────────────────────────────
  config = computed<ViolationTypeConfig | null>(() => {
    return VIOLATION_TYPE_REGISTRY[this.violationType()] ?? null;
  });

  showCard = computed<boolean>(() => {
    return !!this.config()?.csaBasic;
  });

  basicCategory = computed<string>(() => {
    return this.config()?.csaBasic ?? '';
  });

  basicColor = computed<string>(() => {
    return BASIC_COLORS[this.basicCategory()] ?? '#6b7280';
  });

  threshold = computed<number>(() => {
    return BASIC_THRESHOLDS[this.basicCategory()] ?? 65;
  });

  // ── Severity ────────────────────────────────────────────────────
  exactSeverity = computed<number | null>(() => {
    const sw = this.typeSpecificData()?.['severity_weight'];
    if (sw !== undefined && sw !== null && !isNaN(Number(sw))) {
      return Number(sw);
    }
    return null;
  });

  severityEstimate = computed<string>(() => {
    return SEVERITY_ESTIMATES[this.violationType()] ?? '1\u201310';
  });

  severityBarValue = computed<number>(() => {
    const exact = this.exactSeverity();
    if (exact !== null) return exact;
    // Use midpoint of estimate range
    const est = SEVERITY_ESTIMATES[this.violationType()];
    if (!est) return 5;
    const parts = est.split('\u2013');
    const low = Number(parts[0]);
    const high = Number(parts[1] ?? parts[0]);
    return Math.round((low + high) / 2);
  });

  severityBarPercent = computed<number>(() => {
    return Math.min(100, Math.max(0, (this.severityBarValue() / 10) * 100));
  });

  severityBarClass = computed<string>(() => {
    const val = this.severityBarValue();
    if (val <= 3) return 'severity-bar severity-low';
    if (val <= 6) return 'severity-bar severity-medium';
    if (val <= 8) return 'severity-bar severity-high';
    return 'severity-bar severity-critical';
  });

  // ── Time Weight ─────────────────────────────────────────────────
  timeWeight = computed<{ multiplier: string; label: string; cssClass: string } | null>(() => {
    const vd = this.violationDate();
    if (!vd) return null;

    const violDate = new Date(vd);
    const now = new Date();
    const monthsAgo = (now.getFullYear() - violDate.getFullYear()) * 12
      + (now.getMonth() - violDate.getMonth());

    if (monthsAgo < 0) {
      // Future date — treat as most recent
      return { multiplier: '3', label: 'Recent \u2014 Maximum Impact', cssClass: 'time-badge time-recent' };
    }
    if (monthsAgo < 6) {
      return { multiplier: '3', label: 'Recent \u2014 Maximum Impact', cssClass: 'time-badge time-recent' };
    }
    if (monthsAgo < 12) {
      return { multiplier: '2', label: 'Moderate Impact', cssClass: 'time-badge time-moderate' };
    }
    if (monthsAgo < 24) {
      return { multiplier: '1', label: 'Reduced Impact', cssClass: 'time-badge time-reduced' };
    }
    return { multiplier: '0', label: 'Expired \u2014 No CSA Impact', cssClass: 'time-badge time-expired' };
  });

  // ── Percentiles ─────────────────────────────────────────────────
  hasPercentiles = computed<boolean>(() => {
    const tsd = this.typeSpecificData();
    return tsd?.['current_percentile'] !== undefined
      && tsd?.['projected_percentile'] !== undefined;
  });

  projectedOverThreshold = computed<boolean>(() => {
    const tsd = this.typeSpecificData();
    if (!this.hasPercentiles()) return false;
    const projected = Number(tsd?.['projected_percentile']);
    return projected >= this.threshold();
  });

  // ── OOS Bonus ───────────────────────────────────────────────────
  hasOosBonus = computed<boolean>(() => {
    const tsd = this.typeSpecificData();
    return tsd?.['vehicle_oos'] === true || tsd?.['driver_oos'] === true;
  });
}
