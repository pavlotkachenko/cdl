import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CardComponent } from './card.component';
import { SharedModule } from '../../../shared/shared.module';

const meta: Meta<CardComponent> = {
  title: 'Foundation/Card',
  component: CardComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [SharedModule],
    }),
  ],
};

export default meta;
type Story = StoryObj<CardComponent>;

export const Default: Story = {
  args: {
    title: 'Case #CDL-2024-0042',
    subtitle: 'Speeding violation — Texas',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-card [title]="title" [subtitle]="subtitle">
        <p style="margin: 0; color: #6B7280;">
          Submitted on March 15, 2026. Status: Under Review.
        </p>
      </app-card>
    `,
  }),
};

export const NoHeader: Story = {
  render: () => ({
    template: `
      <app-card>
        <p style="margin: 0;">Simple card with no header — just content.</p>
      </app-card>
    `,
  }),
};

export const Clickable: Story = {
  args: {
    title: 'Attorney: James Wilson',
    subtitle: 'CDL Defense Specialist',
    clickable: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <app-card [title]="title" [subtitle]="subtitle" [clickable]="clickable">
        <p style="margin: 0; color: #6B7280;">Rating: 4.8/5 &middot; 120 cases handled</p>
      </app-card>
    `,
  }),
};

export const DashboardKPI: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 800px;">
        <app-card title="Active Cases">
          <p style="margin: 0; font-size: 32px; font-weight: 700; color: #1DAD8C;">12</p>
        </app-card>
        <app-card title="Pending Review">
          <p style="margin: 0; font-size: 32px; font-weight: 700; color: #F59E0B;">5</p>
        </app-card>
        <app-card title="Closed">
          <p style="margin: 0; font-size: 32px; font-weight: 700; color: #6B7280;">47</p>
        </app-card>
      </div>
    `,
  }),
};
