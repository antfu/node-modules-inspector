import type { Meta, StoryObj } from '@storybook/vue3-vite'
import NumberBadge from './NumberBadge.vue'

const meta = {
  title: 'Display/NumberBadge',
  component: NumberBadge,
  tags: ['autodocs'],
  argTypes: {
    format: { control: 'inline-radio', options: ['locale', 'percent'] },
  },
  args: { number: 128 },
} satisfies Meta<typeof NumberBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { number: 1234 } }
export const WithIcon: Story = { args: { number: 42, icon: 'i-ph-package-duotone' } }
export const Colored: Story = { args: { number: 7, color: 'badge-color-green' } }
export const Affixed: Story = { args: { number: 128, prefix: '×', suffix: ' deps' } }
export const Percent: Story = { args: { number: 0.9231, format: 'percent', color: 'badge-color-blue' } }

export const Gallery: Story = {
  render: () => ({
    components: { NumberBadge },
    template: `<div class="flex flex-wrap items-center gap-2">
      <NumberBadge :number="1234" />
      <NumberBadge :number="42" icon="i-ph-package-duotone" color="badge-color-green" />
      <NumberBadge :number="0.42" format="percent" color="badge-color-blue" />
      <NumberBadge :number="9" prefix="×" color="badge-color-amber" />
    </div>`,
  }),
}
