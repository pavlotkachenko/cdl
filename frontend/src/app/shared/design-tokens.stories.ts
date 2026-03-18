import type { Meta, StoryObj } from '@storybook/angular';
import { Component } from '@angular/core';

@Component({
  selector: 'app-design-tokens-demo',
  template: `
    <div class="tokens-page">
      <h2>CDL Design Tokens</h2>
      <p class="desc">Switch themes using the toolbar above (paintbrush icon).</p>

      <section>
        <h3>Brand Colors</h3>
        <div class="swatches">
          <div class="swatch" style="background: var(--cdl-accent);"><span>accent<br>#1DAD8C</span></div>
          <div class="swatch" style="background: var(--cdl-primary-black); color: white;"><span>primary-black<br>#090000</span></div>
          <div class="swatch" style="background: var(--cdl-title-black); color: white;"><span>title-black<br>#020000</span></div>
          <div class="swatch" style="background: var(--cdl-light-grey);"><span>light-grey<br>#EFF3F6</span></div>
          <div class="swatch" style="background: var(--cdl-grey);"><span>grey<br>#E5EAEE</span></div>
          <div class="swatch" style="background: var(--cdl-dark-grey); color: white;"><span>dark-grey<br>#9C9C9C</span></div>
        </div>
      </section>

      <section>
        <h3>Semantic Colors</h3>
        <div class="swatches">
          <div class="swatch" style="background: var(--cdl-success); color: white;"><span>success</span></div>
          <div class="swatch" style="background: var(--cdl-warning); color: white;"><span>warning</span></div>
          <div class="swatch" style="background: var(--cdl-error); color: white;"><span>error</span></div>
          <div class="swatch" style="background: var(--cdl-info); color: white;"><span>info</span></div>
        </div>
      </section>

      <section>
        <h3>Status Colors</h3>
        <div class="swatches">
          <div class="swatch small" style="background: var(--cdl-status-new); color: white;"><span>new</span></div>
          <div class="swatch small" style="background: var(--cdl-status-reviewed); color: white;"><span>reviewed</span></div>
          <div class="swatch small" style="background: var(--cdl-status-assigned); color: white;"><span>assigned</span></div>
          <div class="swatch small" style="background: var(--cdl-status-waiting); color: white;"><span>waiting</span></div>
          <div class="swatch small" style="background: var(--cdl-status-in-progress); color: white;"><span>in-progress</span></div>
          <div class="swatch small" style="background: var(--cdl-status-completed); color: white;"><span>completed</span></div>
          <div class="swatch small" style="background: var(--cdl-status-closed); color: white;"><span>closed</span></div>
        </div>
      </section>

      <section>
        <h3>Surfaces</h3>
        <div class="surface-demo">
          <div class="surface" style="background: var(--cdl-bg-page); border: 1px solid var(--cdl-border-color);">
            <span>bg-page</span>
            <div class="surface" style="background: var(--cdl-bg-surface); box-shadow: var(--cdl-shadow-md);">
              <span>bg-surface</span>
              <div class="surface" style="background: var(--cdl-bg-card); box-shadow: var(--cdl-shadow-sm);">
                <span>bg-card</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3>Typography Scale</h3>
        <div class="type-scale" style="color: var(--cdl-text-heading);">
          <div style="font-size: var(--cdl-fs-h1); font-weight: 700; line-height: var(--cdl-lh-tight);">H1 — 60px</div>
          <div style="font-size: var(--cdl-fs-h2); font-weight: 700; line-height: var(--cdl-lh-tight);">H2 — 50px</div>
          <div style="font-size: var(--cdl-fs-h3); font-weight: 700; line-height: var(--cdl-lh-tight);">H3 — 40px</div>
          <div style="font-size: var(--cdl-fs-h4); font-weight: 600; line-height: var(--cdl-lh-normal);">H4 — 25px</div>
          <div style="font-size: var(--cdl-fs-body); line-height: var(--cdl-lh-normal); color: var(--cdl-text-primary);">Body — 16px regular text</div>
          <div style="font-size: var(--cdl-fs-small); color: var(--cdl-text-secondary);">Small — 14px secondary text</div>
          <div style="font-size: var(--cdl-fs-tiny); color: var(--cdl-text-disabled);">Tiny — 12px caption text</div>
        </div>
      </section>

      <section>
        <h3>Spacing Scale</h3>
        <div class="spacing-scale">
          <div class="space-row"><div class="space-bar" style="width: var(--cdl-space-xs);"></div><span>xs — 5px</span></div>
          <div class="space-row"><div class="space-bar" style="width: var(--cdl-space-sm);"></div><span>sm — 10px</span></div>
          <div class="space-row"><div class="space-bar" style="width: var(--cdl-space-md);"></div><span>md — 15px</span></div>
          <div class="space-row"><div class="space-bar" style="width: var(--cdl-space-lg);"></div><span>lg — 20px</span></div>
          <div class="space-row"><div class="space-bar" style="width: var(--cdl-space-xl);"></div><span>xl — 30px</span></div>
          <div class="space-row"><div class="space-bar" style="width: var(--cdl-space-2xl);"></div><span>2xl — 40px</span></div>
          <div class="space-row"><div class="space-bar" style="width: var(--cdl-space-3xl);"></div><span>3xl — 60px</span></div>
          <div class="space-row"><div class="space-bar" style="width: var(--cdl-space-4xl);"></div><span>4xl — 80px</span></div>
        </div>
      </section>

      <section>
        <h3>Border Radius</h3>
        <div class="swatches">
          <div class="radius-box" style="border-radius: var(--cdl-radius-sm);"><span>sm — 3px</span></div>
          <div class="radius-box" style="border-radius: var(--cdl-radius-md);"><span>md — 4px</span></div>
          <div class="radius-box" style="border-radius: var(--cdl-radius-lg);"><span>lg — 8px</span></div>
          <div class="radius-box" style="border-radius: var(--cdl-radius-xl);"><span>xl — 12px</span></div>
          <div class="radius-box" style="border-radius: var(--cdl-radius-pill);"><span>pill — 31.5px</span></div>
        </div>
      </section>

      <section>
        <h3>Shadows</h3>
        <div class="swatches">
          <div class="shadow-box" style="box-shadow: var(--cdl-shadow-sm);"><span>sm</span></div>
          <div class="shadow-box" style="box-shadow: var(--cdl-shadow-md);"><span>md</span></div>
          <div class="shadow-box" style="box-shadow: var(--cdl-shadow-lg);"><span>lg</span></div>
          <div class="shadow-box" style="box-shadow: var(--cdl-shadow-xl);"><span>xl</span></div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .tokens-page {
      font-family: var(--cdl-font-primary, 'Mulish', sans-serif);
      color: var(--cdl-text-primary, #090000);
      padding: 20px;
      background: var(--cdl-bg-page, #fff);
    }
    h2 { font-size: 28px; margin-bottom: 4px; color: var(--cdl-text-heading); }
    h3 { font-size: 18px; margin: 24px 0 12px; color: var(--cdl-text-heading); border-bottom: 1px solid var(--cdl-border-color); padding-bottom: 8px; }
    .desc { color: var(--cdl-text-secondary); font-size: 14px; margin-bottom: 20px; }
    .swatches { display: flex; flex-wrap: wrap; gap: 12px; }
    .swatch {
      width: 120px; height: 80px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600; text-align: center;
    }
    .swatch.small { width: 100px; height: 60px; font-size: 11px; }
    .surface-demo { padding: 12px; }
    .surface {
      padding: 16px; border-radius: 8px; margin: 8px 0;
      font-size: 12px; color: var(--cdl-text-secondary);
    }
    .type-scale > div { margin-bottom: 8px; }
    .spacing-scale { display: flex; flex-direction: column; gap: 6px; }
    .space-row { display: flex; align-items: center; gap: 12px; }
    .space-bar { height: 16px; background: var(--cdl-accent); border-radius: 2px; }
    .space-row span { font-size: 12px; color: var(--cdl-text-secondary); }
    .radius-box {
      width: 100px; height: 60px;
      background: var(--cdl-bg-surface-variant);
      border: 2px solid var(--cdl-accent);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; color: var(--cdl-text-primary);
    }
    .shadow-box {
      width: 120px; height: 80px; border-radius: 8px;
      background: var(--cdl-bg-card);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; color: var(--cdl-text-primary);
    }
  `]
})
class DesignTokensDemoComponent {}

const meta: Meta<DesignTokensDemoComponent> = {
  title: 'Design System/Tokens',
  component: DesignTokensDemoComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<DesignTokensDemoComponent>;

export const AllTokens: Story = {};
