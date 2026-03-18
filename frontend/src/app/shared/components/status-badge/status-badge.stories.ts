import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { StatusBadgeComponent } from './status-badge.component';
import { SharedModule } from '../../../shared/shared.module';

const meta: Meta<StatusBadgeComponent> = {
  title: 'Foundation/Status Badge',
  component: StatusBadgeComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [SharedModule],
    }),
  ],
  argTypes: {
    status: {
      control: 'select',
      options: [
        'new',
        'reviewed',
        'assigned_to_attorney',
        'waiting_for_driver',
        'send_info_to_attorney',
        'attorney_paid',
        'call_court',
        'check_with_manager',
        'pay_attorney',
        'closed',
      ],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
};

export default meta;
type Story = StoryObj<StatusBadgeComponent>;

export const New: Story = {
  args: { status: 'new', size: 'medium', showIcon: true },
};

export const Reviewed: Story = {
  args: { status: 'reviewed', size: 'medium', showIcon: true },
};

export const AssignedToAttorney: Story = {
  args: { status: 'assigned_to_attorney', size: 'medium', showIcon: true },
};

export const WaitingForDriver: Story = {
  args: { status: 'waiting_for_driver', size: 'medium', showIcon: true },
};

export const AttorneyPaid: Story = {
  args: { status: 'attorney_paid', size: 'medium', showIcon: true },
};

export const CallCourt: Story = {
  args: { status: 'call_court', size: 'medium', showIcon: true },
};

export const Closed: Story = {
  args: { status: 'closed', size: 'medium', showIcon: true },
};

export const SmallSize: Story = {
  args: { status: 'new', size: 'small', showIcon: true },
};

export const LargeSize: Story = {
  args: { status: 'assigned_to_attorney', size: 'large', showIcon: true },
};

export const NoIcon: Story = {
  args: { status: 'reviewed', size: 'medium', showIcon: false },
};

export const Clickable: Story = {
  args: { status: 'new', size: 'medium', showIcon: true, clickable: true },
};
