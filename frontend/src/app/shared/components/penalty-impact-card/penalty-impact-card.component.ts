// ============================================
// Penalty Impact Card — Sprint 075 / VD-3
// Shared standalone component showing potential penalties,
// disqualification risk, license points, FMCSA consequences,
// and attorney value proposition.
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

/** Points estimate lookup by violation type */
const POINTS_ESTIMATES: Record<string, string> = {
  speeding: '4\u20136 points (varies by state and mph over)',
  dui: '6\u20138 points',
  reckless_driving: '4\u20136 points',
  seatbelt_cell_phone: '2\u20133 points',
  hos_logbook: '2\u20134 points',
  suspension: '6\u20138 points',
  railroad_crossing: '4\u20136 points',
};
const DEFAULT_POINTS = 'Varies by state';

/** Types where FMCSA serious-traffic-violation stacking rules apply */
const FMCSA_APPLICABLE_TYPES = new Set([
  'speeding',
  'reckless_driving',
  'seatbelt_cell_phone',
  'hos_logbook',
  'dqf',
  'railroad_crossing',
  'dui',
  'suspension',
]);

@Component({
  selector: 'app-penalty-impact-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (config()) {
      <section class="card penalty-card" aria-labelledby="penalty-heading">
        <div class="card-header">
          <h2 id="penalty-heading"><span aria-hidden="true">&#9889;</span> Potential Penalties</h2>
        </div>
        <div class="card-body">

          <!-- Fine Range Section -->
          <div class="penalty-section">
            <h3 class="section-title">Fine</h3>
            @if (fineAmount() !== undefined && fineAmount() !== null) {
              <p class="fine-assessed"
                 [attr.aria-label]="'Fine assessed: ' + fineAmount()!.toLocaleString('en-US', { style: 'currency', currency: 'USD' })">
                <span class="fine-label">Fine Assessed</span>
                <span class="fine-value">\${{ fineAmount()!.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
              </p>
              @if (config()!.fineRange.max > 0) {
                <p class="fine-range-note">Typical range: \${{ config()!.fineRange.min.toLocaleString() }} &ndash; \${{ config()!.fineRange.max.toLocaleString() }}</p>
              }
            } @else {
              @if (config()!.fineRange.max > 0) {
                <p class="fine-estimated">
                  <span class="fine-label">Estimated Range</span>
                  <span class="fine-value">\${{ config()!.fineRange.min.toLocaleString() }} &ndash; \${{ config()!.fineRange.max.toLocaleString() }}</span>
                </p>
              } @else {
                <p class="fine-na">No fine typically assessed</p>
              }
            }
          </div>

          <!-- Disqualification Risk Section -->
          @if (config()!.disqualificationRisk) {
            <div class="penalty-section disqualification-section" role="alert">
              <h3 class="section-title disqualification-title">
                <span aria-hidden="true">&#9940;</span> CDL Disqualification Risk
              </h3>
              <p class="disqualification-duration">{{ disqualificationDuration() }}</p>
              <p class="disqualification-note">Your CDL may be suspended or revoked</p>
            </div>
          }

          <!-- License Points Section -->
          <div class="penalty-section">
            <h3 class="section-title">License Points</h3>
            <p class="points-estimate">{{ pointsEstimate() }}</p>
            <p class="points-note">Point values vary by state. Check your state DMV.</p>
          </div>

          <!-- FMCSA Consequences Section -->
          @if (showFmcsa()) {
            <div class="penalty-section">
              <h3 class="section-title">FMCSA Consequences</h3>
              <ul class="fmcsa-list">
                <li>Two serious traffic violations within 3 years &rarr; 60-day CDL disqualification</li>
                <li>Three serious traffic violations within 3 years &rarr; 120-day CDL disqualification</li>
              </ul>
            </div>
          }

          <!-- Attorney Value Proposition -->
          <div class="attorney-cta">
            <div class="cta-content">
              <span class="cta-icon" aria-hidden="true">&#128737;&#65039;</span>
              <p class="cta-text">An attorney may help reduce or dismiss these penalties</p>
            </div>
            @if (hasAttorney()) {
              <button class="btn-cta" aria-label="Send a message to your assigned attorney">
                Message Your Attorney
              </button>
            } @else {
              <button class="btn-cta btn-cta-learn" aria-label="Learn more about attorney representation">
                Learn More
              </button>
            }
          </div>

        </div>
      </section>
    }
  `,
  styles: `
    .penalty-card {
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

    .penalty-section {
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

    /* ── Fine ── */
    .fine-assessed,
    .fine-estimated {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .fine-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .fine-value {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
    }

    .fine-range-note {
      margin: 4px 0 0;
      font-size: 13px;
      color: #6b7280;
    }

    .fine-na {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
    }

    /* ── Disqualification ── */
    .disqualification-section {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .disqualification-title {
      color: #dc2626;
    }

    .disqualification-duration {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #991b1b;
    }

    .disqualification-note {
      margin: 4px 0 0;
      font-size: 13px;
      color: #b91c1c;
    }

    /* ── Points ── */
    .points-estimate {
      margin: 0;
      font-size: 15px;
      font-weight: 500;
      color: #111827;
    }

    .points-note {
      margin: 4px 0 0;
      font-size: 12px;
      color: #9ca3af;
    }

    /* ── FMCSA ── */
    .fmcsa-list {
      margin: 0;
      padding: 0 0 0 20px;
      font-size: 13px;
      color: #374151;
      line-height: 1.6;
    }

    /* ── Attorney CTA ── */
    .attorney-cta {
      padding: 14px;
      background: #f0fdfa;
      border-radius: 8px;
      border: 1px solid #99f6e4;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .cta-content {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .cta-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .cta-text {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
      color: #134e4a;
    }

    .btn-cta {
      width: 100%;
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      background: #1dad8c;
      color: #fff;
      transition: background 0.15s;

      &:hover {
        background: #17946f;
      }

      &:focus-visible {
        outline: 2px solid #1dad8c;
        outline-offset: 2px;
      }
    }

    .btn-cta-learn {
      background: transparent;
      color: #1dad8c;
      border: 1px solid #1dad8c;

      &:hover {
        background: #f0fdfa;
      }
    }
  `,
})
export class PenaltyImpactCardComponent {
  // ── Inputs ──────────────────────────────────────────────────────
  violationType = input.required<string>();
  typeSpecificData = input<Record<string, unknown> | undefined>(undefined);
  fineAmount = input<number | undefined>(undefined);
  hasAttorney = input<boolean>(false);

  // ── Computed ────────────────────────────────────────────────────
  config = computed<ViolationTypeConfig | null>(() => {
    return VIOLATION_TYPE_REGISTRY[this.violationType()] ?? null;
  });

  pointsEstimate = computed<string>(() => {
    return POINTS_ESTIMATES[this.violationType()] ?? DEFAULT_POINTS;
  });

  showFmcsa = computed<boolean>(() => {
    return FMCSA_APPLICABLE_TYPES.has(this.violationType());
  });

  disqualificationDuration = computed<string>(() => {
    const type = this.violationType();
    const tsd = this.typeSpecificData();

    if (type === 'dui') {
      const hazmat = tsd?.['hazmat_at_time'] === true;
      return hazmat
        ? '3-year minimum (Hazmat endorsement active)'
        : '1-year minimum (3-year if Hazmat)';
    }

    if (type === 'railroad_crossing') {
      const priorOffenses = Number(tsd?.['prior_rr_offenses'] ?? 0);
      if (priorOffenses >= 2) return '1-year disqualification (3rd+ offense)';
      if (priorOffenses >= 1) return '120-day disqualification (2nd offense)';
      return '60-day disqualification (1st offense)';
    }

    if (type === 'suspension') {
      const duration = tsd?.['disqualification_duration'];
      if (duration) {
        const labels: Record<string, string> = {
          '60_day': '60-day disqualification',
          '120_day': '120-day disqualification',
          '1_year': '1-year disqualification',
          '3_year': '3-year disqualification',
          'lifetime': 'Lifetime disqualification',
        };
        return labels[String(duration)] ?? String(duration);
      }
      return 'Duration depends on violation history';
    }

    return 'CDL disqualification may apply';
  });
}
