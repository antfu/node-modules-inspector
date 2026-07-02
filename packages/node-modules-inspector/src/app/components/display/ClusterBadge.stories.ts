import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ClusterBadge from './ClusterBadge.vue'

const meta = {
  title: 'Display/ClusterBadge',
  component: ClusterBadge,
  tags: ['autodocs'],
  args: { cluster: 'catalog:frontend' },
} satisfies Meta<typeof ClusterBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Namespaced: Story = { args: { cluster: 'catalog:frontend' } }
export const Plain: Story = { args: { cluster: 'workspace' } }

export const Gallery: Story = {
  render: () => ({
    components: { ClusterBadge },
    template: `<div class="flex flex-wrap items-center gap-2">
      <ClusterBadge cluster="catalog:frontend" />
      <ClusterBadge cluster="catalog:deps" />
      <ClusterBadge cluster="workspace" />
      <ClusterBadge cluster="prod" />
    </div>`,
  }),
}
