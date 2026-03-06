import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-wrapper">
      @for (item of rowArray(); track $index) {
        <div class="skeleton-row" [style.height.px]="height()">
          <div class="skeleton-shimmer"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-row {
      border-radius: 8px;
      overflow: hidden;
      background: #e0e0e0;
      position: relative;
    }

    .skeleton-shimmer {
      position: absolute;
      top: 0;
      left: -100%;
      width: 60%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.6) 50%,
        transparent 100%
      );
      animation: shimmer 1.4s infinite;
    }

    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 200%; }
    }
  `]
})
export class SkeletonLoaderComponent {
  rows = input<number>(3);
  height = input<number>(80);
  rowArray = computed(() => Array.from({ length: this.rows() }));
}
