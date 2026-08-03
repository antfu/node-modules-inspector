import type { StorybookConfig } from '@storybook/vue3-vite'
import { fileURLToPath } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  // Stories are co-located next to the app's presentational components; the
  // Overview is one MDX page that references the others via doc blocks.
  stories: [
    '../src/app/components/**/*.mdx',
    '../src/app/components/**/*.stories.@(ts|js)',
  ],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/vue3-vite',
    // The app + `@antfu/design` ship raw `.vue`; disable Storybook's Vue docgen
    // so it doesn't re-parse plugin-vue-compiled output ("missing end tag").
    options: { docgen: false },
  },
  async viteFinal(base) {
    return mergeConfig(base, {
      // Storybook runs its own Vite (not Nuxt): add plugin-vue to compile SFCs
      // and reuse the app's UnoCSS config so tokens/fonts match the app exactly.
      plugins: [
        Vue(),
        Unocss({ configFile: fileURLToPath(new URL('../src/uno.config.ts', import.meta.url)) }),
      ],
      optimizeDeps: { exclude: ['@antfu/design'] },
    })
  },
}

export default config
