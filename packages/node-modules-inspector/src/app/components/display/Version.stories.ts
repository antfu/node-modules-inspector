import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Version from './Version.vue'

const meta = {
  title: 'Display/Version',
  component: Version,
  tags: ['autodocs'],
  args: { version: '2.1.3' },
} satisfies Meta<typeof Version>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { version: '2.1.3' } }
export const Prerelease: Story = { args: { version: '5.0.0-alpha.6' } }
export const CustomPrefix: Story = { args: { version: '18.0.0', prefix: 'node ' } }
export const RangeSpecifier: Story = { args: { version: 'catalog:frontend' } }
