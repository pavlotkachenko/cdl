import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ButtonComponent } from './button.component';
import { SharedModule } from '../../../shared/shared.module';

const meta: Meta<ButtonComponent> = {
  title: 'Foundation/Button',
  component: ButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [SharedModule],
    }),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'text', 'danger'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
    },
  },
};

export default meta;
type Story = StoryObj<ButtonComponent>;

export const Primary: Story = {
  args: {
    label: 'Submit Ticket',
    variant: 'primary',
    size: 'medium',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Cancel',
    variant: 'secondary',
    size: 'medium',
  },
};

export const Outline: Story = {
  args: {
    label: 'View Details',
    variant: 'outline',
    size: 'medium',
  },
};

export const Danger: Story = {
  args: {
    label: 'Delete Case',
    variant: 'danger',
    size: 'medium',
  },
};

export const Loading: Story = {
  args: {
    label: 'Submitting...',
    variant: 'primary',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Not Available',
    variant: 'primary',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Sign In',
    variant: 'primary',
    size: 'large',
    fullWidth: true,
  },
};

export const Small: Story = {
  args: {
    label: 'Edit',
    variant: 'outline',
    size: 'small',
  },
};

export const Large: Story = {
  args: {
    label: 'Get Started',
    variant: 'primary',
    size: 'large',
  },
};

export const TextVariant: Story = {
  args: {
    label: 'Learn More',
    variant: 'text',
    size: 'medium',
  },
};
