import type { Meta, StoryObj } from '@storybook/angular';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

const meta: Meta<SkeletonLoaderComponent> = {
  title: 'Foundation/Skeleton Loader',
  component: SkeletonLoaderComponent,
  tags: ['autodocs'],
  argTypes: {
    rows: { control: { type: 'number', min: 1, max: 10 } },
    height: { control: { type: 'number', min: 20, max: 200 } },
  },
};

export default meta;
type Story = StoryObj<SkeletonLoaderComponent>;

export const Default: Story = {
  args: { rows: 3, height: 80 },
};

export const SingleRow: Story = {
  args: { rows: 1, height: 60 },
};

export const CardList: Story = {
  args: { rows: 5, height: 100 },
};

export const CompactList: Story = {
  args: { rows: 8, height: 32 },
};
