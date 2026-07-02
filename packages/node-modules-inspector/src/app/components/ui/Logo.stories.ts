import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Logo from './Logo.vue'

const meta = {
  title: 'UI/Logo',
  component: Logo,
  tags: ['autodocs'],
} satisfies Meta<typeof Logo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { Logo },
    template: `<Logo class="w-24 h-24" />`,
  }),
}

export const Sizes: Story = {
  render: () => ({
    components: { Logo },
    template: `<div class="flex items-end gap-4">
      <Logo class="w-8 h-8" />
      <Logo class="w-12 h-12" />
      <Logo class="w-20 h-20" />
    </div>`,
  }),
}
