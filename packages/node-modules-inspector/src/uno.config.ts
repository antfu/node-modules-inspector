import { fileURLToPath } from 'node:url'
import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  shortcuts: {
    'color-base': 'color-neutral-800 dark:color-neutral-300',
    'bg-base': 'bg-white dark:bg-#111',
    'bg-base-active': 'bg-#eee dark:bg-#222',
    'border-base': 'border-#8882',

    'bg-tooltip': 'bg-white:75 dark:bg-#111:75 backdrop-blur-8',
    'bg-glass': 'bg-white:75 dark:bg-#111:75 backdrop-blur-5',
    'bg-code': 'bg-gray5:5',
    'bg-hover': 'bg-primary-400:5',

    'color-active': 'color-primary-600 dark:color-primary-400',
    'border-active': 'border-primary-600/25 dark:border-primary-400/25',
    'bg-active': 'bg-gray:10',

    'btn-action': 'border border-base rounded flex gap-2 items-center px2 py1 op75 hover:op100 hover:bg-hover',
    'btn-action-sm': 'btn-action text-sm',
    'btn-action-active': 'color-active border-active! bg-active op100!',

    'badge': 'border border-base rounded flex items-center px2',
    'badge-active': 'badge border-amber:50 text-amber bg-amber:5',
    'btn-badge': 'badge hover:bg-active',
  },
  theme: {
    colors: {
      primary: {
        50: '#E6F6FA',
        100: '#D1EEF5',
        200: '#9EDCEA',
        300: '#70CCE1',
        400: '#42BBD7',
        DEFAULT: '#42BBD7',
        500: '#279DB7',
        600: '#1F7E93',
        700: '#175E6D',
        800: '#0F3D47',
        900: '#082026',
        950: '#040E11',
      },
    },
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
    }),
    presetTypography(),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        mono: 'DM Mono',
      },
      processors: createLocalFontProcessor({
        fontAssetsDir: fileURLToPath(new URL('./app/public/fonts', import.meta.url)),
        fontServeBaseUrl: './fonts',
      }),
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})
