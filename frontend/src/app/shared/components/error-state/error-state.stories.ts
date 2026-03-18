import type { Meta, StoryObj } from '@storybook/angular';
import { ErrorStateComponent } from './error-state.component';

const meta: Meta<ErrorStateComponent> = {
  title: 'Foundation/Error State',
  component: ErrorStateComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<ErrorStateComponent>;

export const Default: Story = {
  args: {
    message: 'Something went wrong. Please try again later.',
    retryLabel: 'Retry',
  },
};

export const NoRetry: Story = {
  args: {
    message: 'Unable to load cases. Check your connection.',
    retryLabel: '',
  },
};

export const NetworkError: Story = {
  args: {
    message: 'Network error — could not reach the server.',
    retryLabel: 'Try Again',
  },
};

export const PermissionDenied: Story = {
  args: {
    message: 'You do not have permission to view this resource.',
    retryLabel: '',
  },
};
