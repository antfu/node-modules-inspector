import type { Preview } from '@storybook/vue3-vite'
import { GLOBALS_UPDATED } from 'storybook/internal/core-events'
import { addons } from 'storybook/preview-api'
import { h } from 'vue'
import 'virtual:uno.css'
import 'floating-vue/dist/style.css'
import '@antfu/design/styles.css'
import './docs-dark.css'

// The manager (chrome) and preview (iframe) are separate documents. Toggle the
// preview root's `dark` class straight from the `theme` global so the whole
// surface — docs/MDX pages included, not just decorated stories — follows along.
addons.getChannel().on(GLOBALS_UPDATED, ({ globals }: { globals?: { theme?: string } }) => {
  document.documentElement.classList.toggle('dark', globals?.theme === 'dark')
})

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
    options: {
      // Overview lands first; the rest fall back to alphabetical.
      storySort: { order: ['Overview', 'Display', 'UI'] },
    },
  },
  globalTypes: {
    theme: {
      description: 'Color scheme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      const dark = context.globals.theme === 'dark'
      document.documentElement.classList.toggle('dark', dark)
      return () => h('div', { class: 'p-8 bg-base color-base font-sans' }, [h(story())])
    },
  ],
}

export default preview
